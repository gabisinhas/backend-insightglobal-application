import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { IngestionService } from './ingestion.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly ingestionService: IngestionService) {}

  // Método auxiliar para evitar repetição de try/catch
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

  // Ingestão inicial ao subir a aplicação
  async onModuleInit() {
    await this.runIngestion('Initial');
  }

  // Ingestão diária agendada
  // Pode parametrizar o cron via ENV: INGESTION_CRON="0 2 * * *"
  @Cron(process.env.INGESTION_CRON || '0 2 * * *')
  async handleDailyIngestion() {
    await this.runIngestion('Scheduled');
  }
}
