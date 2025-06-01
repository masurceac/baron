import {
  asyncLocalStorage,
  createAsyncStorageContext,
} from '@baron/trpc-server';
import * as dotenv from 'dotenv';
import { env } from './env';
import { checkSimulationExecution } from './service/check-simulation-execution';

// Load environment variables from .env file
dotenv.config();

async function processItems() {
  asyncLocalStorage.run(
    await createAsyncStorageContext(
      {
        clerkPublicKey: env.CLERK_PUBLISHABLE_KEY,
        clerkSecretKey: env.CLERK_SECRET_KEY,
        databaseConnectionString: env.DATABASE_CONNECTION_STRING,
      },
      () => Promise.resolve({ env }),
    ),
    async () => {
      console.log('start');
      await checkSimulationExecution();
    },
  );
}

try {
  processItems();
} catch (e) {
  console.log(e);
}
