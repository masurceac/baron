import { defineModuleRouting } from '@baron/routes/utils';
import { Outlet, RouteObject } from 'react-router-dom';
import { RedirectToList } from './components/redirect-to-list';
import { SimulationSetupCreatePage } from './pages/create';
import { SimulationSetupsListPage } from './pages/list';
import { simulationExecutionRouter } from '../simulation-execution';

export const simulationSetupRouter = defineModuleRouting([
  {
    path: '',
    children: [
      {
        index: true,
        Component: RedirectToList,
      },
      {
        path: 'list',
        Component: SimulationSetupsListPage,
      },
      {
        path: 'create',
        Component: SimulationSetupCreatePage,
      },
      {
        path: 'setup/:setupId',
        Component: Outlet,
        children: simulationExecutionRouter,
      },
    ],
  },
] as const satisfies RouteObject[]);
