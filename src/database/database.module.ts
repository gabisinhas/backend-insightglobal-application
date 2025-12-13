import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VehicleData, VehicleDataSchema } from './vehicle.schema';
import { VehicleRepository } from './vehicle.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VehicleData.name, schema: VehicleDataSchema },
    ]),
  ],
  providers: [VehicleRepository],
  exports: [VehicleRepository],
})
export class DatabaseModule {}
