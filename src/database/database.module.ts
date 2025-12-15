import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  VehicleMake,
  VehicleMakeSchema,
  VehicleDataEntity,
  VehicleDataSchema,
} from './vehicle.schema';
import { VehicleRepository } from './vehicle.repository';
import { LoggingModule } from '../logging/logging.module';
import { DataSeeder } from './data.seeder';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: VehicleMake.name,
        schema: VehicleMakeSchema,
      },
      {
        name: VehicleDataEntity.name,
        schema: VehicleDataSchema,
      },
    ]),
    LoggingModule,
  ],
  providers: [VehicleRepository, DataSeeder],
  exports: [VehicleRepository],
})
export class DatabaseModule {}
