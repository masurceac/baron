import { defineModuleRouting } from '@baron/routes/utils';
import { RouteObject } from 'react-router-dom';
import { VPCCreatePage } from './pages/vpc-create';
import { RedirectToList } from './components/redirect-to-list';
import { VPCList } from './pages/vpc-list';

export const vpcRouter = defineModuleRouting([
  {
    path: 'volume-profile-config',
    children: [
      {
        index: true,
        Component: RedirectToList,
      },
      {
        path: 'list',
        Component: VPCList,
      },
      {
        path: 'create',
        Component: VPCCreatePage,
      },
      {
        path: 'view/:vpcId',
        Component: VPCCreatePage,
      },
    ],
  },
] as const satisfies RouteObject[]);
