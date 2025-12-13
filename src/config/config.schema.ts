import { z } from 'zod';

export const ConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string(),
  LOG_LEVEL: z.string().default('info'),
  GET_ALL_MAKES_URL: z.string(),
  GET_VEHICLE_TYPES_URL: z.string(),
  XML_FETCH_RETRIES: z.coerce.number().default(2),
  XML_FETCH_TIMEOUT: z.coerce.number().default(10000),
});

export type AppConfig = z.infer<typeof ConfigSchema>;
