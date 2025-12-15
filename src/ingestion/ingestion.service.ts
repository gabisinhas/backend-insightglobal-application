import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { XmlClient } from './xml.client';
import { VehicleRepository } from '../database/vehicle.repository';
import { VehicleTransformer, ParsedVehicleMake } from './vehicle.transformer';
import { config } from '../config';
import { LoggerService } from '../logging/logger.service';
import pLimit from 'p-limit';

@Injectable()
export class IngestionService {
  // Safe default: 2 concurrent requests if config is missing
  private readonly concurrencyLimiter = pLimit(
    config?.XML_FETCH_CONCURRENCY ?? 2,
  );

  constructor(
    private readonly xmlClient: XmlClient,
    private readonly vehicleRepository: VehicleRepository,
    private readonly transformer: VehicleTransformer,
    private readonly logger: LoggerService,
  ) {}

  ingestAllVehicleData = async (): Promise<void> => {
    try {
      this.logger.info('Starting ingestion of all vehicle data');

      const allMakesXml = await this.xmlClient.fetchAllMakes();
      this.logger.info('Fetched all makes XML');

      const parsedMakes: ParsedVehicleMake[] =
        this.transformer.parseMakes(allMakesXml);
      this.logger.info('Parsed vehicle makes');

      if (!parsedMakes.length) {
        this.logger.warn('No makes found after XML transformation');
        return;
      }

      // Safe default: batchSize = 1
      const batchSize = config?.XML_FETCH_BATCH_SIZE ?? 1;
      const batches = this.createBatches(parsedMakes, batchSize);
      this.logger.info({
        msg: 'Created batches for processing',
        batchSize,
        totalBatches: batches.length,
      });

      for (const [index, batch] of batches.entries()) {
        this.logger.info({
          msg: 'Processing batch',
          batchNumber: index + 1,
          batchSize: batch.length,
        });

        const tasks = batch.map((make) =>
          this.concurrencyLimiter(() => this.ingestMakeWithRetries(make)),
        );

        await Promise.all(tasks);

        // Optional: delay between batches to reduce API load
        await new Promise((r) => setTimeout(r, 500)); // 0.5s
      }

      await this.vehicleRepository.upsertVehicleData({
        generatedAt: new Date().toISOString(),
        totalMakes: parsedMakes.length,
      });

      this.logger.info('Ingestion completed successfully');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error({
        msg: 'Fatal error during ingestion',
        err: errorMessage,
      });
      throw new InternalServerErrorException('Ingestion process failed');
    }
  };

  private ingestMakeWithRetries = async (
    make: ParsedVehicleMake,
  ): Promise<void> => {
    let attempt = 0;
    const maxRetries = config?.XML_FETCH_RETRIES ?? 3;

    while (attempt < maxRetries) {
      attempt++;
      try {
        this.logger.info({
          msg: 'Fetching vehicle types for make',
          makeId: make.makeId,
          attempt,
        });

        const typesXml = await this.xmlClient.fetchVehicleTypes(
          Number(make.makeId),
        );

        this.logger.info('Fetched vehicle types XML');
        const vehicleTypes = this.transformer.parseVehicleTypes(typesXml);

        if (!Array.isArray(vehicleTypes)) {
          throw new Error('Parsed vehicle types is not an array');
        }

        make.vehicleTypes = vehicleTypes;
        await this.vehicleRepository.upsertVehicleMake(make);
        this.logger.info({
          msg: 'Successfully ingested make',
          makeId: make.makeId,
        });
        return;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);

        this.logger.error({
          msg: 'Failed to ingest make',
          makeId: make.makeId,
          attempt,
          err: errorMessage,
        });

        if (attempt >= maxRetries) {
          this.logger.warn({
            msg: 'Giving up on this make',
            makeId: make.makeId,
          });
          return;
        }

        const delay = 1000 * 2 ** (attempt - 1);
        this.logger.info({
          msg: 'Retrying ingestion after delay',
          makeId: make.makeId,
          delayMs: delay,
        });
        await new Promise((r) => setTimeout(r, delay));
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
