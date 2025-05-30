import { trpc } from '@/core/trpc';
import { Suspense } from 'react';
import { InfoBarItem } from './info-bar-item';

type Props = {
  items: string[];
  onDelete?: (id: string) => void;
};
function InfoBarItems(props: Props) {
  const [response] = trpc.infoBars.list.useSuspenseQuery({
    skip: 0,
    take: 100,
    ids: props.items,
  });
  if (props.items.length === 0) {
    return (
      <div className="text-muted-foreground p-2 rounded-md border">
        No info bars selected
      </div>
    );
  }

  return (
    <div>
      {response.data.map((item) => (
        <InfoBarItem {...item} key={item.id} onDelete={props.onDelete} />
      ))}
    </div>
  );
}

export function InfoBarList(props: Props) {
  return (
    <Suspense>
      <InfoBarItems {...props} />
    </Suspense>
  );
}
