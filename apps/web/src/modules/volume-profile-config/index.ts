import { defineModuleRouting } from '@baron/routes/utils';
import { RouteObject } from 'react-router-dom';
import { VPCCreatePage } from './pages/vpc-create';
import { RedirectToList } from './components/redirect-to-list';

export const vpcRouter = defineModuleRouting([
  {
    path: 'volume-profile-config',
    children: [
      {
        index: true,
        Component: RedirectToList,
      },
      {
        path: 'create',
        Component: VPCCreatePage,
      },
    ],
  },
] as const satisfies RouteObject[]);
