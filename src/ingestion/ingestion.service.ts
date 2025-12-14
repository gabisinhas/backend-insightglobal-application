import { Injectable, Logger } from '@nestjs/common';
import { parseStringPromise } from 'xml2js';
import { XmlClient } from './xml.client';
import { VehicleRepository } from '../database/vehicle.repository';
import {
  VehicleMake,
  VehicleType,
  VehicleData,
} from '../database/vehicle.schema';

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
    // Hack para evitar o erro 'Unsafe call' do ESLint com xml2js
    const parser = parseStringPromise as (xmlStr: string) => Promise<unknown>;
    const parsed = await parser(xml);

    const json = parsed as XmlResponse<{
      AllVehicleMakes: RawMake[];
    }>;

    const results = json?.Response?.Results;
    const rawMakes =
      results && results.length > 0 ? results[0].AllVehicleMakes : [];

    this.logger.log(`XML parsed. Raw items found: ${rawMakes?.length || 0}`);

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
    // Hack para evitar o erro 'Unsafe call' do ESLint com xml2js
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
