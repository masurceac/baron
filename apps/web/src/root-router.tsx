import { defineModuleRouting } from '@baron/routes/utils';
import { createBrowserRouter, RouteObject } from 'react-router-dom';
import { CoreProviders } from './core/providers';
import { AppRedirect } from './modules/app-root';
import { authRouter } from './modules/auth';
import { appRouter } from './modules/router';

export const routes = defineModuleRouting([
  {
    element: <CoreProviders />,
    children: [
      {
        path: '/',
        Component: AppRedirect,
      },
      {
        path: '/auth',
        children: [...authRouter],
      },
      {
        path: '/app',
        children: appRouter,
      },
    ],
  },
] as const satisfies RouteObject[]);

export const routerInstance: ReturnType<typeof createBrowserRouter> =
  createBrowserRouter(routes as RouteObject[]);
