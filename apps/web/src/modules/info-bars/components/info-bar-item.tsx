import { Button } from '@baron/ui/components/button';
import { TrashIcon } from 'lucide-react';
import { InfoBarType } from '../types';

export function InfoBarItem(
  props: Pick<
    InfoBarType,
    | 'id'
    | 'name'
    | 'historicalBarsToConsiderAmount'
    | 'timeframeAmount'
    | 'timeframeUnit'
  > & {
    onDelete?: (id: string) => void;
  },
) {
  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted border-b text-sm">
      <div className="text-base">
        <p>{props.name}</p>
        <p className="text-xs text-muted-foreground">{props.id}</p>
      </div>
      <p>
        {props.timeframeAmount} {props.timeframeUnit}
      </p>
      <p>Data from {props.historicalBarsToConsiderAmount} bars</p>
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
