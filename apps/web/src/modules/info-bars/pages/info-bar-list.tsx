import { getAppRoute } from '@/core/route';
import { trpc } from '@/core/trpc';
import { DataTable, PageLayout, useCurrentPagination } from '@/modules/shared';
import { SpaPagination } from '@/modules/shared/components/pagination';
import { RouterOutput } from '@baron/server';
import { Button } from '@baron/ui/components/button';
import { FormatDate } from '@baron/ui/components/format-date';
import { ColumnDef } from '@tanstack/react-table';
import { PlusCircleIcon } from 'lucide-react';
import { Suspense, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { InfoBarActions } from '../components/info-bar-actions';

type TableItem = RouterOutput['infoBars']['list']['data'][number];

const TAKE = 10;
function InfoBarsListData() {
  const pagination = useCurrentPagination({ take: TAKE });
  const [infoBarsList] = trpc.infoBars.list.useSuspenseQuery({
    skip: pagination.skip,
    take: TAKE,
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
        accessorKey: 'timeframeAmount',
        enableSorting: false,
        header: 'Timeframe',
        cell: ({ row: { original } }) => (
          <div>
            <p>
              {original.timeframeAmount} {original.timeframeUnit}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'historicalTimeToConsiderAmount',
        enableSorting: false,
        header: 'Historical Data',
        cell: ({ row: { original } }) => (
          <div>
            <p>Up to {original.historicalBarsToConsiderAmount} bars</p>
          </div>
        ),
      },
      {
        accessorKey: 'id',
        header: () => (
          <Button asChild size="icon" variant="link">
            <Link to={getAppRoute('/app/info-bars/create')}>
              <PlusCircleIcon className="w-4" />
            </Link>
          </Button>
        ),
        cell: ({ row: { original } }) => (
          <InfoBarActions infoBar={{ id: original.id, name: original.name }} />
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <DataTable columns={columns} data={infoBarsList.data} />

      {infoBarsList.count ? (
        <SpaPagination
          nextPage={infoBarsList.nextPage ?? { skip: 0, take: TAKE }}
          count={infoBarsList.count ?? 0}
          hasMore={infoBarsList.hasMore ?? false}
          limit={TAKE}
        />
      ) : null}
    </div>
  );
}

export function InfoBarsListPage() {
  return (
    <PageLayout title="Info Bars List">
      <div>
        <Suspense>
          <InfoBarsListData />
        </Suspense>
      </div>
    </PageLayout>
  );
}
