import { defineModuleRouting } from '@baron/routes/utils';
import { RouteObject } from 'react-router-dom';
import { AppHomepage } from './components/app-main';
import { AuthGuard } from './components/auth-guard';
import { MainPage } from './pages/main-page';

export const appRouter = defineModuleRouting([
  {
    Component: AuthGuard,
    children: [
      {
        path: '',
        Component: MainPage,
        children: [
          {
            path: '',
            Component: AppHomepage,
          },
        ],
      },
    ],
  },
] as const satisfies RouteObject[]);
