type RouteWithPath = {
  readonly path: string;
  readonly id: string;
};

type Route = RouteWithPath | {};

type RemoveEndingSlash<R extends string> = R extends `${infer U}/` ? U : R;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type GetEndingPath<R extends string> = R extends `/${infer _U}`
  ? R
  : R extends ''
  ? R
  : `/${R}`;

type ConcatenatePaths<
  R1 extends string,
  R2 extends string | undefined
> = `${RemoveEndingSlash<R1>}${GetEndingPath<R2 extends string ? R2 : ''>}`;

export type GetReactRouterPaths<
  CurrentPath extends string,
  Item extends readonly Route[] | Route
> = Item extends Readonly<[infer FirstRoute, ...infer OtherRoutes]>
  ?
      | (FirstRoute extends { readonly path: string }
          ? ConcatenatePaths<CurrentPath, FirstRoute['path']>
          : never)
      | (FirstRoute extends { children: readonly Route[] }
          ? FirstRoute extends { readonly path: string }
            ? GetReactRouterPaths<
                ConcatenatePaths<CurrentPath, FirstRoute['path']>,
                FirstRoute['children']
              >
            : GetReactRouterPaths<CurrentPath, FirstRoute['children']>
          : never)
      | (OtherRoutes extends readonly Route[]
          ? GetReactRouterPaths<CurrentPath, OtherRoutes>
          : never)
  : never;
