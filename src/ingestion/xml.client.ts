import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class XmlClient {
  private readonly logger = new Logger(XmlClient.name);

  async fetchAllMakes(): Promise<string> {
    const url = 'https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=XML';
    const response = await axios.get(url);
    return response.data;
  }

  async fetchVehicleTypes(makeId: number): Promise<string> {
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetVehicleTypesForMakeId/${makeId}?format=xml`;
    const response = await axios.get(url);
    return response.data;
  }
}
