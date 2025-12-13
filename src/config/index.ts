import * as dotenv from 'dotenv';
import { ConfigSchema } from './config.schema';

dotenv.config();

const parsedConfig = ConfigSchema.safeParse(process.env);

if (!parsedConfig.success) {
  console.error('Invalid environment config');
  console.error(parsedConfig.error.format());
  process.exit(1);
}

export const config = parsedConfig.data;
