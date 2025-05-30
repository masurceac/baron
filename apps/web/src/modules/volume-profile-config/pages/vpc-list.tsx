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
import { VPCActions } from '../components/vpc-actions';

type TableItem = RouterOutput['volumeProfileConfig']['list']['data'][number];

const TAKE = 10;
function VPCListData() {
  const pagination = useCurrentPagination({ take: TAKE });
  const [vpcList] = trpc.volumeProfileConfig.list.useSuspenseQuery({
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
        accessorKey: 'maxDeviationPercent',
        enableSorting: false,
        header: 'Range',
        cell: ({ row: { original } }) => (
          <div className="flex space-x-1">
            <p className="text-secondary-foreground">
              {original.maxDeviationPercent}%
            </p>
            <p>/&nbsp;{original.minimumBarsToConsider} bars</p>
          </div>
        ),
      },
      {
        accessorKey: 'historicalTimeToConsiderAmount',
        enableSorting: false,
        header: 'Historical Data',
        cell: ({ row: { original } }) => (
          <div>
            <p>Up to {original.historicalTimeToConsiderAmount} bars</p>
          </div>
        ),
      },
      {
        accessorKey: 'volumeProfilePercentage',
        enableSorting: false,
        header: 'VP %',
        cell: ({ row: { original } }) => (
          <p>{original.volumeProfilePercentage}%</p>
        ),
      },
      {
        accessorKey: 'id',
        header: () => (
          <Button asChild size="icon" variant="link">
            <Link to={getAppRoute('/app/volume-profile-config/create')}>
              <PlusCircleIcon className="w-4" />
            </Link>
          </Button>
        ),
        cell: ({ row: { original } }) => (
          <VPCActions vpc={{ id: original.id, name: original.name }} />
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <DataTable columns={columns} data={vpcList.data} />

      {vpcList.count ? (
        <SpaPagination
          nextPage={vpcList.nextPage ?? { skip: 0, take: TAKE }}
          count={vpcList.count ?? 0}
          hasMore={vpcList.hasMore ?? false}
          limit={TAKE}
        />
      ) : null}
    </div>
  );
}

export function VPCList() {
  return (
    <PageLayout title="Volume Profile Config List">
      <div>
        <Suspense>
          <VPCListData />
        </Suspense>
      </div>
    </PageLayout>
  );
}
