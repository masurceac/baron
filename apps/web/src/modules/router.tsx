import { defineModuleRouting } from '@baron/routes/utils';
import { RouteObject } from 'react-router-dom';
import { AuthGuard } from './app-root/components/auth-guard';
import { MainPage } from './app-root/pages/main-page';
import { infoBarsRouter } from './info-bars';
import { vpcRouter } from './volume-profile-config';
import { simulationRoomsRouter } from './simulation-room';
import { tradingChartRouter } from './trading-chart';

export const appRouter = defineModuleRouting([
  {
    Component: AuthGuard,
    children: [
      {
        path: '',
        Component: MainPage,
      },
      ...vpcRouter,
      ...infoBarsRouter,
      ...simulationRoomsRouter,
      {
        path: 'chart',
        children: tradingChartRouter,
      },
    ],
  },
] as const satisfies RouteObject[]);
