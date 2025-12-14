import { Test, TestingModule } from '@nestjs/testing';
import { VehicleResolver } from '../../../src/graphql/vehicle.resolver';
import { VehicleRepository } from '../../../src/database/vehicle.repository';
import { LoggerService } from '../../../src/logging/logger.service';

describe('VehicleResolver', () => {
  let resolver: VehicleResolver;

  let getLatestDataMock: jest.Mock;
  let findAllMakesMock: jest.Mock;

  const mockVehicleData = {
    identifier: 'GLOBAL_SUMMARY',
    totalMakes: 2,
    generatedAt: new Date('2025-01-01T10:00:00Z').toISOString(),
  };

  const mockMakes = [
    { makeId: 440, makeName: 'ASTON MARTIN' },
    { makeId: 441, makeName: 'TESLA' },
  ];

  const mockLoggerService = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  beforeEach(async () => {
    getLatestDataMock = jest.fn().mockResolvedValue(mockVehicleData);
    findAllMakesMock = jest.fn().mockResolvedValue(mockMakes);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleResolver,
        {
          provide: VehicleRepository,
          useValue: {
            getLatestData: getLatestDataMock,
            findAllMakes: findAllMakesMock,
          },
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    resolver = module.get<VehicleResolver>(VehicleResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('getVehicles', () => {
    it('should return unified vehicle data with makes', async () => {
      const result = await resolver.getVehicles();

      expect(result).toEqual({
        identifier: 'GLOBAL_SUMMARY',
        totalMakes: 2,
        lastUpdated: new Date(mockVehicleData.generatedAt),
        makes: mockMakes,
      });

      expect(getLatestDataMock).toHaveBeenCalledTimes(1);
      expect(findAllMakesMock).toHaveBeenCalledTimes(1);
    });

    it('should return null when no vehicle data exists', async () => {
      getLatestDataMock.mockResolvedValueOnce(null);

      const result = await resolver.getVehicles();

      expect(result).toBeNull();

      expect(getLatestDataMock).toHaveBeenCalledTimes(1);
      expect(findAllMakesMock).toHaveBeenCalledTimes(1);
    });
  });
});
