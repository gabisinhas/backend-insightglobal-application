import { Injectable } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { ensureArray } from '../utils/array';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  RawMake,
  ParsedVehicleMake,
  ParsedVehicleType,
} from './vehicle.interfaces';

interface RawVehicleType {
  VehicleTypeId: string | number;
  VehicleTypeName: string;
}

interface XmlResponse<T> {
  Response?: {
    Results?: T;
  };
  Results?: T;
}

@Injectable()
export class VehicleTransformer {
  private readonly parser = new XMLParser({ ignoreAttributes: false });

  constructor(
    @InjectPinoLogger(VehicleTransformer.name)
    private readonly logger: PinoLogger,
  ) {}

  parseMakes(xml: string): ParsedVehicleMake[] {
    const parsed = this.parser.parse(xml) as XmlResponse<{
      AllVehicleMakes: RawMake | RawMake[];
    }>;
    const allMakes =
      parsed?.Response?.Results?.AllVehicleMakes ??
      parsed?.Results?.AllVehicleMakes ??
      [];
    const rawMakes = ensureArray<RawMake>(allMakes);

    return rawMakes.map((m) => ({
      makeId: String(m.Make_ID),
      makeName: String(m.Make_Name),
      vehicleTypes: [],
    }));
  }

  parseVehicleTypes(xml: string): ParsedVehicleType[] {
    const parsed = this.parser.parse(xml) as XmlResponse<{
      VehicleTypesForMakeIds: RawVehicleType | RawVehicleType[];
    }>;

    const rawTypes = ensureArray<RawVehicleType>(
      parsed?.Response?.Results?.VehicleTypesForMakeIds ??
        parsed?.Results?.VehicleTypesForMakeIds ??
        [],
    );

    return rawTypes.map((t: RawVehicleType) => {
      if (t.VehicleTypeId !== undefined && t.VehicleTypeName !== undefined) {
        return {
          typeId: String(t.VehicleTypeId),
          typeName: String(t.VehicleTypeName),
        };
      } else {
        this.logger.warn({ data: t }, 'Invalid vehicle type data');
        throw new Error('Invalid vehicle type data');
      }
    });
  }
}

export type { ParsedVehicleMake };
