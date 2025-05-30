import { eventBus } from '@/events';

export async function getAsyncStorageContext(input: { env: Env }) {
	return {
		env: input.env,
		eventBus: eventBus,
	};
}

export type CustomAsyncStorageContext = Awaited<ReturnType<typeof getAsyncStorageContext>>;
