import { trpc } from '@/core/trpc';
import { DataTable } from '@baron/ui/components/data-table';
import { RedGreenHighlight } from '@/modules/shared';
import { DetailedTextDialog } from '@/modules/shared/components/detailed-text-dialog';
import { TradeDirection } from '@baron/common';
import { RouterOutput } from '@baron/server';
import { FormatDate } from '@baron/ui/components/format-date';
import { ColumnDef } from '@tanstack/react-table';
import { Suspense, useMemo } from 'react';

type TableItem = RouterOutput['tradeHistory']['list'][number];

function ExecutionTradeHistoryItems(props: { executionId: string }) {
  const [data] = trpc.tradeHistory.list.useSuspenseQuery({
    executionId: props.executionId,
  });

  const columns = useMemo<ColumnDef<TableItem>[]>(
    () => [
      {
        id: 'index',
        enableSorting: false,
        header: '#',
        cell: ({ row: { index } }) => `${data.length - index}`,
      },
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
        accessorKey: 'entryDate',
        enableSorting: false,
        header: 'Trade Dates',
        cell: ({ row: { original } }) => (
          <div>
            <FormatDate date={original.entryDate} utc />
            <br />
            <FormatDate date={original.exitDate} utc />
          </div>
        ),
      },
      {
        accessorKey: 'direction',
        enableSorting: false,
        header: 'Created At',
        cell: ({ row: { original } }) => (
          <div>
            <RedGreenHighlight
              variant={
                original.direction === TradeDirection.Buy ? 'green' : 'red'
              }
            >
              {original.direction === TradeDirection.Buy ? 'BUY' : 'SELL'}
            </RedGreenHighlight>
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
        accessorKey: 'takeProfitPrice',
        enableSorting: false,
        header: 'TP/SL',
        cell: ({ row: { original } }) => (
          <div>
            <div>
              ${original.takeProfitPrice.toFixed(2)}&nbsp;/ $
              {original.stopLossPrice.toFixed(2)}
            </div>
            <div>
              $
              {Math.abs(original.entryPrice - original.takeProfitPrice).toFixed(
                2,
              )}
              &nbsp;/ $
              {Math.abs(original.entryPrice - original.stopLossPrice).toFixed(
                2,
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'exitPrice',
        enableSorting: false,
        header: 'Exit Price',
        cell: ({ row: { original } }) => (
          <RedGreenHighlight
            variant={
              original.direction === TradeDirection.Buy
                ? original.exitPrice < original.entryPrice
                  ? 'red'
                  : 'green'
                : original.exitPrice > original.entryPrice
                  ? 'red'
                  : 'green'
            }
          >
            ${original.exitPrice.toFixed(2)}
          </RedGreenHighlight>
        ),
      },
      {
        accessorKey: 'balanceResult',
        enableSorting: false,
        header: 'Result',
        cell: ({ row: { original } }) => (
          <div>
            <RedGreenHighlight
              variant={original.balanceResult >= 0 ? 'green' : 'red'}
            >
              $
              {original.balanceResult >= 0
                ? `+${original.balanceResult.toFixed(2)}`
                : `-${Math.abs(original.balanceResult).toFixed(2)}`}
            </RedGreenHighlight>
          </div>
        ),
      },
      {
        accessorKey: 'reason',
        enableSorting: false,
        header: 'Reason',
        cell: ({ row: { original } }) => (
          <div>
            <DetailedTextDialog
              title="This is the reason AI gave for this trade"
              content={original.reason}
              label="Reason"
            />
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row: { original } }) => <div>{original.status}</div>,
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
