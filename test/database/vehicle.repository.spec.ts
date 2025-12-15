import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { InternalServerErrorException } from '@nestjs/common';
import { VehicleRepository } from '../../src/database/vehicle.repository';
import {
  VehicleDataEntity,
  VehicleMake,
} from '../../src/database/vehicle.schema';
import { LoggerService } from '../../src/logging/logger.service';

describe('VehicleRepository', () => {
  let repository: VehicleRepository;

  let mockVehicleDataModel: any;
  let mockVehicleMakeModel: any;

  const mockLoggerService = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
    verbose: jest.fn(),
  };

  // Proper Mongoose mock with chainable methods
  const createMockModel = () => ({
    findOne: jest.fn().mockReturnThis(),
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
    updateOne: jest.fn().mockReturnThis(),
    bulkWrite: jest.fn(),
  });

  beforeEach(async () => {
    mockVehicleDataModel = createMockModel();
    mockVehicleMakeModel = createMockModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleRepository,
        { provide: getModelToken(VehicleDataEntity.name), useValue: mockVehicleDataModel },
        { provide: getModelToken(VehicleMake.name), useValue: mockVehicleMakeModel },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    repository = module.get<VehicleRepository>(VehicleRepository);
  });

  describe('getLatestData', () => {
    it('should return the latest vehicle metadata', async () => {
      const mockData = { identifier: 'GLOBAL_SUMMARY', totalMakes: 10 };
      mockVehicleDataModel.findOne().lean().exec.mockResolvedValue(mockData);

      const result = await repository.getLatestData();

      expect(mockVehicleDataModel.findOne).toHaveBeenCalledWith({ identifier: 'GLOBAL_SUMMARY' });
      expect(mockVehicleDataModel.findOne().lean).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it('should throw InternalServerErrorException on failure', async () => {
      mockVehicleDataModel.findOne().lean().exec.mockRejectedValue(new Error('DB error'));

      await expect(repository.getLatestData()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findAllMakes', () => {
    it('should return sorted vehicle makes', async () => {
      const mockData = [{ makeName: 'Audi' }, { makeName: 'BMW' }];
      mockVehicleMakeModel.find().sort().lean().exec.mockResolvedValue(mockData);

      const result = await repository.findAllMakes();

      expect(mockVehicleMakeModel.find).toHaveBeenCalled();
      expect(mockVehicleMakeModel.find().sort).toHaveBeenCalledWith({ makeName: 1 });
      expect(mockVehicleMakeModel.find().lean).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it('should throw InternalServerErrorException on database error', async () => {
      mockVehicleMakeModel.find().sort().lean().exec.mockRejectedValue(new Error('DB Error'));

      await expect(repository.findAllMakes()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('upsertVehicleData', () => {
    it('should upsert global vehicle metadata with fixed identifier', async () => {
      const updateDto = { totalMakes: 100 };
      await repository.upsertVehicleData(updateDto);

      expect(mockVehicleDataModel.updateOne).toHaveBeenCalledWith(
        { identifier: 'GLOBAL_SUMMARY' },
        { $set: { ...updateDto, identifier: 'GLOBAL_SUMMARY' } },
        { upsert: true },
      );
    });
  });

  describe('upsertVehicleMake', () => {
    it('should upsert a single vehicle make', async () => {
      const make = { makeId: '1', makeName: 'Test Make' } as VehicleMake;

      await repository.upsertVehicleMake(make);

      expect(mockVehicleMakeModel.updateOne).toHaveBeenCalledWith(
        { makeId: make.makeId },
        { $set: make },
        { upsert: true },
      );
    });
  });

  describe('upsertManyMakes', () => {
    it('should call bulkWrite with correct operations', async () => {
      const makes = [{ makeId: '1', makeName: 'Test' } as VehicleMake];

      mockVehicleMakeModel.bulkWrite.mockResolvedValue({
        upsertedCount: 1,
        modifiedCount: 0,
      });

      await repository.upsertManyMakes(makes);

      expect(mockVehicleMakeModel.bulkWrite).toHaveBeenCalledWith([
        {
          updateOne: {
            filter: { makeId: '1' },
            update: { $set: makes[0] },
            upsert: true,
          },
        },
      ]);
    });

    it('should return early if makes array is empty', async () => {
      await repository.upsertManyMakes([]);

      expect(mockVehicleMakeModel.bulkWrite).not.toHaveBeenCalled();
    });

    it('should throw error if bulkWrite fails', async () => {
      mockVehicleMakeModel.bulkWrite.mockRejectedValue(new Error('Bulk write failed'));

      await expect(repository.upsertManyMakes([{ makeId: '1' } as VehicleMake])).rejects.toThrow('Bulk write failed');
    });
  });
});
