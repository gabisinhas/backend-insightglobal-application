import { Injectable, Logger } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';

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
  private readonly parser: XMLParser = new XMLParser({ ignoreAttributes: false });

  /**
   * Parse raw makes XML and normalize into an array.
   */
  parseMakesXml(makesXml: string): any[] {
    const parsed = this.parser.parse(makesXml);
    const makes = parsed?.Response?.Results?.AllVehicleMakes ?? [];

    // Always return an array, even if single object
    return Array.isArray(makes) ? makes : [makes];
  }

  /**
   * Transform makes XML + vehicle types map into final payload.
   */
  transform(makesXml: string, vehicleTypesByMake: Map<string, string>): VehiclesPayload {
    const makesArray = this.parseMakesXml(makesXml);

    const makes: VehicleMake[] = makesArray.map((make: any) => {
      const typesXml = vehicleTypesByMake.get(make.Make_ID) ?? '';
      let vehicleTypes: { typeId: string; typeName: string }[] = [];

      if (typesXml) {
        try {
          const parsedTypes = this.parser.parse(typesXml);
          const typesArray = parsedTypes?.Response?.Results?.VehicleTypesForMakeIds ?? [];
          vehicleTypes = (Array.isArray(typesArray) ? typesArray : [typesArray]).map((t: any) => ({
            typeId: t.VehicleTypeId,
            typeName: t.VehicleTypeName,
          }));
        } catch (err) {
          this.logger.warn(`Failed to parse vehicle types for make ${make.Make_ID}`);
        }
      }

      return {
        makeId: make.Make_ID,
        makeName: make.Make_Name,
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
