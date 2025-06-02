import { Button } from '@baron/ui/components/button';
import { TrashIcon } from 'lucide-react';
import { VPCType } from '../types';

export function VolumeProfileItem(
  props: VPCType & {
    onDelete?: (id: string) => void;
  },
) {
  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted border-b text-sm">
      <div className="text-base">
        <p>{props.name}</p>
        <p className="text-xs text-muted-foreground">{props.id}</p>
      </div>
      <div>
        <p>
          {props.timeframeAmount} {props.timeframeUnit}
        </p>
        <p>Price range {props.maxDeviationPercent}%</p>
        <p>{props.historicalTimeToConsiderAmount} bars</p>
      </div>
      <p>Volume Profile {props.volumeProfilePercentage}%</p>
      {props.onDelete && (
        <Button
          variant="destructive"
          size="icon"
          type="button"
          onClick={() => props.onDelete?.(props.id)}
        >
          <TrashIcon className="w-4" />
        </Button>
      )}
    </div>
  );
}
