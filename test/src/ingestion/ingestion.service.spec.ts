import { Test, TestingModule } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { InternalServerErrorException } from '@nestjs/common';
import { IngestionService } from '../../../src/ingestion/ingestion.service';
import { XmlClient } from '../../../src/ingestion/xml.client';
import { VehicleRepository } from '../../../src/database/vehicle.repository';
import { VehicleTransformer } from '../../../src/ingestion/vehicle.transformer';

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

  const mockPinoLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        { provide: XmlClient, useValue: mockXmlClient },
        { provide: VehicleRepository, useValue: mockVehicleRepository },
        { provide: VehicleTransformer, useValue: mockTransformer },
        {
          provide: getLoggerToken(IngestionService.name),
          useValue: mockPinoLogger,
        },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ingestAllVehicleData', () => {
    it('should ingest all vehicle data successfully', async () => {
      // Setup
      const mockXml = '<xml>data</xml>';
      const mockMakes = [{ makeId: '1', makeName: 'Test' }];
      const mockTypes = [{ typeId: '10', typeName: 'Car' }];

      mockXmlClient.fetchAllMakes.mockResolvedValue(mockXml);
      mockTransformer.parseMakes.mockReturnValue(mockMakes);
      mockXmlClient.fetchVehicleTypes.mockResolvedValue('<types></types>');
      mockTransformer.parseVehicleTypes.mockReturnValue(mockTypes);
      mockVehicleRepository.upsertVehicleMake.mockResolvedValue(undefined);
      mockVehicleRepository.upsertVehicleData.mockResolvedValue(undefined);

      // Execute
      await service.ingestAllVehicleData();

      // Assertions
      expect(mockXmlClient.fetchAllMakes).toHaveBeenCalled();
      expect(mockTransformer.parseMakes).toHaveBeenCalledWith(mockXml);
      expect(mockVehicleRepository.upsertVehicleMake).toHaveBeenCalledWith({
        ...mockMakes[0],
        vehicleTypes: mockTypes,
      });
      expect(mockVehicleRepository.upsertVehicleData).toHaveBeenCalledWith({
        generatedAt: expect.any(String),
        totalMakes: 1,
      });
      expect(mockPinoLogger.info).toHaveBeenCalledWith('Ingestion completed successfully');
    });

    it('should handle no makes found gracefully', async () => {
      mockXmlClient.fetchAllMakes.mockResolvedValue('<xml></xml>');
      mockTransformer.parseMakes.mockReturnValue([]);

      await service.ingestAllVehicleData();

      expect(mockPinoLogger.warn).toHaveBeenCalledWith('No makes found after XML transformation');
      expect(mockVehicleRepository.upsertVehicleData).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException and log error on failure', async () => {
      const error = new Error('Network timeout');
      mockXmlClient.fetchAllMakes.mockRejectedValue(error);

      await expect(service.ingestAllVehicleData()).rejects.toThrow(InternalServerErrorException);

      expect(mockPinoLogger.error).toHaveBeenCalledWith(
        { err: 'Network timeout' },
        'Fatal error during ingestion'
      );
    });
  });

  jest.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('process.exit called');
  });
});
