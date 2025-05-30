import { buildFactoryGetter } from '@baron/trpc-server';
import { CustomAsyncStorageContext } from './context-factory';

const factoryGetter = buildFactoryGetter<CustomAsyncStorageContext>();

export const getEnv = () => factoryGetter('env');
export const getEventBus = () => {
	const bus = factoryGetter('eventBus');
	if (!bus) {
		throw new Error('Event bus not found');
	}
	return bus;
};

