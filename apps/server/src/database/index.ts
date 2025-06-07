import { getDrizzleClient } from '@baron/db/client';
import { env } from 'cloudflare:workers';

export const getDatabase = () => {
	return getDrizzleClient(env.DATABASE_CONNECTION_STRING);
};
