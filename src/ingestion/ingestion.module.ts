import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { XmlClient } from './xml.client';
import { DatabaseModule } from '../database/database.module';
import { VehicleTransformer } from './vehicle.transformer';
import { SchedulerService } from './scheduler.service';
import { IngestionController } from './ingestion.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [IngestionController],
  providers: [
    IngestionService,
    XmlClient,
    VehicleTransformer,
    SchedulerService,
  ],
  exports: [IngestionService],
})
export class IngestionModule {}
