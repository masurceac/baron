import { defineModuleRouting } from '@baron/routes/utils';
import { RouteObject } from 'react-router-dom';
import { RedirectToList } from './components/redirect-to-list';
import { InfoBarCreatePage } from './pages/info-bar-create';
import { InfoBarsListPage } from './pages/info-bar-list';

export const infoBarsRouter = defineModuleRouting([
  {
    path: 'info-bars',
    children: [
      {
        index: true,
        Component: RedirectToList,
      },
      {
        path: 'list',
        Component: InfoBarsListPage,
      },
      {
        path: 'create',
        Component: InfoBarCreatePage,
      },
      {
        path: 'view/:infoBarId',
        Component: InfoBarCreatePage,
      },
    ],
  },
] as const satisfies RouteObject[]);
