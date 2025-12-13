import { Controller, Post, HttpCode } from '@nestjs/common';
import { IngestionService } from './ingestion.service';

@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post()
  @HttpCode(202)
  async ingest(): Promise<void> {
    await this.ingestionService.ingest();
  }
}
