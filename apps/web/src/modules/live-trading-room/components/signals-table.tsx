import { trpc } from '@/core/trpc';
import { DataTable } from '@baron/ui/components/data-table';
import { SpaPagination } from '@/modules/shared/components/pagination';
import { useCurrentPagination } from '@/modules/shared';
import { RouterOutput } from '@baron/server';
import { FormatDate } from '@baron/ui/components/format-date';
import { DetailedTextDialog } from '@/modules/shared/components/detailed-text-dialog';
import { Badge } from '@baron/ui/components/badge';
import { ColumnDef } from '@tanstack/react-table';
import { Suspense, useMemo } from 'react';

type TableItem = RouterOutput['liveTradingRoom']['signals']['data'][number];

const TAKE = 25;

function SignalsTableContent(props: { liveTradingRoomId: string }) {
  const pagination = useCurrentPagination({ take: TAKE });
  const [list] = trpc.liveTradingRoom.signals.useSuspenseQuery({
    liveTradingRoomId: props.liveTradingRoomId,
    skip: pagination.skip,
    take: TAKE,
  });

  const columns = useMemo<ColumnDef<TableItem>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        enableSorting: false,
        header: 'Created At',
        cell: ({ row: { original } }) => (
          <FormatDate date={original.createdAt} format="long" />
        ),
      },
      {
        accessorKey: 'suggestions',
        enableSorting: false,
        header: 'Signals',
        cell: ({ row: { original } }) => (
          <div className="space-y-2">
            {original.suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Badge
                  variant={
                    suggestion.type === 'buy'
                      ? 'default'
                      : suggestion.type === 'sell'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {suggestion.type.toUpperCase()}
                </Badge>
                {suggestion.stopLossPrice && (
                  <span className="text-sm text-muted-foreground">
                    SL: ${suggestion.stopLossPrice.toFixed(2)}
                  </span>
                )}
                {suggestion.takeProfitPrice && (
                  <span className="text-sm text-muted-foreground">
                    TP: ${suggestion.takeProfitPrice.toFixed(2)}
                  </span>
                )}
              </div>
            ))}
          </div>
        ),
      },
      {
        accessorKey: 'reason',
        enableSorting: false,
        header: 'Reasons',
        cell: ({ row: { original } }) => (
          <div className="space-y-2">
            {original.suggestions.map((suggestion, index) => (
              <div key={index}>
                {suggestion.reason && (
                  <DetailedTextDialog
                    title={`Signal ${index + 1} Reason`}
                    content={suggestion.reason}
                    label={`Reason ${index + 1}`}
                  />
                )}
              </div>
            ))}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <DataTable columns={columns} data={list.data} />

      {list.count ? (
        <SpaPagination
          nextPage={list.nextPage ?? { skip: 0, take: TAKE }}
          count={list.count ?? 0}
          hasMore={list.hasMore ?? false}
          limit={TAKE}
        />
      ) : null}
    </div>
  );
}

export function SignalsTable(props: { liveTradingRoomId: string }) {
  return (
    <Suspense>
      <SignalsTableContent liveTradingRoomId={props.liveTradingRoomId} />
    </Suspense>
  );
}
