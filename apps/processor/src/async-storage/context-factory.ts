import { env } from '@/env';

export async function getAsyncStorageContext(input: { env: typeof env }) {
  return { env: input.env };
}

export type CustomAsyncStorageContext = Awaited<
  ReturnType<typeof getAsyncStorageContext>
>;
