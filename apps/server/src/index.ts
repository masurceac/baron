import { asyncLocalStorage, createAsyncStorageContext, createTrpcContext } from '@baron/trpc-server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { eventBus } from './events';
import { appRouter } from './trpc';
import { LiveTradeRoomExecutionWorkflow } from './workflows/live-trade-room-execution';
import { SimulationRoomExecutionWorkflow } from './workflows/simulation-room-execution-workflow';

function checkForUpgrade(request: Request): Response | null {
	const upgradeHeader = request.headers.get('Upgrade');
	if (!upgradeHeader || upgradeHeader !== 'websocket') {
		return new Response('Durable Object expected Upgrade: websocket', {
			status: 426,
		});
	}
	return null;
}

const worker = {
	async fetch(request, env): Promise<Response> {
		if (request.method === 'OPTIONS') {
			return handleCORSPreflight();
		}
		const url = new URL(request.url);
		const pathname = url.pathname;
		const roomId = url.searchParams.get('roomId');

		if (pathname.endsWith('/websocket')) {
			const upgradeRs = checkForUpgrade(request);
			if (upgradeRs) {
				return upgradeRs;
			}
			if (!roomId) {
				return new Response('Room ID is required', {
					status: 400,
				});
			}

			const id = env.TRADE_ROOM_DO.idFromName(roomId);
			const stub = env.TRADE_ROOM_DO.get(id);

			return stub.fetch(request);
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

export { SimulationRoomExecutionWorkflow, LiveTradeRoomExecutionWorkflow };

export { TradeRoomDurableObject } from './durable-objects/trade-room';

export default worker;
