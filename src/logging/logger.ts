import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  ingest(): void {
    this.logger.log('Starting data ingestion');

    try {
      // ingestion logic will be added here
      this.logger.log('Data ingestion finished successfully');
    } catch (error) {
      this.logger.error('Error during data ingestion', error);
      throw error;
    }
  }
}
