import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
export type InnerContextOptions = Pick<FetchCreateContextFnOptions, 'req'>;
