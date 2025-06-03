import { trpc } from '@/core/trpc';
import { DataTable } from '@/modules/shared';
import { RouterOutput } from '@/trpc/lib';
import { Badge } from '@baron/ui/components/badge';
import { Button } from '@baron/ui/components/button';
import { ColumnDef } from '@tanstack/react-table';
import { TrashIcon } from 'lucide-react';
import { Suspense, useMemo } from 'react';
import { VolumeProfileItem } from './volume-profile-item';

type TableItem = RouterOutput['volumeProfileConfig']['list']['data'][number];

type Props = {
  items: string[];
  onDelete?: (id: string) => void;
};
function VolumeProfileItems(props: Props) {
  const [response] = trpc.volumeProfileConfig.list.useSuspenseQuery({
    skip: 0,
    take: 100,
    ids: props.items,
  });

  const columns = useMemo<ColumnDef<TableItem>[]>(
    () => [
      {
        accessorKey: 'name',
        enableSorting: false,
        header: 'Name',
        cell: ({ row: { original } }) => (
          <div>
            {original.name}
            {original.flag && (
              <>
                <br />
                <Badge className="capitalize">{original.flag}</Badge>
              </>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'timeframeAmount',
        enableSorting: false,
        header: 'Timeframe',
        cell: ({ row: { original } }) =>
          `${original.timeframeAmount} ${original.timeframeUnit}`,
      },
      {
        accessorKey: 'minimumBarsToConsider',
        enableSorting: false,
        header: 'Validity Rule',
        cell: ({ row: { original } }) => (
          <div>
            {`>= ${original.minimumBarsToConsider} bars`}
            <br />
            {` max ${original.maxDeviationPercent}% price change`}
          </div>
        ),
      },
      {
        accessorKey: 'historicalTimeToConsiderAmount',
        enableSorting: false,
        header: 'Historical Data',
        cell: ({ row: { original } }) => (
          <div>
            {`${original.historicalTimeToConsiderAmount} historical bars`}
            <br />
            {`${original.historicalTimeToConsiderAmount * original.timeframeAmount} ${original.timeframeUnit}`}
          </div>
        ),
      },
      {
        accessorKey: 'volumeProfilePercentage',
        enableSorting: false,
        header: 'VP Percentage',
        cell: ({ row: { original } }) => original.volumeProfilePercentage + '%',
      },
      {
        id: 'action',
        enableSorting: false,
        header: () => null,
        cell: ({ row: { original } }) =>
          props.onDelete && (
            <Button
              variant="destructive"
              size="icon"
              type="button"
              className="cursor-pointer"
              onClick={() => props.onDelete?.(original.id)}
            >
              <TrashIcon className="w-4" />
            </Button>
          ),
      },
    ],
    [],
  );

  return <DataTable columns={columns} data={response.data} />;

  if (props.items.length === 0) {
    return (
      <div className="text-muted-foreground p-2 rounded-md border">
        No volume profiles selected
      </div>
    );
  }

  return (
    <div>
      {response.data.map((item) => (
        <VolumeProfileItem {...item} key={item.id} onDelete={props.onDelete} />
      ))}
    </div>
  );
}

export function VolumeProfileList(props: Props) {
  return (
    <Suspense>
      <VolumeProfileItems {...props} />
    </Suspense>
  );
}
