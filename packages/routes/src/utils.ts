import { RouteObject } from 'react-router-dom';

export function defineModuleRouting<T extends Readonly<RouteObject[]>>(
  routes: T
): T {
  return routes;
}
