import dotnev from 'dotenv';
import { z } from 'zod';

dotnev.config();

export const env = z
  .object({
    DATABASE_CONNECTION_STRING: z.string(),
  })
  .parse(process.env);
