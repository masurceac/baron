import { createClerkClient } from '@clerk/backend';
import { AsyncLocalStorage } from 'node:async_hooks';
import { getDrizzleClient } from '@baron/db/client';
import { getAuthResult } from '../services/auth';

export type AsyncStorageContextInput = {
  clerkSecretKey: string;
  clerkPublicKey: string;
  request?: Request;
  databaseConnectionString: string;
};

export type AsyncStorageResult<T> = {
  clerkClient: ReturnType<typeof createClerkClient>;
  auth: Awaited<ReturnType<typeof getAuthResult>>;
  request?: Request;
  db: ReturnType<typeof getDrizzleClient>;
} & T;

export async function createAsyncStorageContext<T>(
  input: AsyncStorageContextInput,
  getContext: (props: AsyncStorageResult<{}>) => Promise<T>,
) {
  const clerkClient = createClerkClient({
    secretKey: input.clerkSecretKey,
    publishableKey: input.clerkPublicKey,
  });
  const authResult = await getAuthResult(clerkClient, input.request);
  const db = getDrizzleClient(input.databaseConnectionString);

  const context = await getContext({
    clerkClient,
    auth: authResult,
    request: input.request,
    db,
  });

  return {
    clerkClient,
    auth: authResult,
    request: input.request,
    db,
    ...context,
  };
}

export type AsyncStorageContext<T> = Awaited<
  ReturnType<typeof createAsyncStorageContext<T>>
>;

export function factoryGetter<T, U extends keyof AsyncStorageContext<T>>(
  key: U,
) {
  const store = asyncLocalStorage.getStore();
  if (!store) {
    throw `[${String(key)}] Error: No local store`;
  }

  return store[key] as AsyncStorageContext<T>[U];
}

export function buildFactoryGetter<T extends {}>() {
  return function inlineFactoryGetter<U extends keyof AsyncStorageContext<T>>(
    key: U,
  ) {
    return factoryGetter<T, U>(key);
  };
}

export const asyncLocalStorage = new AsyncLocalStorage<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AsyncStorageContext<any>
>();
