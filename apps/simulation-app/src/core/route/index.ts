import type { routes } from '@/root-router';
import { GetReactRouterPaths } from '@baron/routes/spa';
import { getTypedRoute } from '@baron/routes/types';

type AllRoutes = GetReactRouterPaths<'', typeof routes>;

export const getAppRoute = getTypedRoute<AllRoutes>();
