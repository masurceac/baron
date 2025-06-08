import { trpc } from '@/core/trpc';
import { DataTable, RedGreenHighlight } from '@/modules/shared';
import { DetailedTextDialog } from '@/modules/shared/components/detailed-text-dialog';
import { TradeLogDirection } from '@baron/common';
import { RouterOutput } from '@baron/server';
import { FormatDate } from '@baron/ui/components/format-date';
import { ColumnDef } from '@tanstack/react-table';
import { Suspense, useMemo } from 'react';

type TableItem = RouterOutput['logHistory']['list'][number];

function ExecutionLogsItems(props: { executionId: string }) {
  const [data] = trpc.logHistory.list.useSuspenseQuery({
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
        accessorKey: 'direction',
        enableSorting: false,
        header: 'Direction',
        cell: ({ row: { original } }) => (
          <div>
            {original.direction !== TradeLogDirection.Hold ? (
              <RedGreenHighlight
                variant={
                  original.direction === TradeLogDirection.Buy ? 'green' : 'red'
                }
              >
                {original.direction === TradeLogDirection.Buy ? 'BUY' : 'SELL'}
              </RedGreenHighlight>
            ) : (
              <div>Hold</div>
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
            <FormatDate date={original.date} utc />
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
        accessorKey: 'simulationExecutionTradeId',
        enableSorting: false,
        header: 'Trade ID',
        cell: ({ row: { original } }) => (
          <div>{original.simulationExecutionTradeId ?? 'n/a'}</div>
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

export function ExecutionLogs(props: { executionId: string }) {
  return (
    <Suspense>
      <ExecutionLogsItems executionId={props.executionId} />
    </Suspense>
  );
}
