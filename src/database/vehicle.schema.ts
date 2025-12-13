import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VehicleTypeDocument = VehicleType & Document;

@Schema()
export class VehicleType {
  @Prop({ required: true, index: true })
  typeId: string;

  @Prop({ required: true })
  typeName: string;
}

export const VehicleTypeSchema = SchemaFactory.createForClass(VehicleType);

export type VehicleMakeDocument = VehicleMake & Document;

@Schema()
export class VehicleMake {
  @Prop({ required: true, index: true })
  makeId: string;

  @Prop({ required: true })
  makeName: string;

  @Prop({ type: [VehicleTypeSchema], default: [] })
  vehicleTypes: VehicleType[];
}

export const VehicleMakeSchema = SchemaFactory.createForClass(VehicleMake);

export type VehicleDataDocument = VehicleData & Document;

@Schema({ collection: 'vehicles_data', timestamps: true })
export class VehicleData {
  @Prop({ required: true })
  generatedAt: string;

  @Prop({ required: true })
  totalMakes: number;

  @Prop({ type: [VehicleMakeSchema], default: [] })
  makes: VehicleMake[];
}

export const VehicleDataSchema = SchemaFactory.createForClass(VehicleData);
