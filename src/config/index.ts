import * as dotenv from 'dotenv';
import { ConfigSchema } from './config.schema';

dotenv.config();

const parsedConfig = ConfigSchema.safeParse(process.env);

if (!parsedConfig.success) {
  console.error('[Config] Invalid environment configuration:');
  console.error(JSON.stringify(parsedConfig.error.format(), null, 2));
  process.exit(1);
}

export const config = parsedConfig.data;
