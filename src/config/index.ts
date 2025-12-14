import * as dotenv from 'dotenv';
import { ConfigSchema } from './config.schema';

dotenv.config();

let parsedConfig = ConfigSchema.safeParse(process.env);

if (process.env.NODE_ENV === 'test') {
  parsedConfig = { data: { /* mock config */ } };
} else if (parsedConfig.error) {
  console.error('[Config] Invalid environment configuration:');
  console.error(JSON.stringify(parsedConfig.error.format(), null, 2));
  process.exit(1);
}

export const config = parsedConfig.data;
