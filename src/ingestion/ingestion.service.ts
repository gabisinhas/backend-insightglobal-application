import { Injectable, Logger } from '@nestjs/common';
import { XmlClient } from './xml.client';
import { VehicleTransformer } from './vehicle.transformer';
import { VehicleRepository } from '../database/vehicle.repository';
import { VehiclesPayload } from '../graphql/vehicle.types';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  private readonly BATCH_SIZE = 50; // Number of makes to fetch concurrently

  constructor(
    private readonly xmlClient: XmlClient,
    private readonly transformer: VehicleTransformer,
    private readonly repository: VehicleRepository,
  ) {}

  async ingest(): Promise<void> {
    this.logger.log('Starting vehicle data ingestion');

    let makesXml: string;
    try {
      makesXml = await this.xmlClient.fetchAllMakes();
      this.logger.log('Fetched all vehicle makes XML successfully');
    } catch (error) {
      this.logger.error(
        'Failed to fetch all vehicle makes',
        error instanceof Error ? error.stack : JSON.stringify(error),
      );
      throw new Error('Ingestion failed at fetching makes');
    }

    const vehicleTypesByMake: Map<string, string> = new Map();

    // Parse all makes
    const makesArray = this.transformer.parseMakesXml(makesXml);

    this.logger.log(`Total makes to process: ${makesArray.length}`);

    // Process in batches
    for (let i = 0; i < makesArray.length; i += this.BATCH_SIZE) {
      const batch = makesArray.slice(i, i + this.BATCH_SIZE);

      this.logger.log(`Processing batch ${i / this.BATCH_SIZE + 1} (size=${batch.length})`);

      await Promise.all(
        batch.map(async (make) => {
          try {
            const typesXml = await this.xmlClient.fetchVehicleTypesForMake(Number(make.Make_ID));
            vehicleTypesByMake.set(make.Make_ID, typesXml);
            this.logger.debug(`Fetched types for make ${make.Make_ID}`);
          } catch (err) {
            this.logger.warn(
              `Failed to fetch vehicle types for make ${make.Make_ID}`,
              err instanceof Error ? err.stack : JSON.stringify(err),
            );
          }
        }),
      );
    }

    this.logger.log(`Fetched vehicle types for ${vehicleTypesByMake.size} makes`);

    // Transform all XML into JSON payload
    let payload: VehiclesPayload;
    try {
      payload = this.transformer.transform(makesXml, vehicleTypesByMake);
      this.logger.log(`Transformed payload successfully. Total makes: ${payload.totalMakes}`);
    } catch (error) {
      this.logger.error(
        'Failed to transform XML to JSON',
        error instanceof Error ? error.stack : JSON.stringify(error),
      );
      throw new Error('Ingestion failed at transformation step');
    }

    // Save payload to MongoDB
    try {
      await this.repository.replaceData(payload);
      this.logger.log('Payload saved to database successfully');
    } catch (error) {
      this.logger.error(
        'Failed to save payload to database',
        error instanceof Error ? error.stack : JSON.stringify(error),
      );
      throw new Error('Ingestion failed at database persistence step');
    }

    this.logger.log('Vehicle data ingestion completed successfully');
  }
}
