import * as dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

export const env = z
  .object({
    DATABASE_CONNECTION_STRING: z
      .string()
      .min(1, 'DATABASE_CONNECTION_STRING is required'),
    DEEPSEEK_API_KEY: z.string().min(1, 'DEEPSEK_API_KEY is required'),
    CLERK_SECRET_KEY: z.string(),
    CLERK_PUBLISHABLE_KEY: z.string(),
  })
  .parse(process.env);
