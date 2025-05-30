import type { routes } from '@/root-router';
import { GetReactRouterPaths } from '@baron/routes/spa';
import { ExtractVariablesFromPath, getTypedRoute } from '@baron/routes/types';

type AllRoutes = GetReactRouterPaths<'', typeof routes>;

export const getAppRoute = getTypedRoute<AllRoutes>();

type RouteParams = Parameters<typeof getAppRoute>[0];
export type GetRouteParams<T extends RouteParams> = ExtractVariablesFromPath<T>;
