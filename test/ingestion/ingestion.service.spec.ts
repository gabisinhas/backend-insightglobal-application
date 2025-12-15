import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { IngestionService } from '../../src/ingestion/ingestion.service';
import { XmlClient } from '../../src/ingestion/xml.client';
import { VehicleRepository } from '../../src/database/vehicle.repository';
import { VehicleTransformer } from '../../src/ingestion/vehicle.transformer';
import { LoggerService } from '../../src/logging/logger.service';
import { jest } from '@jest/globals';

jest.spyOn(process, 'exit').mockImplementation((code) => {
  console.warn(`process.exit called with code: ${code}`);
});

describe('IngestionService', () => {
  let service: IngestionService;

  const mockXmlClient = {
    fetchAllMakes: jest.fn(),
    fetchVehicleTypes: jest.fn(),
  };

  const mockVehicleRepository = {
    upsertVehicleData: jest.fn(),
    upsertVehicleMake: jest.fn(),
  };

  const mockTransformer = {
    parseMakes: jest.fn(),
    parseVehicleTypes: jest.fn(),
  };

  const mockLoggerService = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
    verbose: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        { provide: XmlClient, useValue: mockXmlClient },
        { provide: VehicleRepository, useValue: mockVehicleRepository },
        { provide: VehicleTransformer, useValue: mockTransformer },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should ingest all vehicle data successfully', async () => {
    const mockXml = '<xml>data</xml>';
    const mockMakes = [{ makeId: '1', makeName: 'Test' }];
    const mockTypes = [{ typeId: '10', typeName: 'Car' }];

    mockXmlClient.fetchAllMakes.mockResolvedValue(mockXml);
    mockTransformer.parseMakes.mockReturnValue(mockMakes);
    mockXmlClient.fetchVehicleTypes.mockResolvedValue('<types></types>');
    mockTransformer.parseVehicleTypes.mockReturnValue(mockTypes);
    mockVehicleRepository.upsertVehicleMake.mockResolvedValue(undefined);
    mockVehicleRepository.upsertVehicleData.mockResolvedValue(undefined);

    await service.ingestAllVehicleData();

    expect(mockXmlClient.fetchAllMakes).toHaveBeenCalled();
    expect(mockTransformer.parseMakes).toHaveBeenCalledWith(mockXml);
    expect(mockVehicleRepository.upsertVehicleMake).toHaveBeenCalledWith({
      ...mockMakes[0],
      vehicleTypes: mockTypes,
    });
    expect(mockVehicleRepository.upsertVehicleData).toHaveBeenCalled();
    expect(mockLoggerService.info).toHaveBeenCalledWith(
      'Ingestion completed successfully',
    );
  });

  it('should handle no makes gracefully', async () => {
    mockXmlClient.fetchAllMakes.mockResolvedValue('<xml></xml>');
    mockTransformer.parseMakes.mockReturnValue([]);

    await service.ingestAllVehicleData();

    expect(mockLoggerService.warn).toHaveBeenCalledWith(
      'No makes found after XML transformation',
    );
    expect(mockVehicleRepository.upsertVehicleData).not.toHaveBeenCalled();
  });

  it('should throw InternalServerErrorException on fetchAllMakes failure', async () => {
    mockXmlClient.fetchAllMakes.mockRejectedValue(new Error('Network error'));

    await expect(service.ingestAllVehicleData()).rejects.toThrow(
      InternalServerErrorException,
    );

    expect(mockLoggerService.error).toHaveBeenCalledWith({
      msg: 'Fatal error during ingestion',
      err: 'Network error',
    });
  });
});
