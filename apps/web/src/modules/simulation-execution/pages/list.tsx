import { getAppRoute, GetRouteParams } from '@/core/route';
import { trpc } from '@/core/trpc';
import { DataTable, PageLayout, useCurrentPagination } from '@/modules/shared';
import { SpaPagination } from '@/modules/shared/components/pagination';
import { RouterOutput } from '@baron/server';
import { Button } from '@baron/ui/components/button';
import { FormatDate } from '@baron/ui/components/format-date';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowLeftIcon, ArrowRightIcon, PlusCircleIcon } from 'lucide-react';
import { Suspense, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TradeResult } from '../components/trade-result';
import { ExecutionStatus } from '../components/execution-status';
import { TradingPairSelect } from '@/modules/inputs/trading-pair-select';

type TableItem = RouterOutput['simulationExecution']['list']['data'][number];

const TAKE = 10;

function ListData() {
  const pagination = useCurrentPagination({ take: TAKE });
  const params =
    useParams<GetRouteParams<'/app/simulation/room/:roomId/list'>>();

  const [list] = trpc.simulationExecution.list.useSuspenseQuery({
    skip: pagination.skip,
    take: TAKE,
    simulationRoomId: params.roomId ?? '',
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
        accessorKey: 'status',
        enableSorting: false,
        header: 'Status',
        cell: ({ row: { original } }) => (
          <ExecutionStatus status={original.status} />
        ),
      },
      {
        accessorKey: 'pair',
        enableSorting: false,
        header: 'Symbol',
        cell: ({ row: { original } }) => (
          <TradingPairSelect
            value={original.pair}
            onChange={() => null}
            disabled
          />
        ),
      },
      {
        accessorKey: 'startDate',
        enableSorting: false,
        header: 'Symbol / Start Date',
        cell: ({ row: { original } }) => (
          <FormatDate date={original.startDate} utc />
        ),
      },
      {
        accessorKey: 'tradesToExecute',
        enableSorting: false,
        header: 'Executions',
        cell: ({ row: { original } }) => (
          <p>
            {`${original.trades?.length ?? 0} / ${original.tradesToExecute ?? 0} executed`}
          </p>
        ),
      },
      {
        accessorKey: 'trades',
        enableSorting: false,
        header: 'Trade Success',
        cell: ({ row: { original } }) => (
          <TradeResult trades={original.trades ?? []} />
        ),
      },
      {
        id: 'actions',
        enableSorting: false,
        header: () => (
          <Button asChild size="icon" variant="link">
            <Link
              to={getAppRoute('/app/simulation/room/:roomId/run', {
                roomId: params.roomId ?? '',
              })}
            >
              <PlusCircleIcon className="w-4" />
            </Link>
          </Button>
        ),
        cell: ({ row: { original } }) => (
          <Button asChild variant="link" className="-ml-2">
            <Link
              to={getAppRoute(
                '/app/simulation/room/:roomId/view/:executionId',
                {
                  roomId: params.roomId ?? '',
                  executionId: original.id,
                },
              )}
            >
              Show Details <ArrowRightIcon className="w-4" />
            </Link>
          </Button>
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

export function SimulationExececutionListPage() {
  return (
    <Suspense>
      <PageLayout
        title={
          <p>
            <Button asChild variant="link" size="sm">
              <Link to={getAppRoute('/app/simulation/list')}>
                <ArrowLeftIcon className="w-4 mr-2" /> Back
              </Link>
            </Button>
          </p>
        }
      >
        <div>
          <ListData />
        </div>
      </PageLayout>
    </Suspense>
  );
}
