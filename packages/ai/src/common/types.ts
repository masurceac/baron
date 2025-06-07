export type GetAllVariables<T extends string> =
  T extends `${string}{{${infer Key}}}${infer Rest}`
    ? { [K in Key | keyof GetAllVariables<Rest>]: string }
    : {};
