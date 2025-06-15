import { defineModuleRouting } from '@baron/routes/utils';
import { RouteObject } from 'react-router-dom';
import { RedirectToList } from './components/redirect-to-list';
import { LiveTradingRoomCreatePage } from './pages/create';
import { LiveTradingRoomEditPage } from './pages/edit';
import { LiveTradingRoomListPage } from './pages/list';
import { LiveTradingRoomViewPage } from './pages/view';

export const liveTradingRoomRouter = defineModuleRouting([
  {
    path: '',
    children: [
      {
        index: true,
        Component: RedirectToList,
      },
      {
        path: 'list',
        Component: LiveTradingRoomListPage,
      },
      {
        path: 'create',
        Component: LiveTradingRoomCreatePage,
      },
      {
        path: 'edit/:liveTradingRoomId',
        Component: LiveTradingRoomEditPage,
      },
      {
        path: 'view/:liveTradingRoomId',
        Component: LiveTradingRoomViewPage,
      },
    ],
  },
] as const satisfies RouteObject[]);
