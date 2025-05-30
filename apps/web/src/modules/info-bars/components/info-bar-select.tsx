import { trpc } from '@/core/trpc';
import { RadioSelect } from '@/modules/shared/components/radio-select';
import { Suspense } from 'react';
import { InfoBarItem } from './info-bar-item';

type Props = {
  value: string;
  onChange: (value: string) => void;
};
function InfoBarLists(props: Props) {
  const [response] = trpc.infoBars.list.useSuspenseQuery({
    skip: 0,
    take: 100,
  });

  return (
    <div className="w-full">
      <RadioSelect
        items={response.data}
        value={props.value}
        onChange={props.onChange}
        renderItem={(item) => <InfoBarItem {...item} />}
      />
    </div>
  );
}

export function InfoBarSelect(props: Props) {
  return (
    <Suspense>
      <InfoBarLists value={props.value} onChange={props.onChange} />
    </Suspense>
  );
}
