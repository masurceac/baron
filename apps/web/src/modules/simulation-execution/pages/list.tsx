import { getAppRoute, GetRouteParams } from '@/core/route';
import { trpc } from '@/core/trpc';
import { DataTable, PageLayout, useCurrentPagination } from '@/modules/shared';
import { SpaPagination } from '@/modules/shared/components/pagination';
import { RouterOutput } from '@baron/server';
import { Button } from '@baron/ui/components/button';
import { FormatDate } from '@baron/ui/components/format-date';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import { Suspense, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TradeResult } from '../components/trade-result';

type TableItem = RouterOutput['simulationExecution']['list']['data'][number];

const TAKE = 10;

function ListData() {
  const pagination = useCurrentPagination({ take: TAKE });
  const params =
    useParams<
      GetRouteParams<'/app/simulation/room/:roomId/setup/:setupId/list'>
    >();

  const [list] = trpc.simulationExecution.list.useSuspenseQuery({
    skip: pagination.skip,
    take: TAKE,
    simulationSetupId: params.setupId ?? '',
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
        accessorKey: 'id',
        enableSorting: false,
        header: 'Executions',
        cell: ({ row: { original } }) => (
          <TradeResult trades={original.trades ?? []} />
        ),
      },
      {
        accessorKey: 'id',
        enableSorting: false,
        header: 'Details',
        cell: ({ row: { original } }) => (
          <Button asChild variant="link" className="-ml-2">
            <Link
              to={getAppRoute(
                '/app/simulation/room/:roomId/setup/:setupId/view/:executionId',
                {
                  setupId: params.setupId ?? '',
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
  const params =
    useParams<
      GetRouteParams<'/app/simulation/room/:roomId/setup/:setupId/list'>
    >();
  return (
    <PageLayout
      title={
        <p>
          <Button asChild variant="link" size="sm">
            <Link
              to={getAppRoute('/app/simulation/room/:roomId/list', {
                roomId: params.roomId ?? '',
              })}
            >
              <ArrowLeftIcon className="w-4 mr-2" /> Back to Setups
            </Link>
          </Button>
          Simulation Executions List.
        </p>
      }
    >
      <div>
        <Suspense>
          <ListData />
        </Suspense>
      </div>
    </PageLayout>
  );
}
