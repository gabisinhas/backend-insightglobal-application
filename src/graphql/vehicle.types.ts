import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class VehicleMakeType {
  @Field(() => Int)
  makeId: number;

  @Field()
  makeName: string;
}

@ObjectType()
export class VehicleData {
  @Field()
  identifier: string;

  @Field(() => Int)
  totalMakes: number;

  @Field()
  lastUpdated: Date;

  @Field(() => [VehicleMakeType], { nullable: 'items' })
  makes: VehicleMakeType[];
}
