class UnprocessableEntityException extends Error {}

export type PaginateQueryArguments = {
  skip: number;
  take: number;
};

export type PaginateArgs<QueryResult> = {
  skip?: number;
  take?: number;
  maxTake?: number;
  count: () => Promise<number>;
  query: (args: PaginateQueryArguments) => Promise<QueryResult[]>;
};

export type PaginateResult<T> = {
  data: T[];
  nextPage: PaginateQueryArguments | null;
  hasMore: boolean;
  count: number;
};

export type PagePropsWithPagination = {
  searchParams: {
    pagination: string;
  };
};

const isInteger = (value: unknown): value is number =>
  typeof value === 'number' && value % 1 === 0;

export async function paginate<QueryResult>({
  skip = 0,
  take = 0,
  maxTake = 250,
  count: countQuery,
  query,
}: PaginateArgs<QueryResult>): Promise<PaginateResult<QueryResult>> {
  if (!isInteger(skip)) {
    throw new UnprocessableEntityException('`skip` argument must be a integer');
  }
  if (!isInteger(take)) {
    throw new UnprocessableEntityException('`take` argument must be a integer');
  }
  if (!isInteger(maxTake)) {
    throw new UnprocessableEntityException(
      '`maxTake` argument must be a integer'
    );
  }
  if (typeof countQuery !== 'function') {
    throw new UnprocessableEntityException(
      '`count` argument must be a function'
    );
  }
  if (typeof query !== 'function') {
    throw new UnprocessableEntityException(
      '`query` argument must be a function'
    );
  }
  if (skip < 0) {
    throw new UnprocessableEntityException(
      '`skip` argument must be a positive number'
    );
  }
  if (take < 0) {
    throw new UnprocessableEntityException(
      '`take` argument must be a positive number'
    );
  }
  if (take > maxTake) {
    throw new UnprocessableEntityException(
      '`take` argument must less than `maxTake` which is currently ' + maxTake
    );
  }

  const [count, data] = await Promise.all([
    countQuery(),
    query({ skip, take }),
  ]);

  const hasMore = skip + take < count;
  const nextPage = hasMore ? { take, skip: skip + take } : null;

  return {
    data,
    nextPage,
    hasMore,
    count,
  };
}
