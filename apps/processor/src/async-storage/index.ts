import { buildFactoryGetter } from '@baron/trpc-server';
import { CustomAsyncStorageContext } from './context-factory';

const factoryGetter = buildFactoryGetter<CustomAsyncStorageContext>();

export const getEnv = () => factoryGetter('env');
