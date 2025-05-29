import { defineModuleRouting } from '@baron/routes/utils';
import { RouteObject } from 'react-router-dom';
import { vpcRouter } from '../volume-profile-config';
import { AuthGuard } from './components/auth-guard';
import { MainPage } from './pages/main-page';

export const appRouter = defineModuleRouting([
  {
    Component: AuthGuard,
    children: [
      {
        path: '',
        Component: MainPage,
      },
      ...vpcRouter,
    ],
  },
] as const satisfies RouteObject[]);
