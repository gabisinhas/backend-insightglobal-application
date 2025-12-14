import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  VehicleDataEntity,
  VehicleDataDocument,
  VehicleMake,
  VehicleMakeDocument,
} from './vehicle.schema';

@Injectable()
export class VehicleRepository {
  private readonly logger = new Logger(VehicleRepository.name);

  constructor(
    @InjectModel(VehicleDataEntity.name)
    private readonly vehicleDataModel: Model<VehicleDataDocument>,

    @InjectModel(VehicleMake.name)
    private readonly vehicleMakeModel: Model<VehicleMakeDocument>,
  ) {}

  async getLatestData(): Promise<VehicleDataEntity | null> {
    try {
      return await this.vehicleDataModel
        .findOne({ identifier: 'GLOBAL_SUMMARY' })
        .lean()
        .exec();
    } catch (error) {
      this.handleError('Failed to fetch latest vehicle metadata', error);
    }
  }

  async upsertVehicleData(data: Partial<VehicleDataEntity>): Promise<void> {
    try {
      await this.vehicleDataModel
        .updateOne(
          { identifier: 'GLOBAL_SUMMARY' },
          {
            $set: {
              ...data,
              identifier: 'GLOBAL_SUMMARY',
            },
          },
          { upsert: true },
        )
        .exec();

      this.logger.log('Global vehicle metadata synchronized successfully');
    } catch (error) {
      this.handleError('Failed to update global vehicle metadata', error);
    }
  }

  async findAllMakes(): Promise<VehicleMake[]> {
    try {
      return await this.vehicleMakeModel
        .find()
        .sort({ makeName: 1 })
        .lean()
        .exec();
    } catch (error) {
      this.handleError('Failed to fetch all vehicle makes', error);
    }
  }

  async upsertVehicleMake(make: VehicleMake): Promise<void> {
    try {
      await this.vehicleMakeModel
        .updateOne({ makeId: make.makeId }, { $set: make }, { upsert: true })
        .exec();
    } catch (error) {
      this.handleError(`Error saving make ${make.makeId}`, error);
    }
  }

  async upsertManyMakes(makes: VehicleMake[]): Promise<void> {
    if (!makes?.length) return;

    const ops = makes.map((make) => ({
      updateOne: {
        filter: { makeId: make.makeId },
        update: { $set: make },
        upsert: true,
      },
    }));

    try {
      const result = await this.vehicleMakeModel.bulkWrite(ops);
      this.logger.log(
        `Bulk write successful: ${result.upsertedCount} created, ${result.modifiedCount} updated`,
      );
    } catch (error) {
      const stack = error instanceof Error ? error.stack : 'Unknown error';
      this.logger.error('Bulk write operation failed', stack);
      throw error;
    }
  }

  private handleError(context: string, error: unknown): never {
    const stack = error instanceof Error ? error.stack : 'Unknown error';
    this.logger.error(context, stack);
    throw new InternalServerErrorException(
      `${context}: Database operation failed`,
    );
  }
}
