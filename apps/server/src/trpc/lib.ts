// to be used by frontend client

import { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { appRouter } from './app';

export type AppRouter = typeof appRouter;
export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;
