import { defineModuleRouting } from '@baron/routes/utils';
import { RouteObject } from 'react-router-dom';
import { TradingChartPage } from './pages/chart';

export const tradingChartRouter = defineModuleRouting([
  {
    index: true,
    Component: TradingChartPage,
  },
] as const satisfies RouteObject[]);
