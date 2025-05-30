import { router } from '@baron/trpc-server';
import { infoBarsRouter } from './routers/info-bars';
import { simulationRoomRouter } from './routers/simulation';
import { simulationExecutionRouter } from './routers/simulation-execution';
import { simulationSetupRouter } from './routers/simulation-setup';
import { tradeHistoryRouter } from './routers/trade-history';
import { volumeProfileConfigRouter } from './routers/volume-profile-config';

export const appRouter = router({
	volumeProfileConfig: volumeProfileConfigRouter,
	infoBars: infoBarsRouter,
	simulationRoom: simulationRoomRouter,
	simulationSetup: simulationSetupRouter,
	simulationExecution: simulationExecutionRouter,
	tradeHistory: tradeHistoryRouter,
});
