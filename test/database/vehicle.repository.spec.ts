import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { InternalServerErrorException } from '@nestjs/common';
import { VehicleRepository } from '../../src/database/vehicle.repository';
import { VehicleData, VehicleMake } from '../../src/database/vehicle.schema';

describe('VehicleRepository', () => {
  let repository: VehicleRepository;
  let mockVehicleDataModel: any;
  let mockVehicleMakeModel: any;

  const mockMongooseChain = {
    findOne: jest.fn().mockReturnThis(),
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    mockVehicleDataModel = {
      findOne: jest.fn().mockReturnThis(),
      updateOne: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      ...mockMongooseChain,
    };

    mockVehicleMakeModel = {
      find: jest.fn().mockReturnThis(),
      bulkWrite: jest.fn(),
      updateOne: jest.fn().mockReturnThis(),
      ...mockMongooseChain,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleRepository,
        {
          provide: getModelToken(VehicleData.name),
          useValue: mockVehicleDataModel,
        },
        {
          provide: getModelToken(VehicleMake.name),
          useValue: mockVehicleMakeModel,
        },
      ],
    }).compile();

    repository = module.get<VehicleRepository>(VehicleRepository);
  });

  describe('findAllMakes', () => {
    it('should return sorted makes using lean for performance', async () => {
      const mockData = [{ makeName: 'Audi' }, { makeName: 'BMW' }];
      mockVehicleMakeModel.exec.mockResolvedValue(mockData);

      const result = await repository.findAllMakes();

      expect(mockVehicleMakeModel.find).toHaveBeenCalled();
      expect(mockVehicleMakeModel.sort).toHaveBeenCalledWith({ makeName: 1 });
      expect(mockVehicleMakeModel.lean).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it('should throw InternalServerErrorException on database failure', async () => {
      mockVehicleMakeModel.exec.mockRejectedValue(new Error('DB Error'));

      await expect(repository.findAllMakes()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('upsertManyMakes', () => {
    it('should call bulkWrite with correctly formatted operations', async () => {
      const makes = [
        { makeId: '1', makeName: 'Test' } as VehicleMake,
      ];
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

    it('should return early if empty array is provided', async () => {
      await repository.upsertManyMakes([]);
      expect(mockVehicleMakeModel.bulkWrite).not.toHaveBeenCalled();
    });
  });

  describe('upsertVehicleData', () => {
    it('should upsert global metadata with fixed identifier', async () => {
      const updateDto = { totalMakes: 100 };
      mockVehicleDataModel.updateOne.mockReturnThis();
      mockVehicleDataModel.exec.mockResolvedValue({});

      await repository.upsertVehicleData(updateDto);

      expect(mockVehicleDataModel.updateOne).toHaveBeenCalledWith(
        { identifier: 'GLOBAL_SUMMARY' },
        {
          $set: {
            ...updateDto,
            identifier: 'GLOBAL_SUMMARY',
          },
        },
        { upsert: true },
      );
    });
  });
});
