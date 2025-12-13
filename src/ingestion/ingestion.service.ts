import { Injectable, Logger } from '@nestjs/common';
import { parseStringPromise } from 'xml2js';
import { XmlClient } from './xml.client';
import { VehicleRepository } from '../database/vehicle.repository';
import {
  VehicleMake,
  VehicleType,
  VehicleData,
} from '../database/vehicle.schema';

interface RawVehicleType {
  VehicleTypeId: string[];
  VehicleTypeName: string[];
}

interface RawMake {
  Make_ID: string[];
  Make_Name: string[];
}

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  private readonly maxRetries = 3;

  constructor(
    private readonly xmlClient: XmlClient,
    private readonly vehicleRepository: VehicleRepository,
  ) {}

  async ingestAllVehicleData(): Promise<void> {
    try {
      const allMakesXml = await this.xmlClient.fetchAllMakes();
      const makes: VehicleMake[] = await this.parseMakesXml(allMakesXml);

      this.logger.log(`Starting loop for ${makes.length} makes...`);

      if (makes.length === 0) {
        this.logger.error(
          'WARNING: Makes list came back empty! Check the XML structure.',
        );
        return;
      }

      const limitedMakes = makes.slice(0, 50);

      for (const make of limitedMakes) {
        let attempt = 0;
        let success = false;

        while (attempt < this.maxRetries && !success) {
          try {
            attempt++;
            const typesXml = await this.xmlClient.fetchVehicleTypes(
              Number(make.makeId),
            );

            make.vehicleTypes = await this.parseTypesXml(typesXml);

            await this.vehicleRepository.upsertVehicleMake(make);
            success = true;
          } catch (err) {
            this.logger.error(
              `Error fetching types for makeId=${make.makeId}, attempt ${attempt}`,
              err instanceof Error ? err.stack : String(err),
            );
          }
        }
      }

      const vehicleData: VehicleData = {
        generatedAt: new Date().toISOString(),
        totalMakes: limitedMakes.length,
        makes: limitedMakes,
      };

      await this.vehicleRepository.upsertVehicleData(vehicleData);
      this.logger.log('Ingestion completed successfully');
    } catch (err) {
      this.logger.error(
        'Error during full ingestion',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  private async parseMakesXml(xml: string): Promise<VehicleMake[]> {
    const json = await parseStringPromise(xml);

    const rawMakes: RawMake[] =
      json?.Response?.Results?.[0]?.AllVehicleMakes || [];

    this.logger.log(`XML parsed. Raw items found: ${rawMakes.length}`);

    return rawMakes
      .map((m) => ({
        makeId: m.Make_ID ? m.Make_ID[0] : '',
        makeName: m.Make_Name ? m.Make_Name[0] : 'Unknown',
        vehicleTypes: [],
      }))
      .filter((m) => m.makeId !== '');
  }
  private async parseTypesXml(xml: string): Promise<VehicleType[]> {
    const json = await parseStringPromise(xml);

    const rawTypes = json?.Response?.Results?.[0]?.VehicleTypesForMakeIds || [];

    return rawTypes
      .map((t: any) => ({
        typeId: t.VehicleTypeId ? t.VehicleTypeId[0] : '',
        typeName: t.VehicleTypeName ? t.VehicleTypeName[0] : 'Unknown',
      }))
      .filter((t: any) => t.typeId !== '');
  }
}
