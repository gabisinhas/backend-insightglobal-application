import { Resolver, Query } from '@nestjs/graphql';
import { VehicleRepository } from '../database/vehicle.repository';
import { VehicleData } from '../database/vehicle.schema';

@Resolver(() => VehicleData)
export class VehicleResolver {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  @Query(() => VehicleData, { name: 'vehicles', nullable: true })
  async getVehicles(): Promise<VehicleData | null> {
    const [data, makes] = await Promise.all([
      this.vehicleRepository.getLatestData(),
      this.vehicleRepository.findAllMakes(),
    ]);

    if (!data) {
      return null;
    }

    return {
      identifier: data.identifier,
      totalMakes: data.totalMakes,
      lastUpdated: new Date(data.generatedAt),
      makes: makes ?? [],
    };
  }
}
