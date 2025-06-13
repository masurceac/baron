import { TradingPair } from '@baron/common';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@baron/ui/components/select';

export function TradingPairSelect(props: {
  value: TradingPair;
  onChange: (value: TradingPair) => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <Select
      value={props.value}
      onValueChange={props.onChange}
      disabled={props.disabled}
    >
      <SelectTrigger className={props.className}>
        <SelectValue placeholder="Choose Trading Pair" />
      </SelectTrigger>
      <SelectContent>
        {Object.values(TradingPair).map((pair) => (
          <SelectItem key={pair} value={pair}>
            {pair.replace('USDT', '/USD')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
