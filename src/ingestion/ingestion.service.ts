import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { parseStringPromise } from 'xml2js';
import { XmlClient } from './xml.client';
import { VehicleRepository } from '../database/vehicle.repository';
import { VehicleMake, VehicleType } from '../database/vehicle.schema';

interface RawMake {
  Make_ID: string[];
  Make_Name: string[];
}

interface RawVehicleType {
  VehicleTypeId: string[];
  VehicleTypeName: string[];
}

interface XmlResponse<T> {
  Response: {
    Results: T[];
  };
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

      if (makes.length === 0) {
        this.logger.error('No makes found in XML structure');
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

      await this.vehicleRepository.upsertVehicleData({
        generatedAt: new Date().toISOString(),
        totalMakes: limitedMakes.length,
      });

      this.logger.log('Ingestion completed successfully');
    } catch (err) {
      this.logger.error(
        'Error during full ingestion',
        err instanceof Error ? err.stack : String(err),
      );
      throw new InternalServerErrorException('Ingestion process failed');
    }
  }

  private async parseMakesXml(xml: string): Promise<VehicleMake[]> {
    const parser = parseStringPromise as (xmlStr: string) => Promise<unknown>;
    const parsed = await parser(xml);

    const json = parsed as XmlResponse<{
      AllVehicleMakes: RawMake[];
    }>;

    const results = json?.Response?.Results;
    const rawMakes =
      results && results.length > 0 ? results[0].AllVehicleMakes : [];

    if (!rawMakes) return [];

    return rawMakes
      .map((m: RawMake) => ({
        makeId: m.Make_ID ? String(m.Make_ID[0]) : '',
        makeName: m.Make_Name ? String(m.Make_Name[0]) : 'Unknown',
        vehicleTypes: [],
      }))
      .filter((m) => m.makeId !== '');
  }

  private async parseTypesXml(xml: string): Promise<VehicleType[]> {
    const parser = parseStringPromise as (xmlStr: string) => Promise<unknown>;
    const parsed = await parser(xml);

    const json = parsed as XmlResponse<{
      VehicleTypesForMakeIds: RawVehicleType[];
    }>;

    const results = json?.Response?.Results;
    const rawTypes =
      results && results.length > 0 ? results[0].VehicleTypesForMakeIds : [];

    if (!rawTypes) return [];

    return rawTypes
      .map((t: RawVehicleType) => ({
        typeId: t.VehicleTypeId ? String(t.VehicleTypeId[0]) : '',
        typeName: t.VehicleTypeName ? String(t.VehicleTypeName[0]) : 'Unknown',
      }))
      .filter((t) => t.typeId !== '');
  }
}
