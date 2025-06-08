import { asyncLocalStorage, createAsyncStorageContext, createTrpcContext } from '@baron/trpc-server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { cronHandler } from './cron/cron-handler';
import { eventBus } from './events';
import { appRouter } from './trpc';
import { OrderPlacementWorkflow } from './workflows/order-placement';
import { SelfTrainingRoomWorkflow } from './workflows/self-training-room';
import { SimulationIterationWorkflow } from './workflows/simulation-iteration-workflow';

const worker = {
	async fetch(request, env): Promise<Response> {
		if (request.method === 'OPTIONS') {
			return handleCORSPreflight();
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
							// if (error.code === 'INTERNAL_SERVER_ERROR') {
							//   // send to bug reporting
							// }
						},
						createContext: createTrpcContext,
					}),
				),
		);
	},
	async scheduled(_, _2, ctx) {
		await ctx.waitUntil(cronHandler());
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

export { OrderPlacementWorkflow, SelfTrainingRoomWorkflow, SimulationIterationWorkflow };

export default worker;
