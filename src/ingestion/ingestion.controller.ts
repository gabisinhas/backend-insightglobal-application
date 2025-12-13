import { Controller, Post, HttpCode, Logger } from '@nestjs/common';
import { IngestionService } from './ingestion.service';

@Controller('ingestion')
export class IngestionController {
  private readonly logger = new Logger(IngestionController.name);

  constructor(private readonly ingestionService: IngestionService) {}

  @Post()
  @HttpCode(200)
  async ingest(): Promise<{ message: string }> {
    this.logger.log('Manual ingestion triggered via API');
    await this.ingestionService.ingestAllVehicleData();
    this.logger.log('Manual ingestion completed successfully');
    return { message: 'Ingestion completed successfully' };
  }
}
