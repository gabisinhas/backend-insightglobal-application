import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VehicleData, VehicleDataDocument } from './vehicle.schema';
import { VehiclesPayload } from '../graphql/vehicle.types';

@Injectable()
export class VehicleRepository {
  private readonly logger = new Logger(VehicleRepository.name);

  constructor(
    @InjectModel(VehicleData.name)
    private readonly model: Model<VehicleDataDocument>,
  ) {}

  async replaceData(payload: VehiclesPayload): Promise<void> {
    this.logger.log(
      `Replacing vehicle data. Total makes: ${payload.totalMakes}`,
    );

    try {
      await this.model.deleteMany({});
      this.logger.debug('Old vehicle data cleared');

      const created = new this.model(payload);
      const saved = await created.save();

      this.logger.log(
        `Vehicle data saved successfully. Makes stored: ${saved.totalMakes}`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to replace vehicle data',
        error instanceof Error ? error.stack : JSON.stringify(error),
      );
      throw new Error('Database operation failed');
    }
  }

  async getData(): Promise<VehicleData | null> {
    try {
      const data = await this.model.findOne().lean<VehicleData>().exec();
      if (!data) {
        this.logger.warn('No vehicle data found in database');
      }
      return data;
    } catch (error) {
      this.logger.error(
        'Failed to fetch vehicle data',
        error instanceof Error ? error.stack : JSON.stringify(error),
      );
      throw new Error('Database read operation failed');
    }
  }
}
