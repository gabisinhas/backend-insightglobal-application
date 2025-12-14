import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  VehicleMake,
  VehicleMakeSchema,
  VehicleDataEntity,
  VehicleDataSchema,
} from './vehicle.schema';
import { VehicleRepository } from './vehicle.repository';

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
  ],
  providers: [VehicleRepository],
  exports: [VehicleRepository],
})
export class DatabaseModule {}
