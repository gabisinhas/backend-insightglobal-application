import { Resolver, Query } from '@nestjs/graphql';
import { VehicleRepository } from '../database/vehicle.repository';
import { VehicleData } from '../database/vehicle.schema';
import { LoggerService } from '../logging/logger.service';

@Resolver(() => VehicleData)
export class VehicleResolver {
  constructor(
    private readonly vehicleRepository: VehicleRepository,
    private readonly logger: LoggerService,
  ) {}

  @Query(() => VehicleData, { name: 'vehicles', nullable: true })
  async getVehicles(): Promise<VehicleData | null> {
    const [data, makes] = await Promise.all([
      this.vehicleRepository.getLatestData(),
      this.vehicleRepository.findAllMakes(),
    ]);

    if (!data) {
      return null;
    }

    this.logger.info('Vehicle data retrieved successfully');

    return {
      identifier: data.identifier,
      totalMakes: data.totalMakes,
      lastUpdated: new Date(data.generatedAt),
      makes: makes ?? [],
    };
  }

  async resolveVehicleQuery(args: any) {
    this.logger.info(
      'VehicleResolver: Resolving vehicle query',
      JSON.stringify(args),
    );
    try {
      const [data, makes] = await Promise.all([
        this.vehicleRepository.getLatestData(),
        this.vehicleRepository.findAllMakes(),
      ]);

      if (!data) {
        return null;
      }

      this.logger.info('VehicleResolver: Vehicle query resolved successfully');

      return {
        identifier: data.identifier,
        totalMakes: data.totalMakes,
        lastUpdated: new Date(data.generatedAt),
        makes: makes ?? [],
      };
    } catch (error) {
      this.logger.error(
        'VehicleResolver: Failed to resolve vehicle query',
        error.stack,
      );
      throw error;
    }
  }
}
