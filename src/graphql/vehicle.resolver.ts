import { Resolver, Query } from '@nestjs/graphql';
import { VehicleRepository } from '../database/vehicle.repository';
import { VehiclesPayload } from './vehicle.types';

@Resolver()
export class VehicleResolver {
  constructor(private readonly repository: VehicleRepository) {}

  @Query(() => VehiclesPayload)
  async vehicles(): Promise<VehiclesPayload> {
    const data = await this.repository.getData();

    if (!data) {
      return {
        generatedAt: new Date().toISOString(),
        totalMakes: 0,
        makes: [],
      };
    }

    return {
      generatedAt: data.generatedAt,
      totalMakes: data.totalMakes,
      makes: data.makes.map((make) => ({
        ...make,
        makeId: make.makeId,
        vehicleTypes: make.vehicleTypes.map((type) => ({
          ...type,
          typeId: type.typeId,
        })),
      })),
    };
  }
}
