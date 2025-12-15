import * as dotenv from 'dotenv';
import { ConfigSchema } from './config.schema';

dotenv.config();

let parsedConfig = ConfigSchema.safeParse(process.env);

if (process.env.NODE_ENV === 'test') {
  parsedConfig = {
    success: true,
    data: {
      NODE_ENV: 'test',
      PORT: 4000,
      MONGODB_URI: 'mongodb://localhost:27017/test',
      LOG_LEVEL: 'debug',
      GET_ALL_MAKES_URL: 'http://localhost:3000/makes',
      GET_VEHICLE_TYPES_URL: 'http://localhost:3000/vehicle-types',
      XML_FETCH_RETRIES: 3,
      XML_FETCH_TIMEOUT: 5000,
      XML_FETCH_BATCH_SIZE: 10,
      XML_FETCH_CONCURRENCY: 2,
      XML_FETCH_RETRY_DELAY_MS: 1000,
    },
  };
} else if (parsedConfig.error) {
  console.error('[Config] Invalid environment configuration:');
  console.error(JSON.stringify(parsedConfig.error.format(), null, 2));
  process.exit(1);
}

export const config = parsedConfig.data;
