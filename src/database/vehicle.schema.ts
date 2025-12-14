import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Field, ObjectType, ID, Int } from '@nestjs/graphql';

@ObjectType('VehicleType')
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

export type VehicleMakeDocument = VehicleMake & Document;

@ObjectType('VehicleMake')
@Schema({ timestamps: true, collection: 'vehicle_makes' })
export class VehicleMake {
  @Field(() => ID)
  @Prop({ required: true, unique: true, index: true })
  makeId: string;

  @Field()
  @Prop({ required: true, index: true })
  makeName: string;

  @Field(() => [VehicleType])
  @Prop({ type: [VehicleTypeSchema], default: [] })
  vehicleTypes: VehicleType[];
}

export const VehicleMakeSchema = SchemaFactory.createForClass(VehicleMake);

export type VehicleDataDocument = VehicleData & Document;

@ObjectType('VehicleData')
@Schema({ collection: 'vehicles_metadata', timestamps: true })
export class VehicleData {
  @Prop({ required: true, unique: true, default: 'GLOBAL_SUMMARY' })
  identifier: string;

  @Field()
  @Prop({ required: true })
  generatedAt: string;

  @Field(() => Int)
  @Prop({ required: true })
  totalMakes: number;
}

export const VehicleDataSchema = SchemaFactory.createForClass(VehicleData);
