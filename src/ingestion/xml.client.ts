import { Injectable } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { config } from '../config';
import pino from 'pino';
import pLimit from 'p-limit';

@Injectable()
export class XmlClient {
  private readonly logger = pino({
    name: 'XmlClient',
    level: config?.LOG_LEVEL ?? 'info',
  });
  private readonly concurrencyLimiter = pLimit(
    config?.XML_FETCH_CONCURRENCY ?? 1,
  );

  private async fetchWithRetries(
    url: string,
    retries: number,
  ): Promise<string> {
    if (!url) {
      throw new Error('URL must be a valid string');
    }

    let attempt = 0;

    while (attempt <= retries) {
      try {
        attempt++;
        this.logger.debug({ url, attempt }, 'Fetching XML');
        const response = await axios.get<string>(url, {
          timeout: config?.XML_FETCH_TIMEOUT ?? 1000,
        });
        return response.data;
      } catch (err) {
        const message =
          err instanceof AxiosError ? err.message : JSON.stringify(err);
        this.logger.error({ url, attempt, error: message }, 'Fetch failed');

        if (attempt > retries) {
          throw new Error(
            `Failed to fetch XML from ${url} after ${retries} retries`,
          );
        }

        await new Promise((resolve) =>
          setTimeout(resolve, config?.XML_FETCH_RETRY_DELAY_MS ?? 1000),
        );
      }
    }

    throw new Error(`Failed to fetch XML from ${url}`);
  }

  async fetchAllMakes(): Promise<string> {
    if (!config?.GET_ALL_MAKES_URL) {
      throw new Error('GET_ALL_MAKES_URL must be defined in the configuration');
    }

    if (typeof config.XML_FETCH_RETRIES !== 'number') {
      throw new Error(
        'XML_FETCH_RETRIES must be a valid number in the configuration',
      );
    }

    return this.fetchWithRetries(
      config.GET_ALL_MAKES_URL,
      config.XML_FETCH_RETRIES,
    );
  }

  async fetchVehicleTypes(makeId: number): Promise<string> {
    if (makeId === undefined || makeId === null) {
      throw new Error('makeId must be a valid number');
    }

    if (!config) {
      throw new Error('Configuration is not defined');
    }
    const url = `${config.GET_VEHICLE_TYPES_URL}/${makeId}?format=xml`;

    const retries = config.XML_FETCH_RETRIES ?? 3;

    return this.concurrencyLimiter(() => this.fetchWithRetries(url, retries));
  }
}
