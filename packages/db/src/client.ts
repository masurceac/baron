import { sql, SQL, SQLChunk } from 'drizzle-orm';
import { SelectedFields, PgColumn } from 'drizzle-orm/pg-core';
import * as schema from './schema';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

type QueryReturnType<T extends SelectedFields> = {
  [K in keyof T]: T[K] extends PgColumn<infer U>
    ? U['data']
    : Exclude<T[K], undefined> extends SQL<infer R>
      ? R
      : never;
};

type ColumnDefType =
  | { dataType: string; columnType: string }
  | {
      decoder: {
        mapFromDriverValue: (value: unknown) => unknown;
      };
    };

function parseColumnPrimivitveTypes<
  TSelection extends SelectedFields,
  Result extends QueryReturnType<TSelection> = QueryReturnType<TSelection>,
>(columns: TSelection, value: string | Result): QueryReturnType<TSelection> {
  const intermediaryResult = (() => {
    try {
      if (typeof value === 'string') {
        return JSON.parse(value) as Result;
      }
    } catch {
      // do nothing
    }
    return value as unknown as Result;
  })();

  Object.keys(columns).forEach((key) => {
    const columnDef = columns[key] as ColumnDefType;
    try {
      if ('decoder' in columnDef) {
        if (intermediaryResult?.[key])
          // @ts-expect-error this has already been checked
          intermediaryResult[key] = columnDef.decoder.mapFromDriverValue(
            intermediaryResult[key],
          );
      } else {
        if (columnDef.dataType === 'json') {
          if (intermediaryResult?.[key])
            // @ts-expect-error this has already been checked
            intermediaryResult[key] = JSON.parse(
              // @ts-expect-error this has already been checked
              intermediaryResult[key],
            );
        }
        if (
          columnDef.dataType === 'date' &&
          typeof intermediaryResult?.[key] === 'number'
        ) {
          // @ts-expect-error this has already been checked
          intermediaryResult[key] = new Date(
            (intermediaryResult?.[key] as unknown as number) * 1000,
          );
        }
        if (
          columnDef.dataType === 'boolean' &&
          typeof intermediaryResult?.[key] === 'number'
        ) {
          // @ts-expect-error this has already been checked
          intermediaryResult[key] = Boolean(
            intermediaryResult?.[key] as unknown as number,
          );
        }
      }
    } catch {
      // do nothing
    }
  });

  return intermediaryResult;
}

export function queryJoin<TSelection extends SelectedFields>(
  db: ReturnType<typeof getDrizzleClient>,
  columns: TSelection,
  cb: (query: ReturnType<typeof db.select>) => SQLChunk,
) {
  const columnsMap = Object.entries(columns).map(([key, value]) =>
    sql.raw(`'${key}',`).append(sql`${value}`),
  );

  type Result = QueryReturnType<TSelection>;

  const subselectMap = (Object.entries(columns) as Array<[string, PgColumn]>)
    .filter(([, tableColumn]) => tableColumn.name)
    .map(([key, tableColumn]) =>
      // key should be '' as string value
      sql.raw(`'${key}',"subquery"."${tableColumn.name}"`),
    );

  const sqlSelect = columnsMap.reduce(
    (chunk, item, index) =>
      index < columnsMap.length - 1
        ? chunk.append(item).append(sql`, `)
        : chunk.append(item),
    sql``,
  );

  const jsonbAggSelect = sql`jsonb_agg(json_build_object${subselectMap})`;

  const subselect = sql`(SELECT ${jsonbAggSelect} FROM ${cb(db.select({ subquery: sqlSelect }))} AS subquery)`;

  return sql<Result[]>`${subselect}`.mapWith({
    mapFromDriverValue(value) {
      if (value === null) {
        return null;
      }
      const intermediaryResult = value as Result[];

      for (let i = 0; i < intermediaryResult.length; i++) {
        intermediaryResult[i] = parseColumnPrimivitveTypes(
          columns,
          intermediaryResult[i] as string,
        );
      }

      return intermediaryResult;
    },
  });
}

export function queryJoinOne<TSelection extends SelectedFields>(
  db: ReturnType<typeof getDrizzleClient>,
  columns: TSelection,
  cb: (query: ReturnType<typeof db.select>) => SQLChunk,
) {
  const columnsMap = Object.entries(columns).map(([key, value]) =>
    sql.raw(`'${key}',`).append(sql`${value}`),
  );

  type Result = QueryReturnType<TSelection>;

  const sqlSelect = columnsMap.reduce(
    (chunk, item, index) =>
      index < columnsMap.length - 1
        ? chunk.append(item).append(sql`, `)
        : chunk.append(item),
    sql``,
  );

  return sql<Result | null>`${cb(
    db.select({
      json: sql`json_build_object(${sqlSelect})`,
    }),
  )}`.mapWith({
    mapFromDriverValue(value) {
      if (value === null) {
        return null;
      }
      return parseColumnPrimivitveTypes(columns, value);
    },
  });
}

export function getDrizzleClient(connectionString: string) {
  const queryClient = postgres(connectionString, {
    max: 1,
  });

  const db = drizzle({ client: queryClient, schema });

  return db;
}

export type DrizzleTransactionType = Parameters<
  Parameters<ReturnType<typeof getDrizzleClient>['transaction']>[0]
>[0];
