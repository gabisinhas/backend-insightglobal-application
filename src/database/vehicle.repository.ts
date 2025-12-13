import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VehicleData, VehicleDataDocument } from './vehicle.schema';
import { VehicleMake, VehicleMakeDocument } from './vehicle.schema';
import { VehicleType } from './vehicle.schema';

@Injectable()
export class VehicleRepository {
  constructor(
    @InjectModel(VehicleData.name)
    private readonly vehicleDataModel: Model<VehicleDataDocument>,

    @InjectModel(VehicleMake.name)
    private readonly vehicleMakeModel: Model<VehicleMakeDocument>,
  ) {}

  async getLatestData(): Promise<VehicleData | null> {
    return this.vehicleDataModel
      .findOne({ 'makes.0': { $exists: true } })
      .exec();
  }

  async getData(): Promise<VehicleData[]> {
    return this.vehicleDataModel.find().exec();
  }

  async findAllMakes(): Promise<VehicleMake[]> {
    return this.vehicleMakeModel.find().exec();
  }

  async getAllVehicleTypes(): Promise<(VehicleType & { makeId: string })[]> {
    const makes = await this.vehicleMakeModel.find().exec();

    return makes.flatMap((make) =>
      make.vehicleTypes.map((type) => ({
        typeId: type.typeId,
        typeName: type.typeName,
        makeId: make.makeId,
      })),
    );
  }

  async upsertVehicleTypes(
    makeId: string,
    types: VehicleType[],
  ): Promise<void> {
    await this.vehicleMakeModel
      .updateOne(
        { makeId },
        { $set: { vehicleTypes: types } },
        { upsert: true },
      )
      .exec();
  }

  async upsertVehicleMake(make: VehicleMake): Promise<void> {
    const result = await this.vehicleMakeModel
      .updateOne({ makeId: make.makeId }, { $set: make }, { upsert: true })
      .exec();

    console.log(
      `Make ${make.makeName} processado:`,
      result.upsertedCount || result.modifiedCount,
    );
  }

  async upsertVehicleData(data: VehicleData): Promise<void> {
    const result = await this.vehicleDataModel
      .updateOne(
        { totalMakes: data.totalMakes },
        { $set: data },
        { upsert: true },
      )
      .exec();

    console.log('--- DEBUG VEHICLE DATA ---');
    console.log('Resultado do DB:', JSON.stringify(result));
  }
}
