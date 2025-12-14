import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  VehicleData,
  VehicleDataDocument,
  VehicleMake,
  VehicleMakeDocument,
} from './vehicle.schema';

@Injectable()
export class VehicleRepository {
  private readonly logger = new Logger(VehicleRepository.name);

  constructor(
    @InjectModel(VehicleData.name)
    private readonly vehicleDataModel: Model<VehicleDataDocument>,

    @InjectModel(VehicleMake.name)
    private readonly vehicleMakeModel: Model<VehicleMakeDocument>,
  ) {}

  async getLatestData(): Promise<VehicleData | null> {
    try {
      return await this.vehicleDataModel
        .findOne({ identifier: 'GLOBAL_SUMMARY' })
        .lean<VehicleData>()
        .exec();
    } catch (error) {
      this.logger.error('Failed to fetch latest vehicle metadata', error.stack);
      throw new InternalServerErrorException('Database read operation failed');
    }
  }

  async findAllMakes(): Promise<VehicleMake[]> {
    try {
      return await this.vehicleMakeModel
        .find()
        .sort({ makeName: 1 })
        .lean<VehicleMake[]>()
        .exec();
    } catch (error) {
      this.logger.error('Failed to fetch all vehicle makes', error.stack);
      throw new InternalServerErrorException('Database read operation failed');
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
      this.logger.error('Bulk write operation failed', error.stack);
      throw error;
    }
  }

  async upsertVehicleData(data: Partial<VehicleData>): Promise<void> {
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
      this.logger.error(
        'Failed to update global vehicle metadata',
        error.stack,
      );
      throw new InternalServerErrorException('Database write operation failed');
    }
  }
  async upsertVehicleMake(make: VehicleMake): Promise<void> {
    try {
      await this.vehicleMakeModel
        .updateOne({ makeId: make.makeId }, { $set: make }, { upsert: true })
        .exec();
    } catch (error) {
      this.logger.error(
        `Failed to process make: ${make.makeName}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error saving make ${make.makeId}`,
      );
    }
  }
}
