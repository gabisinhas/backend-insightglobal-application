import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class VehicleType {
  @Field()
  typeId: string;

  @Field()
  typeName: string;
}

@ObjectType()
export class VehicleMake {
  @Field()
  makeId: string;

  @Field()
  makeName: string;

  @Field(() => [VehicleType])
  vehicleTypes: VehicleType[];
}

@ObjectType()
export class VehiclesPayload {
  @Field()
  generatedAt: string;

  @Field(() => Number)
  totalMakes: number;

  @Field(() => [VehicleMake])
  makes: VehicleMake[];
}
