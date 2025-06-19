import { getAppRoute } from '@/core/route';
import { trpc } from '@/core/trpc';
import { PageLayout, useCurrentPagination } from '@/modules/shared';
import { SpaPagination } from '@/modules/shared/components/pagination';
import { ExecutionStatus } from '@/modules/simulation-execution/components/execution-status';
import { RouterOutput } from '@baron/server';
import { Button } from '@baron/ui/components/button';
import { DataTable } from '@baron/ui/components/data-table';
import { FormatDate } from '@baron/ui/components/format-date';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@baron/ui/components/tooltip';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowRightIcon, PlusCircleIcon } from 'lucide-react';
import { Suspense, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ItemActions } from '../components/item-actions';

type TableItem = RouterOutput['liveTradingRoom']['list']['data'][number];

const TAKE = 25;

function ListData() {
  const pagination = useCurrentPagination({ take: TAKE });
  const [list] = trpc.liveTradingRoom.list.useSuspenseQuery({
    skip: pagination.skip,
    take: TAKE,
  });

  const columns = useMemo<ColumnDef<TableItem>[]>(
    () => [
      {
        accessorKey: 'name',
        enableSorting: false,
        header: 'Name / Created At',
        cell: ({ row: { original } }) => (
          <div className="flex flex-col space-y-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="max-w-80 truncate">{original.name}</p>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start">
                {original.name}
              </TooltipContent>
            </Tooltip>

            <p className="text-xs text-muted-foreground">
              {original.id} |{' '}
              <FormatDate date={original.createdAt} format="long" />
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'pair',
        enableSorting: false,
        header: 'Pair',
        cell: ({ row: { original } }) => (
          <div>
            <p>{original.pair}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        enableSorting: false,
        header: 'Status',
        cell: ({ row: { original } }) => (
          <div>
            <ExecutionStatus status={original.status} />
          </div>
        ),
      },
      {
        accessorKey: 'id',
        header: () => (
          <Button asChild size="icon" variant="link">
            <Link to={getAppRoute('/app/live-trading/create')}>
              <PlusCircleIcon className="w-4" />
            </Link>
          </Button>
        ),
        cell: ({ row: { original } }) => (
          <Button asChild variant="link" className="-ml-2">
            <Link
              to={getAppRoute('/app/live-trading/view/:liveTradingRoomId', {
                liveTradingRoomId: original.id,
              })}
            >
              View <ArrowRightIcon className="w-4" />
            </Link>
          </Button>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row: { original } }) => <ItemActions item={original} />,
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

export function LiveTradingRoomListPage() {
  return (
    <PageLayout title="Live Trading Rooms">
      <div>
        <Suspense>
          <ListData />
        </Suspense>
      </div>
    </PageLayout>
  );
}
