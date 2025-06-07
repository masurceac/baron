import { env } from '@/env';
import { getDrizzleClient } from '@baron/db/client';

export const getDatabase = () => {
  return getDrizzleClient(env.DATABASE_CONNECTION_STRING);
};
