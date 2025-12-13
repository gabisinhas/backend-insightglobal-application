import { Resolver, Query } from '@nestjs/graphql';
import { VehicleRepository } from '../database/vehicle.repository';
import { VehiclesPayload } from './vehicle.types';

@Resolver()
export class VehicleResolver {
  constructor(private readonly repository: VehicleRepository) {}

  @Query(() => VehiclesPayload)
  async vehicles(): Promise<VehiclesPayload> {
    const latest = await this.repository.getLatestData();

    if (!latest) {
      console.log(
        '--- ALERTA: Nenhum documento com marcas encontrado no MongoDB ---',
      );
      return {
        generatedAt: new Date().toISOString(),
        totalMakes: 0,
        makes: [],
      };
    }

    console.log(
      `--- SUCESSO: Documento encontrado com ${latest.makes.length} marcas ---`,
    );

    return {
      generatedAt: latest.generatedAt || new Date().toISOString(),
      totalMakes: latest.totalMakes || latest.makes.length,
      makes: latest.makes,
    };
  }
}
