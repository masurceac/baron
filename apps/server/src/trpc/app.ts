import { router } from '@baron/trpc-server';
import { infoBarsRouter } from './routers/info-bars';
import { logHistoryRouter } from './routers/log-history';
import { simulationRoomRouter } from './routers/simulation';
import { simulationExecutionRouter } from './routers/simulation-execution';
import { tradeHistoryRouter } from './routers/trade-history';
import { volumeProfileConfigRouter } from './routers/volume-profile-config';

export const appRouter = router({
	volumeProfileConfig: volumeProfileConfigRouter,
	infoBars: infoBarsRouter,
	simulationRoom: simulationRoomRouter,
	simulationExecution: simulationExecutionRouter,
	tradeHistory: tradeHistoryRouter,
	logHistory: logHistoryRouter,
});
