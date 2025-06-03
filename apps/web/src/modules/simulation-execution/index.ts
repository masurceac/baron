import { defineModuleRouting } from '@baron/routes/utils';
import { RouteObject } from 'react-router-dom';
import { SimulationExecutionDetailsPage } from './pages/details';
import { SimulationExececutionListPage } from './pages/list';
import { RunSimulationExecutionPage } from './pages/run';

export const simulationExecutionRouter = defineModuleRouting([
  {
    path: '',
    children: [
      {
        path: 'list',
        Component: SimulationExececutionListPage,
      },
      {
        path: 'run',
        Component: RunSimulationExecutionPage,
      },
      {
        path: 'view/:executionId',
        Component: SimulationExecutionDetailsPage,
      },
    ],
  },
] as const satisfies RouteObject[]);
