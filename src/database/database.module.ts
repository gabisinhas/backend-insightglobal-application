import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  VehicleMake,
  VehicleMakeSchema,
  VehicleDataEntity,
  VehicleDataSchema,
} from './vehicle.schema';
import { VehicleRepository } from './vehicle.repository';
import { LoggingModule } from '../logging/logging.module'; // Import LoggingModule
import { DataSeeder } from './data.seeder'; // Import DataSeeder

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
    LoggingModule, // Add LoggingModule to imports
  ],
  providers: [VehicleRepository, DataSeeder], // Add DataSeeder to providers
  exports: [VehicleRepository],
})
export class DatabaseModule {}
