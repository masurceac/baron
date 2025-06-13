import { router } from '@baron/trpc-server';
import { frvpRouter } from './routers/frvp';
import { infoBarsRouter } from './routers/info-bars';
import { logHistoryRouter } from './routers/log-history';
import { simulationRoomRouter } from './routers/simulation-room';
import { simulationRoomExecutionRouter } from './routers/simulation-room-execution';
import { tradeHistoryRouter } from './routers/trade-history';

export const appRouter = router({
	infoBars: infoBarsRouter,
	simulationRoom: simulationRoomRouter,
	simulationExecution: simulationRoomExecutionRouter,
	tradeHistory: tradeHistoryRouter,
	logHistory: logHistoryRouter,
	frvp: frvpRouter,
});
