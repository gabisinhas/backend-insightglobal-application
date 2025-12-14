export interface RawMake {
  Make_ID: string;
  Make_Name: string;
}

export interface ParsedVehicleMake {
  makeId: string;
  makeName: string;
  vehicleTypes: ParsedVehicleType[];
}

export interface ParsedVehicleType {
  typeId: string;
  typeName: string;
}
