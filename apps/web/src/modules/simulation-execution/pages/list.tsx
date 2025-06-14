import { getAppRoute, GetRouteParams } from '@/core/route';
import { trpc } from '@/core/trpc';
import { DataTable, PageLayout, useCurrentPagination } from '@/modules/shared';
import { SpaPagination } from '@/modules/shared/components/pagination';
import { SimulationRoomDetails } from '@/modules/simulation-room/components/simulation-room-details';
import { RouterOutput } from '@baron/server';
import { Button } from '@baron/ui/components/button';
import { FormatDate } from '@baron/ui/components/format-date';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import { Suspense, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TradeCountResult, TradeMoneyResult } from '../components/trade-result';
import { ExecutionStatus } from '../components/execution-status';

type TableItem = RouterOutput['simulationExecution']['list']['data'][number];

const TAKE = 25;

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
        id: 'index',
        enableSorting: false,
        header: '#',
        cell: ({ row: { index } }) =>
          `${list.count - pagination.skip * pagination.take - index}`,
      },
      {
        accessorKey: 'startDate',
        enableSorting: false,
        header: 'Start Date / Status',
        cell: ({ row: { original } }) => (
          <div className="flex flex-col space-y-1">
            <FormatDate date={original.startDate} utc />
            <ExecutionStatus status={original.status} />
          </div>
        ),
      },
      {
        id: 'trade-balance',
        enableSorting: false,
        header: 'Balance',
        cell: ({ row: { original } }) => (
          <TradeMoneyResult trades={original.trades ?? []} />
        ),
      },
      {
        accessorKey: 'trades',
        enableSorting: false,
        header: 'Trades',
        cell: ({ row: { original } }) => (
          <TradeCountResult trades={original.trades ?? []} />
        ),
      },
      {
        id: 'actions',
        enableSorting: false,
        header: () => null,
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
    <div className="space-y-8">
      <SimulationRoomDetails simulationRoomId={params.roomId ?? ''} />
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
