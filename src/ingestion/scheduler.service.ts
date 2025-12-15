import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { IngestionService } from './ingestion.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly ingestionService: IngestionService) {}

  private async runIngestion(description: string) {
    this.logger.log(`${description} ingestion started...`);
    try {
      await this.ingestionService.ingestAllVehicleData();
      this.logger.log(`${description} ingestion completed successfully`);
    } catch (err) {
      this.logger.error(
        `${description} ingestion failed`,
        err instanceof Error ? err.stack : JSON.stringify(err),
      );
    }
  }

  // Removed initial ingestion on application startup
  onModuleInit() {
    this.logger.log('SchedulerService initialized');
  }

  // Scheduled daily ingestion
  // You can parameterize the cron via ENV: INGESTION_CRON="0 2 * * *"
  @Cron(process.env.INGESTION_CRON || '0 2 * * *')
  async handleDailyIngestion() {
    await this.runIngestion('Scheduled');
  }
}
