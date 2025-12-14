import { Injectable, Logger } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { ensureArray } from '../utils/array';

// Interfaces para tipagem do XML bruto
interface RawMake {
  Make_ID: string;
  Make_Name: string;
}

interface RawVehicleType {
  VehicleTypeId: string;
  VehicleTypeName: string;
}

interface XmlResponse<T> {
  Response?: {
    Results?: T;
  };
}

export interface VehicleMake {
  makeId: string;
  makeName: string;
  vehicleTypes: {
    typeId: string;
    typeName: string;
  }[];
}

export interface VehiclesPayload {
  generatedAt: string;
  totalMakes: number;
  makes: VehicleMake[];
}

@Injectable()
export class VehicleTransformer {
  private readonly logger = new Logger(VehicleTransformer.name);
  private readonly parser: XMLParser = new XMLParser({
    ignoreAttributes: false,
  });

  /**
   * Parse raw makes XML and normalize into an array of objects
   */
  parseMakesXml(makesXml: string): RawMake[] {
    try {
      // Cast duplo para satisfazer o ESLint (any -> unknown -> Type)
      const parsed = this.parser.parse(makesXml) as unknown as XmlResponse<{
        AllVehicleMakes: RawMake | RawMake[];
      }>;
      const makes = parsed?.Response?.Results?.AllVehicleMakes ?? [];

      return Array.isArray(makes) ? makes : [makes];
    } catch (err) {
      this.logger.error(
        'Failed to parse makes XML',
        err instanceof Error ? err.stack : JSON.stringify(err),
      );
      throw new Error('Invalid makes XML');
    }
  }

  /**
   * Transform makes XML + vehicle types map into final payload
   */
  transform(
    makesXml: string,
    vehicleTypesByMake: Map<string, string>,
  ): VehiclesPayload {
    const makesArray = this.parseMakesXml(makesXml);

    const makes: VehicleMake[] = makesArray.map((make) => {
      const typesXml = vehicleTypesByMake.get(String(make.Make_ID)) ?? '';
      let vehicleTypes: { typeId: string; typeName: string }[] = [];

      if (typesXml) {
        try {
          const parsedTypes = this.parser.parse(
            typesXml,
          ) as unknown as XmlResponse<{
            VehicleTypesForMakeIds: RawVehicleType | RawVehicleType[];
          }>;

          const typesArray = ensureArray<RawVehicleType>(
            parsedTypes?.Response?.Results?.VehicleTypesForMakeIds,
          );

          vehicleTypes = typesArray.map((t) => ({
            typeId: String(t.VehicleTypeId),
            typeName: String(t.VehicleTypeName),
          }));
        } catch (err) {
          this.logger.warn(
            `Failed to parse vehicle types for make ${make.Make_ID}: ${
              err instanceof Error ? err.message : JSON.stringify(err)
            }`,
          );
        }
      }

      return {
        makeId: String(make.Make_ID),
        makeName: String(make.Make_Name),
        vehicleTypes,
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      totalMakes: makes.length,
      makes,
    };
  }
}
