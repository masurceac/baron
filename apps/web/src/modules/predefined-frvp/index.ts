import { defineModuleRouting } from '@baron/routes/utils';
import { RouteObject } from 'react-router-dom';
import { RedirectToList } from './components/redirect-to-list';
import { FRVPCreatePage } from './pages/create';
import { FRVPEditPage } from './pages/edit';
import { FRVPListPage } from './pages/list';

export const frvpRouter = defineModuleRouting([
  {
    path: '',
    children: [
      {
        index: true,
        Component: RedirectToList,
      },
      {
        path: 'list',
        Component: FRVPListPage,
      },
      {
        path: 'create',
        Component: FRVPCreatePage,
      },
      {
        path: 'edit/:frvpId',
        Component: FRVPEditPage,
      },
    ],
  },
] as const satisfies RouteObject[]);
