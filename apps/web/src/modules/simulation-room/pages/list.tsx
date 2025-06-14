import { getAppRoute } from '@/core/route';
import { trpc } from '@/core/trpc';
import { DataTable, PageLayout, useCurrentPagination } from '@/modules/shared';
import { SpaPagination } from '@/modules/shared/components/pagination';
import { ExecutionStatus } from '@/modules/simulation-execution/components/execution-status';
import { RouterOutput } from '@baron/server';
import { Button } from '@baron/ui/components/button';
import { FormatDate } from '@baron/ui/components/format-date';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowRightIcon, PlusCircleIcon } from 'lucide-react';
import { Suspense, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ItemActions } from '../components/item-actions';
import {
  TradeCountResult,
  TradeMoneyResult,
} from '@/modules/simulation-execution/components/trade-result';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@baron/ui/components/tooltip';

type TableItem = RouterOutput['simulationRoom']['list']['data'][number];

const TAKE = 25;

function ListData() {
  const pagination = useCurrentPagination({ take: TAKE });
  const [list] = trpc.simulationRoom.list.useSuspenseQuery({
    skip: pagination.skip,
    take: TAKE,
  });

  const columns = useMemo<ColumnDef<TableItem>[]>(
    () => [
      {
        accessorKey: 'name',
        enableSorting: false,
        header: 'Name',
        cell: ({ row: { original } }) => (
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="max-w-80 truncate">{original.name}</p>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start">
                {original.name}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs text-muted-foreground max-w-80 truncate">
                  {original.description}
                </p>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start">
                {original.description}
              </TooltipContent>
            </Tooltip>
            <p className="text-xs text-muted-foreground">
              <FormatDate date={original.createdAt} format="long" />
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'startDate',
        enableSorting: false,
        header: 'Start Date',
        cell: ({ row: { original } }) => (
          <FormatDate date={original.startDate} utc />
        ),
      },
      {
        accessorKey: 'authorName',
        enableSorting: false,
        header: 'Author',
        cell: ({ row: { original } }) => (
          <div>
            <p>{original.authorName}</p>
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
        id: 'trades',
        enableSorting: false,
        header: 'Trades',
        cell: ({ row: { original } }) => (
          <div className="flex space-x-2">
            <TradeMoneyResult trades={original.trades ?? []} />
            <TradeCountResult trades={original.trades ?? []} />
          </div>
        ),
      },
      {
        id: 'simulations',
        enableSorting: false,
        header: 'Simulations',
        cell: ({ row: { original } }) => (
          <div>
            <Button asChild variant="link" className="-ml-2">
              <Link
                to={getAppRoute('/app/simulation/room/:roomId/list', {
                  roomId: original.id,
                })}
              >
                Executions <ArrowRightIcon className="w-4" />
              </Link>
            </Button>
          </div>
        ),
      },
      {
        accessorKey: 'id',
        header: () => (
          <Button asChild size="icon" variant="link">
            <Link to={getAppRoute('/app/simulation/create')}>
              <PlusCircleIcon className="w-4" />
            </Link>
          </Button>
        ),
        cell: ({ row: { original } }) => (
          <ItemActions item={{ id: original.id, name: original.name }} />
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

export function SimulationRoomListPage() {
  return (
    <PageLayout title="Simulation Rooms">
      <div>
        <Suspense>
          <ListData />
        </Suspense>
      </div>
    </PageLayout>
  );
}
