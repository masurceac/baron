import { defineModuleRouting } from '@baron/routes/utils';
import { Outlet, RouteObject } from 'react-router-dom';
import { RedirectToList } from './components/redirect-to-list';
import { SimulationRoomCreatePage } from './pages/create';
import { SimulationRoomListPage } from './pages/list';
import { simulationSetupRouter } from '../simulation-setup';

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
        path: 'room/:roomId',
        Component: Outlet,
        children: simulationSetupRouter,
      },
    ],
  },
] as const satisfies RouteObject[]);
