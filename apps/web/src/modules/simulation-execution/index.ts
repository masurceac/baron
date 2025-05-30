import { defineModuleRouting } from '@baron/routes/utils';
import { RouteObject } from 'react-router-dom';
import { SimulationExecutionDetailsPage } from './pages/details';
import { SimulationExececutionListPage } from './pages/list';

export const simulationExecutionRouter = defineModuleRouting([
  {
    path: '',
    children: [
      {
        path: 'list',
        Component: SimulationExececutionListPage,
      },
      {
        path: 'view/:executionId',
        Component: SimulationExecutionDetailsPage,
      },
    ],
  },
] as const satisfies RouteObject[]);
