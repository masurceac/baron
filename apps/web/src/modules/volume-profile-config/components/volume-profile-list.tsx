import { trpc } from '@/core/trpc';
import { Suspense } from 'react';
import { VolumeProfileItem } from './volume-profile-item';

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
