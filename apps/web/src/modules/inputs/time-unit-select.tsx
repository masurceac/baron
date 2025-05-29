import { TimeUnit } from '@baron/common';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@baron/ui/components/select';

export function TimeUnitSelect(props: {
  value: TimeUnit;
  onChange: (value: TimeUnit) => void;
  className?: string;
}) {
  return (
    <Select value={props.value} onValueChange={props.onChange}>
      <SelectTrigger className={props.className}>
        <SelectValue placeholder="Choose Time Unit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={TimeUnit.Min}>Minute</SelectItem>
        <SelectItem value={TimeUnit.Hour}>Hour</SelectItem>
        <SelectItem value={TimeUnit.Day}>Day</SelectItem>
        <SelectItem value={TimeUnit.Week}>Week</SelectItem>
        <SelectItem value={TimeUnit.Month}>Month</SelectItem>
      </SelectContent>
    </Select>
  );
}
