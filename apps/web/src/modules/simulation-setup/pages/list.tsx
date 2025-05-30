import { getAppRoute, GetRouteParams } from '@/core/route';
import { trpc } from '@/core/trpc';
import { TradingPairSelect } from '@/modules/inputs/trading-pair-select';
import { DataTable, PageLayout, useCurrentPagination } from '@/modules/shared';
import { SpaPagination } from '@/modules/shared/components/pagination';
import { RouterOutput } from '@baron/server';
import { Button } from '@baron/ui/components/button';
import { FormatDate } from '@baron/ui/components/format-date';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowRightIcon, PlusCircleIcon } from 'lucide-react';
import { Suspense, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExecuteSetup } from '../components/execute-setup';
import { ItemActions } from '../components/item-actions';

type TableItem = RouterOutput['simulationSetup']['list']['data'][number];

const TAKE = 10;

function ListData() {
  const pagination = useCurrentPagination({ take: TAKE });
  const params = useParams<GetRouteParams<'/app/simulation/room/:roomId'>>();

  const [list] = trpc.simulationSetup.list.useSuspenseQuery({
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
        accessorKey: 'pair',
        enableSorting: false,
        header: 'Pair',
        cell: ({ row: { original } }) => (
          <div>
            <TradingPairSelect
              disabled
              value={original.pair}
              onChange={() => null}
            />
          </div>
        ),
      },
      {
        accessorKey: 'id',
        enableSorting: false,
        header: 'Executions',
        cell: ({ row: { original } }) => (
          <div>
            <Button asChild variant="link" className="-ml-2">
              <Link
                to={getAppRoute(
                  '/app/simulation/room/:roomId/setup/:setupId/list',
                  {
                    setupId: original.id,
                    roomId: params.roomId ?? '',
                  },
                )}
              >
                View Executions <ArrowRightIcon className="w-4" />
              </Link>
            </Button>
          </div>
        ),
      },
      {
        accessorKey: 'id',
        enableSorting: false,
        header: 'Execute',
        cell: ({ row: { original } }) => (
          <div>
            <ExecuteSetup simulationSetupId={original.id} />
          </div>
        ),
      },
      {
        accessorKey: 'id',
        header: () => (
          <Button asChild size="icon" variant="link">
            <Link
              to={getAppRoute('/app/simulation/room/:roomId/create', {
                roomId: params.roomId!,
              })}
            >
              <PlusCircleIcon className="w-4" />
            </Link>
          </Button>
        ),
        cell: ({ row: { original } }) => (
          <ItemActions item={{ id: original.id }} />
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

export function SimulationSetupsListPage() {
  return (
    <PageLayout title="Simulation Setup List">
      <div>
        <Suspense>
          <ListData />
        </Suspense>
      </div>
    </PageLayout>
  );
}
