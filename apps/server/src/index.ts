import { asyncLocalStorage, createAsyncStorageContext, createTrpcContext } from '@baron/trpc-server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { eventBus } from './events';
import { appRouter } from './trpc';

const worker = {
	async fetch(request, env): Promise<Response> {
		if (request.method === 'OPTIONS') {
			return handleCORSPreflight();
		}

		if (env.ENV === 'local') {
			if (request.url.endsWith('trigger-start-serghei')) {
				return Response.json({
					message: '✅🚀 Rocket',
				});
			}
		}
		return asyncLocalStorage.run(
			await createAsyncStorageContext(
				{
					request,
					clerkSecretKey: env.CLERK_SECRET_KEY,
					clerkPublicKey: env.CLERK_PUBLISHABLE_KEY,
					databaseConnectionString: env.DATABASE_CONNECTION_STRING,
				},
				() => Promise.resolve({ env, eventBus }),
			),
			async () =>
				addCORSHeaders(
					await fetchRequestHandler({
						endpoint: '/trpc',
						req: request,
						router: appRouter,
						onError(opts: { error: unknown }) {
							const { error } = opts;
							console.error(error);
							console.error(JSON.stringify({ error }, null, 2));
						},
						createContext: createTrpcContext,
					}),
				),
		);
	},
} satisfies ExportedHandler<Env>;

const addCORSHeaders = (res: Response) => {
	const response = new Response(res.body, res);
	response.headers.set('Access-Control-Allow-Origin', '*');
	response.headers.set('Access-Control-Allow-Headers', '*');
	response.headers.set('Access-Control-Allow-Credentials', 'true');
	response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

	return response;
};

const handleCORSPreflight = () => {
	const rs = new Response(null);

	return addCORSHeaders(rs);
};

// export { OrderPlacementWorkflow, OrderPlacementTriggerWorkflow, SimulationIterationWorkflow };

export default worker;
