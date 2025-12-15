import { Injectable, OnModuleInit } from '@nestjs/common';
import { VehicleRepository } from './vehicle.repository';

@Injectable()
export class DataSeeder implements OnModuleInit {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async onModuleInit(): Promise<void> {
    await this.seedVehicleMetadata();
  }

  private async seedVehicleMetadata(): Promise<void> {
    const metadata = {
      identifier: 'GLOBAL_SUMMARY',
      totalMakes: await this.vehicleRepository
        .findAllMakes()
        .then((makes) => makes.length),
      generatedAt: new Date().toISOString(),
    };

    await this.vehicleRepository.upsertVehicleData(metadata);
    console.log('Vehicle metadata seeded successfully');
  }
}
