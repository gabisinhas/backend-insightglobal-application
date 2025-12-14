import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Field, ObjectType, ID, Int } from '@nestjs/graphql';

/* -------------------------------------------------------------------------- */
/*                               Vehicle Type                                 */
/* -------------------------------------------------------------------------- */

@ObjectType()
@Schema({ _id: false })
export class VehicleType {
  @Field()
  @Prop({ required: true })
  typeId: string;

  @Field()
  @Prop({ required: true })
  typeName: string;
}

export const VehicleTypeSchema = SchemaFactory.createForClass(VehicleType);

/* -------------------------------------------------------------------------- */
/*                               Vehicle Make                                 */
/* -------------------------------------------------------------------------- */

export type VehicleMakeDocument = VehicleMake & Document;

@ObjectType()
@Schema({ collection: 'vehicle_makes', timestamps: true })
export class VehicleMake {
  @Field(() => ID)
  @Prop({ required: true, unique: true, index: true })
  makeId: string;

  @Field()
  @Prop({ required: true })
  makeName: string;

  @Field(() => [VehicleType])
  @Prop({ type: [VehicleTypeSchema], default: [] })
  vehicleTypes: VehicleType[];
}

export const VehicleMakeSchema = SchemaFactory.createForClass(VehicleMake);

/* -------------------------------------------------------------------------- */
/*                          Vehicle Data (Metadata)                            */
/* -------------------------------------------------------------------------- */

/**
 * ⚠️ Persisted entity
 * Stores only metadata / summary info
 */
export type VehicleDataDocument = VehicleDataEntity & Document;

@Schema({ collection: 'vehicles_metadata', timestamps: true })
export class VehicleDataEntity {
  @Prop({ required: true, unique: true })
  identifier: string;

  @Prop({ required: true })
  generatedAt: string;

  @Prop({ required: true })
  totalMakes: number;
}

export const VehicleDataSchema =
  SchemaFactory.createForClass(VehicleDataEntity);

/* -------------------------------------------------------------------------- */
/*                          GraphQL Response Model                             */
/* -------------------------------------------------------------------------- */

/**
 * ✅ GraphQL contract returned by the `vehicles` query
 * Combines persisted metadata + related makes
 */
@ObjectType()
export class VehicleData {
  @Field()
  identifier: string;

  @Field(() => Int)
  totalMakes: number;

  @Field()
  lastUpdated: Date;

  @Field(() => [VehicleMake])
  makes: VehicleMake[];
}
