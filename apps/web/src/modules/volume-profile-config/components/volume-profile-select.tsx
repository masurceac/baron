import { trpc } from '@/core/trpc';
import { RadioSelect } from '@/modules/shared/components/radio-select';
import { Suspense } from 'react';
import { VolumeProfileItem } from './volume-profile-item';

type Props = {
  value: string;
  onChange: (value: string) => void;
};
function VolumeProfileItems(props: Props) {
  const [response] = trpc.volumeProfileConfig.list.useSuspenseQuery({
    skip: 0,
    take: 100,
  });

  return (
    <div className="w-full">
      <RadioSelect
        items={response.data}
        value={props.value}
        onChange={props.onChange}
        renderItem={(item) => <VolumeProfileItem {...item} />}
      />
    </div>
  );
}

export function VolumeProfileSelect(props: Props) {
  return (
    <Suspense>
      <VolumeProfileItems value={props.value} onChange={props.onChange} />
    </Suspense>
  );
}
