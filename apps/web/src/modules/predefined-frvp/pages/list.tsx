import { getAppRoute } from '@/core/route';
import { trpc } from '@/core/trpc';
import { DataTable } from '@baron/ui/components/data-table';
import { PageLayout, useCurrentPagination } from '@/modules/shared';
import { SpaPagination } from '@/modules/shared/components/pagination';
import { RouterOutput } from '@baron/server';
import { Button } from '@baron/ui/components/button';
import { FormatDate } from '@baron/ui/components/format-date';
import { ColumnDef } from '@tanstack/react-table';
import { PencilIcon, PlusCircleIcon } from 'lucide-react';
import { Suspense, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ItemActions } from '../components/item-actions';

type TableItem = RouterOutput['frvp']['list']['data'][number];

const TAKE = 10;

function ListData() {
  const pagination = useCurrentPagination({ take: TAKE });
  const [list] = trpc.frvp.list.useSuspenseQuery({
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
            <p>{original.name}</p>
          </div>
        ),
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
        accessorKey: 'lastDate',
        enableSorting: false,
        header: 'Last Date',
        cell: ({ row: { original } }) => (
          <div>
            <FormatDate date={original.lastDate} utc />
          </div>
        ),
      },
      {
        id: 'details',
        enableSorting: false,
        header: 'Edit',
        cell: ({ row: { original } }) => (
          <div>
            <Button asChild size="icon" variant="link">
              <Link
                to={getAppRoute('/app/frvp/edit/:frvpId', {
                  frvpId: original.id,
                })}
              >
                <PencilIcon className="w-4 mr-2" />
                Edit
              </Link>
            </Button>
          </div>
        ),
      },
      {
        accessorKey: 'id',
        header: () => (
          <Button asChild size="icon" variant="link">
            <Link to={getAppRoute('/app/frvp/create')}>
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

export function FRVPListPage() {
  return (
    <PageLayout title="FRVPs">
      <div>
        <Suspense>
          <ListData />
        </Suspense>
      </div>
    </PageLayout>
  );
}
