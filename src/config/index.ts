import * as dotenv from 'dotenv';
import { ConfigSchema } from './config.schema';

dotenv.config();

const parsedConfig = ConfigSchema.safeParse(process.env);

if (!parsedConfig.success) {
  console.error('[Config] Invalid environment configuration:');
  console.error(JSON.stringify(parsedConfig.error.format(), null, 2));
  process.exit(1);
}

const config = {
  ...parsedConfig.data,
  ...(process.env.NODE_ENV === 'test' && {
    NODE_ENV: 'test',
    PORT: 4000,
    MONGODB_URI: 'mongodb://localhost:27017/test',
    LOG_LEVEL: 'debug',
    GET_ALL_MAKES_URL: 'http://localhost:4000/makes',
    GET_VEHICLE_TYPES_URL: 'http://localhost:4000/vehicle-types',
    XML_FETCH_RETRIES: 3,
    XML_FETCH_TIMEOUT: 5000,
    XML_FETCH_BATCH_SIZE: 1, // Reduced batch size to process fewer makes per batch
    XML_FETCH_CONCURRENCY: 1, // Reduced concurrency to minimize simultaneous requests
    XML_FETCH_RETRY_DELAY_MS: 2000, // Increased retry delay to reduce frequency of retries
  }),
};

export { config };
