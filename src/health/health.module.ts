import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [LoggingModule],
  controllers: [HealthController],
})
export class HealthModule {}
