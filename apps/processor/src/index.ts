import {
  asyncLocalStorage,
  createAsyncStorageContext,
} from '@baron/trpc-server';
import { serve } from '@hono/node-server';
import * as dotenv from 'dotenv';
import { Hono } from 'hono';
import { getEnv } from './async-storage';
import { env } from './env';
import { checkSimulationExecution } from './service/check-simulation-execution';

// Load environment variables from .env file
dotenv.config();

const app = new Hono();

// Middleware to set up AsyncLocalStorage for each request
app.use('*', async (c, next) => {
  await asyncLocalStorage.run(
    await createAsyncStorageContext(
      {
        request: c.req.raw,
        clerkPublicKey: env.CLERK_PUBLISHABLE_KEY,
        clerkSecretKey: env.CLERK_SECRET_KEY,
        databaseConnectionString: env.DATABASE_CONNECTION_STRING,
      },
      () => Promise.resolve({ env }),
    ),
    async () => next(),
  );
});

app.get('/', (c) => c.text('Hello, Hono ' + getEnv().CLERK_PUBLISHABLE_KEY));
app.get('process', async () => {
  await checkSimulationExecution();
});

serve(
  {
    fetch: app.fetch,
    port: 4400,
  },
  (info) => {
    console.log(`Listening on http://localhost:${info.port}`);
  },
);
