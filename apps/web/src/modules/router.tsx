import { defineModuleRouting } from '@baron/routes/utils';
import { RouteObject } from 'react-router-dom';
import { AuthGuard } from './app-root/components/auth-guard';
import { MainPage } from './app-root/pages/main-page';
import { infoBarsRouter } from './info-bars';
import { liveTradingRoomRouter } from './live-trading-room';
import { frvpRouter } from './predefined-frvp';
import { simulationRoomsRouter } from './simulation-room';

export const appRouter = defineModuleRouting([
  {
    Component: AuthGuard,
    children: [
      {
        path: '',
        Component: MainPage,
      },
      ...infoBarsRouter,
      ...simulationRoomsRouter,
      {
        path: 'frvp',
        children: frvpRouter,
      },
      {
        path: 'live-trading',
        children: liveTradingRoomRouter,
      },
    ],
  },
] as const satisfies RouteObject[]);
