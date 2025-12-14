import { Resolver, Query } from '@nestjs/graphql';
import { Logger, InternalServerErrorException } from '@nestjs/common';
import { VehicleRepository } from '../database/vehicle.repository';
import { VehiclesPayload } from './vehicle.types';

@Resolver()
export class VehicleResolver {
  private readonly logger = new Logger(VehicleResolver.name);

  constructor(private readonly repository: VehicleRepository) {}

  @Query(() => VehiclesPayload, {
    name: 'vehicles',
    description:
      'Retrieves the unified structure of vehicle metadata and manufacturers',
  })
  async vehicles(): Promise<VehiclesPayload> {
    try {
      const [metadata, allMakes] = await Promise.all([
        this.repository.getLatestData(),
        this.repository.findAllMakes(),
      ]);

      if (!metadata && allMakes.length === 0) {
        this.logger.warn('No vehicle data found in the database.');
        return {
          generatedAt: new Date().toISOString(),
          totalMakes: 0,
          makes: [],
        };
      }

      this.logger.log(
        `Query processed successfully: ${allMakes.length} makes returned.`,
      );

      return {
        generatedAt: metadata?.generatedAt ?? new Date().toISOString(),
        totalMakes: metadata?.totalMakes ?? allMakes.length,
        makes: allMakes,
      };
    } catch (error) {
      this.logger.error('Failed to resolve vehicles query', error.stack);
      throw new InternalServerErrorException(
        'An unexpected error occurred while processing vehicle data',
      );
    }
  }
}
