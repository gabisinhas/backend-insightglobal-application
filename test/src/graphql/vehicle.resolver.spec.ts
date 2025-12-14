import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { VehicleResolver } from '../../../src/graphql/vehicle.resolver';
import { VehicleRepository } from '../../../src/database/vehicle.repository';

describe('VehicleResolver', () => {
  let resolver: VehicleResolver;
  let repository: VehicleRepository;

  const mockMetadata = {
    generatedAt: '2025-12-14T14:38:50.388Z',
    totalMakes: 2,
  };

  const mockMakes = [
    { makeId: '1', makeName: 'A-Test', vehicleTypes: [] },
    { makeId: '2', makeName: 'B-Test', vehicleTypes: [] },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleResolver,
        {
          provide: VehicleRepository,
          useValue: {
            getLatestData: jest.fn(),
            findAllMakes: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<VehicleResolver>(VehicleResolver);
    repository = module.get<VehicleRepository>(VehicleRepository);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('vehicles query', () => {
    it('should return a unified payload when data exists (Happy Path)', async () => {
      jest
        .spyOn(repository, 'getLatestData')
        .mockResolvedValue(mockMetadata as any);
      jest
        .spyOn(repository, 'findAllMakes')
        .mockResolvedValue(mockMakes as any);

      const result = await resolver.vehicles();

      expect(result).toEqual({
        generatedAt: mockMetadata.generatedAt,
        totalMakes: mockMetadata.totalMakes,
        makes: mockMakes,
      });
      expect(repository.getLatestData).toHaveBeenCalledTimes(1);
      expect(repository.findAllMakes).toHaveBeenCalledTimes(1);
    });

    it('should return an empty payload gracefully when no data is found', async () => {
      jest.spyOn(repository, 'getLatestData').mockResolvedValue(null);
      jest.spyOn(repository, 'findAllMakes').mockResolvedValue([]);

      const result = await resolver.vehicles();
      expect(result.totalMakes).toBe(0);
      expect(result.makes).toEqual([]);
      expect(result.generatedAt).toBeDefined();
    });

    it('should throw InternalServerErrorException if the repository fails', async () => {
      jest
        .spyOn(repository, 'findAllMakes')
        .mockRejectedValue(new Error('DB Error'));

      await expect(resolver.vehicles()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
