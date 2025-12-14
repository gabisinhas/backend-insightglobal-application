import { Test, TestingModule } from '@nestjs/testing';
import { IngestionService } from '../../../src/ingestion/ingestion.service';
import { XmlClient } from '../../../src/ingestion/xml.client';
import { VehicleRepository } from '../../../src/database/vehicle.repository';

describe('IngestionService', () => {
  let service: IngestionService;
  let xmlClient: XmlClient;

  const mockXmlClient = {
    fetchAllMakes: jest.fn(),
    fetchVehicleTypes: jest.fn(),
  };

  const mockVehicleRepository = {
    upsertVehicleMake: jest.fn(),
    upsertVehicleData: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        { provide: XmlClient, useValue: mockXmlClient },
        { provide: VehicleRepository, useValue: mockVehicleRepository },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
    xmlClient = module.get<XmlClient>(XmlClient);
  });

  describe('parseMakesXml', () => {
    it('should correctly transform raw XML makes into VehicleMake array', async () => {
      const mockXml = `
        <Response>
          <Results>
            <AllVehicleMakes>
              <Make_ID>440</Make_ID>
              <Make_Name>ASTON MARTIN</Make_Name>
            </AllVehicleMakes>
            <AllVehicleMakes>
              <Make_ID>441</Make_ID>
              <Make_Name>TESLA</Make_Name>
            </AllVehicleMakes>
          </Results>
        </Response>`;

      const result = await (service as any).parseMakesXml(mockXml);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        makeId: '440',
        makeName: 'ASTON MARTIN',
        vehicleTypes: [],
      });
      expect(result[1].makeName).toBe('TESLA');
    });

    it('should return empty array and handle missing results gracefully', async () => {
      const mockXml = `<Response><Results></Results></Response>`;
      const result = await (service as any).parseMakesXml(mockXml);
      expect(result).toEqual([]);
    });
  });

  describe('parseTypesXml', () => {
    it('should correctly transform raw XML types into VehicleType array', async () => {
      const mockXml = `
        <Response>
          <Results>
            <VehicleTypesForMakeIds>
              <VehicleTypeId>2</VehicleTypeId>
              <VehicleTypeName>Passenger Car</VehicleTypeName>
            </VehicleTypesForMakeIds>
          </Results>
        </Response>`;

      const result = await (service as any).parseTypesXml(mockXml);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        typeId: '2',
        typeName: 'Passenger Car',
      });
    });
  });
});