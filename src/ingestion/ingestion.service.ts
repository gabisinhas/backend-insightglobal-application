import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { XmlClient } from './xml.client';
import { VehicleRepository } from '../database/vehicle.repository';
import { VehicleTransformer, ParsedVehicleMake } from './vehicle.transformer';
import { config } from '../config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import pLimit from 'p-limit';

@Injectable()
export class IngestionService {
  private readonly concurrencyLimiter = pLimit(
    config?.XML_FETCH_CONCURRENCY ?? 1,
  );

  constructor(
    private readonly xmlClient: XmlClient,
    private readonly vehicleRepository: VehicleRepository,
    private readonly transformer: VehicleTransformer,
    @InjectPinoLogger(IngestionService.name)
    private readonly logger: PinoLogger,
  ) {}

  ingestAllVehicleData = async (): Promise<void> => {
    try {
      const allMakesXml = await this.xmlClient.fetchAllMakes();
      const parsedMakes: ParsedVehicleMake[] =
        this.transformer.parseMakes(allMakesXml);

      if (!parsedMakes.length) {
        this.logger.warn('No makes found after XML transformation');
        return;
      }

      const batchSize = config?.XML_FETCH_BATCH_SIZE ?? 1;
      const batches = this.createBatches(parsedMakes, batchSize);

      for (const [index, batch] of batches.entries()) {
        this.logger.info(
          { batch: index + 1, size: batch.length },
          'Processing batch',
        );

        const tasks = batch.map((make) =>
          this.concurrencyLimiter(() => this.ingestMakeWithRetries(make)),
        );

        await Promise.all(tasks);
      }

      await this.vehicleRepository.upsertVehicleData({
        generatedAt: new Date().toISOString(),
        totalMakes: parsedMakes.length,
      });

      this.logger.info('Ingestion completed successfully');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error({ err: errorMessage }, 'Fatal error during ingestion');
      throw new InternalServerErrorException('Ingestion process failed');
    }
  };

  private ingestMakeWithRetries = async (
    make: ParsedVehicleMake,
  ): Promise<void> => {
    let attempt = 0;
    while (attempt < (config?.XML_FETCH_RETRIES ?? 1)) {
      attempt++;
      try {
        const typesXml = await this.xmlClient.fetchVehicleTypes(
          Number(make.makeId),
        );
        const vehicleTypes = this.transformer.parseVehicleTypes(typesXml);

        if (Array.isArray(vehicleTypes)) {
          make.vehicleTypes = vehicleTypes;
          await this.vehicleRepository.upsertVehicleMake(make);
          return;
        } else {
          throw new Error('Parsed vehicle types is not an array');
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);

        this.logger.error(
          { makeId: make.makeId, attempt, err: errorMessage },
          'Failed to ingest make',
        );

        if (attempt >= (config?.XML_FETCH_RETRIES ?? 1)) {
          this.logger.warn({ makeId: make.makeId }, 'Giving up on this make');
          return;
        }

        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  };

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
}
