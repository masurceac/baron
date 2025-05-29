import { env } from '@/env';
import type { AppRouter } from '@baron/server';
import { createTRPCReact } from '@trpc/react-query';

export const trpc = createTRPCReact<AppRouter>() as ReturnType<
  typeof createTRPCReact<AppRouter>
>;

export function getAPIBaseUrl() {
  return env.VITE_SERVER_URL;
}

export function getTrpcUrl() {
  return getAPIBaseUrl() + '/trpc';
}
