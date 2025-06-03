import { defineModuleRouting } from '@baron/routes/utils';
import { Outlet, RouteObject } from 'react-router-dom';
import { simulationExecutionRouter } from '../simulation-execution';
import { RedirectToList } from './components/redirect-to-list';
import { SimulationRoomCreatePage } from './pages/create';
import { SimulationRoomEditPage } from './pages/edit';
import { SimulationRoomListPage } from './pages/list';

export const simulationRoomsRouter = defineModuleRouting([
  {
    path: 'simulation',
    children: [
      {
        index: true,
        Component: RedirectToList,
      },
      {
        path: 'list',
        Component: SimulationRoomListPage,
      },
      {
        path: 'create',
        Component: SimulationRoomCreatePage,
      },
      {
        path: 'edit/:roomId',
        Component: SimulationRoomEditPage,
      },
      {
        path: 'room/:roomId',
        Component: Outlet,
        children: simulationExecutionRouter,
      },
    ],
  },
] as const satisfies RouteObject[]);
