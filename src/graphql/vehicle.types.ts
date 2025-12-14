import { ObjectType, Field, Int } from '@nestjs/graphql';
import { VehicleMake } from '../database/vehicle.schema'; // Import the existing class

@ObjectType()
export class VehiclesPayload {
  @Field()
  generatedAt: string;

  @Field(() => Int)
  totalMakes: number;

  @Field(() => [VehicleMake])
  makes: VehicleMake[];
}
