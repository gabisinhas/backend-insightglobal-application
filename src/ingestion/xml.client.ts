import { Injectable } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { config } from '../config';
import pino from 'pino';
import pLimit from 'p-limit';

@Injectable()
export class XmlClient {
  private readonly logger = pino({
    name: 'XmlClient',
    level: config?.LOG_LEVEL ?? 'info', // Added null check
  });
  private readonly concurrencyLimiter = pLimit(
    config?.XML_FETCH_CONCURRENCY ?? 1, // Added null check
  );

  private async fetchWithRetries(
    url: string,
    retries: number,
  ): Promise<string> {
    let attempt = 0;

    while (attempt <= retries) {
      try {
        attempt++;
        this.logger.debug({ url, attempt }, 'Fetching XML');
        const response = await axios.get<string>(url, {
          timeout: config?.XML_FETCH_TIMEOUT ?? 1000, // Added null check
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

        await new Promise(
          (resolve) =>
            setTimeout(resolve, config?.XML_FETCH_RETRY_DELAY_MS ?? 1000), // Added null check
        );
      }
    }

    throw new Error(`Failed to fetch XML from ${url}`);
  }

  async fetchAllMakes(): Promise<string> {
    if (!config) {
      throw new Error('Configuration is not defined');
    }
    return this.fetchWithRetries(
      config.GET_ALL_MAKES_URL,
      config.XML_FETCH_RETRIES,
    );
  }

  async fetchVehicleTypes(makeId: number): Promise<string> {
    if (!config) {
      throw new Error('Configuration is not defined');
    }
    const url = `${config.GET_VEHICLE_TYPES_URL}/${makeId}?format=xml`;
    return this.concurrencyLimiter(() =>
      this.fetchWithRetries(url, config.XML_FETCH_RETRIES),
    );
  }
}
