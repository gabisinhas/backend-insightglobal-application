import { Test, TestingModule } from '@nestjs/testing';
import { IngestionService } from '../../../src/ingestion/ingestion.service';
import { XmlClient } from '../../../src/ingestion/xml.client';
import { VehicleRepository } from '../../../src/database/vehicle.repository';
import {
  VehicleTransformer,
  ParsedVehicleMake,
} from '../../../src/ingestion/vehicle.transformer';
import { PinoLogger, getLoggerToken } from 'nestjs-pino';
import { InternalServerErrorException } from '@nestjs/common';

describe('IngestionService', () => {
  let service: IngestionService;
  let xmlClient: XmlClient;
  let repository: VehicleRepository;
  let transformer: VehicleTransformer;
  let logger: PinoLogger;

  const mockMakes: ParsedVehicleMake[] = [
    { makeId: '1', makeName: 'Make1', vehicleTypes: [] },
    { makeId: '2', makeName: 'Make2', vehicleTypes: [] },
  ];

  const mockVehicleTypes = [{ typeId: '101', typeName: 'Type1' }];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        {
          provide: XmlClient,
          useValue: {
            fetchAllMakes: jest.fn().mockResolvedValue('<xml></xml>'),
            fetchVehicleTypes: jest.fn().mockResolvedValue('<xml></xml>'),
          },
        },
        {
          provide: VehicleRepository,
          useValue: {
            upsertVehicleMake: jest.fn().mockResolvedValue(undefined),
            upsertVehicleData: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: VehicleTransformer,
          useValue: {
            parseMakes: jest.fn().mockReturnValue(mockMakes),
            parseVehicleTypes: jest.fn().mockReturnValue(mockVehicleTypes),
          },
        },
        {
          provide: getLoggerToken(IngestionService.name),
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
    xmlClient = module.get<XmlClient>(XmlClient);
    repository = module.get<VehicleRepository>(VehicleRepository);
    transformer = module.get<VehicleTransformer>(VehicleTransformer);
    logger = module.get<PinoLogger>(getLoggerToken(IngestionService.name));
  });

  it('should ingest all vehicle data successfully', async () => {
    await service.ingestAllVehicleData();

    // Use the method reference directly from the retrieved instance
    expect(xmlClient.fetchAllMakes).toHaveBeenCalled();
    expect(transformer.parseMakes).toHaveBeenCalled();
    expect(repository.upsertVehicleMake).toHaveBeenCalledTimes(
      mockMakes.length,
    );

    expect(repository.upsertVehicleData).toHaveBeenCalledWith(
      expect.objectContaining({ totalMakes: mockMakes.length }),
    );

    expect(logger.info).toHaveBeenCalledWith(
      'Ingestion completed successfully',
    );
  });

  it('should handle no makes found', async () => {
    jest.spyOn(transformer, 'parseMakes').mockReturnValue([]);

    await service.ingestAllVehicleData();

    expect(logger.warn).toHaveBeenCalledWith(
      'No makes found after XML transformation',
    );
    expect(repository.upsertVehicleMake).not.toHaveBeenCalled();
    expect(repository.upsertVehicleData).not.toHaveBeenCalled();
  });

  it('should throw InternalServerErrorException on fatal error', async () => {
    jest
      .spyOn(xmlClient, 'fetchAllMakes')
      .mockRejectedValue(new Error('XML fetch failed'));

    await expect(service.ingestAllVehicleData()).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(logger.error).toHaveBeenCalled();
  });
});
