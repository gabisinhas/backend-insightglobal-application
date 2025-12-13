import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  VehicleMake,
  VehicleMakeSchema,
  VehicleData,
  VehicleDataSchema,
} from './vehicle.schema';
import { VehicleRepository } from './vehicle.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VehicleMake.name, schema: VehicleMakeSchema },
      { name: VehicleData.name, schema: VehicleDataSchema }, // <- add this
    ]),
  ],
  providers: [VehicleRepository],
  exports: [VehicleRepository],
})
export class DatabaseModule {}
