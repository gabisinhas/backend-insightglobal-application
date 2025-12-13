import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { XmlClient } from './xml.client';
import { DatabaseModule } from '../database/database.module';
import { VehicleTransformer } from './vehicle.transformer';

@Module({
  imports: [DatabaseModule],
  providers: [IngestionService, XmlClient, VehicleTransformer],
  exports: [IngestionService],
})
export class IngestionModule {}
