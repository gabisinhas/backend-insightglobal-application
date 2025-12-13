import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { config } from '../config';

@Injectable()
export class XmlClient {
  private readonly logger = new Logger(XmlClient.name);
  private readonly httpClient: AxiosInstance;
  private readonly maxRetries: number;
  private readonly timeout: number;

  constructor() {
    // Ensure these values exist in config
    this.maxRetries = config.XML_FETCH_RETRIES ?? 2;
    this.timeout = config.XML_FETCH_TIMEOUT ?? 10000;

    this.httpClient = axios.create({
      timeout: this.timeout,
      headers: { Accept: 'application/xml' },
    });
  }

  async fetchAllMakes(): Promise<string> {
    const url = config.GET_ALL_MAKES_URL;
    this.logger.log(`Fetching all vehicle makes from ${url}`);
    return this.fetchXml(url);
  }

  async fetchVehicleTypesForMake(makeId: number): Promise<string> {
    const url = config.GET_VEHICLE_TYPES_URL.replace('{id}', makeId.toString());
    this.logger.log(`Fetching vehicle types for makeId=${makeId} from ${url}`);
    return this.fetchXml(url, makeId);
  }

  private async fetchXml(url: string, makeId?: number): Promise<string> {
    for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
      try {
        const response = await this.httpClient.get<string>(url);
        this.logger.debug(
          `Fetched XML from ${url} (length=${response.data.length}) on attempt ${attempt}`,
        );
        return response.data;
      } catch (error) {
        const context = makeId ? `(makeId=${makeId})` : '';
        this.logger.error(
          `Failed to fetch XML from ${url} ${context} on attempt ${attempt}`,
          error instanceof Error ? error.stack : JSON.stringify(error),
        );

        if (attempt > this.maxRetries) {
          throw new Error(
            `Failed to fetch data from external VPIC API after ${attempt} attempts`,
          );
        }

        this.logger.warn(`Retrying fetch (${attempt}/${this.maxRetries})...`);
        await this.delay(attempt * 500);
      }
    }

    // This should never be reached
    throw new Error('Unreachable code in fetchXml');
  }

  private delay(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }
}
