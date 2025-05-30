import { trpc } from '@/core/trpc';
import { Suspense, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { RouterOutput } from '@baron/server';
import { FormatDate } from '@baron/ui/components/format-date';
import { DataTable } from '@/modules/shared';
import { TradeDirection } from '@baron/common';

type TableItem = RouterOutput['tradeHistory']['list'][number];

function ExecutionTradeHistoryItems(props: { executionId: string }) {
  const [data] = trpc.tradeHistory.list.useSuspenseQuery({
    executionId: props.executionId,
  });

  const columns = useMemo<ColumnDef<TableItem>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        enableSorting: false,
        header: 'Created At',
        cell: ({ row: { original } }) => (
          <div>
            <FormatDate date={original.createdAt} format="long" />
            <p className="text-xs text-muted-foreground">{original.id}</p>
          </div>
        ),
      },
      {
        accessorKey: 'direction',
        enableSorting: false,
        header: 'Created At',
        cell: ({ row: { original } }) => (
          <div>
            {original.direction === TradeDirection.Buy ? (
              <span className="text-green-500">BUY</span>
            ) : (
              <span className="text-red-500">SELL</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'entryDate',
        enableSorting: false,
        header: 'Entry Date',
        cell: ({ row: { original } }) => (
          <div>
            <FormatDate date={original.entryDate} format="long" />
          </div>
        ),
      },
      {
        accessorKey: 'entryPrice',
        enableSorting: false,
        header: 'Entry Price',
        cell: ({ row: { original } }) => (
          <div>${original.entryPrice.toFixed(2)}</div>
        ),
      },
      {
        accessorKey: 'exitDate',
        enableSorting: false,
        header: 'Exit Date',
        cell: ({ row: { original } }) => (
          <div>
            <FormatDate date={original.exitDate} format="long" />
          </div>
        ),
      },
      {
        accessorKey: 'exitPrice',
        enableSorting: false,
        header: 'Exit Price',
        cell: ({ row: { original } }) => (
          <div>${original.exitPrice.toFixed(2)}</div>
        ),
      },
      {
        accessorKey: 'takeProfitPrice',
        enableSorting: false,
        header: 'TP/SL',
        cell: ({ row: { original } }) => (
          <div>
            {original.takeProfitPrice.toFixed(2)}/
            {original.stopLossPrice.toFixed(2)}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <DataTable columns={columns} data={data} />
    </div>
  );
}

export function ExecutionTradeHistory(props: { executionId: string }) {
  return (
    <Suspense>
      <ExecutionTradeHistoryItems executionId={props.executionId} />
    </Suspense>
  );
}
