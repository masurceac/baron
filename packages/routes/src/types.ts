import { generatePath } from 'react-router-dom';

export type ExtractVariablesFromPath<Path> =
  Path extends `:${infer Variable}/${infer Rest}`
    ? Variable | ExtractVariablesFromPath<Rest>
    : // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Path extends `${infer _First}/:${infer Variable}/${infer Rest}`
      ? Variable | ExtractVariablesFromPath<Rest>
      : Path extends `:${infer Variable}`
        ? Variable
        : // eslint-disable-next-line @typescript-eslint/no-unused-vars
          Path extends `${infer _First}/:${infer Variable}`
          ? Variable
          : never;

export type RouteOptions<Path> =
  ExtractVariablesFromPath<Path> extends never
    ? undefined
    : Record<ExtractVariablesFromPath<Path>, RouteVariableValueType>;

export type RouteVariableValueType = string | number | boolean;

export const getTypedRoute = <T>() => {
  function getRoute<U extends T>(
    ...args: RouteOptions<U> extends undefined ? [U] : [U, RouteOptions<U>]
  ): string {
    const [path, options] = args;
    return generatePath(String(path), options);
  }

  return getRoute;
};
