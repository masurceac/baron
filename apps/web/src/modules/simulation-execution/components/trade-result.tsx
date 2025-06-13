import { Badge } from '@baron/ui/components/badge';
import { cn } from '@baron/ui/lib/utils';

export function TradeCountResult(props: {
  trades: Array<{ balanceResult: number }>;
}) {
  const positiveTrades = props.trades.filter(
    (trade) => trade.balanceResult >= 0,
  ).length;
  const negativeTrades = props.trades.filter(
    (trade) => trade.balanceResult < 0,
  ).length;

  return (
    <div className="flex flex-col gap-1 min-w-40">
      <Badge variant="outline" className="font-semibold text-base w-full">
        {props.trades.length} total
      </Badge>
      <div className="flex gap-2">
        <Badge variant="greenOutline" className="flex-1">
          {positiveTrades} positive
        </Badge>
        <Badge variant="destructiveOutline" className="flex-1">
          {negativeTrades} negative
        </Badge>
      </div>
    </div>
  );
}

export function TradeMoneyResult(props: {
  trades: Array<{ balanceResult: number }>;
}) {
  const result = props.trades.reduce(
    (acc, trade) => acc + trade.balanceResult,
    0,
  );

  const positiveBalance = props.trades
    .filter((trade) => trade.balanceResult > 0)
    .reduce((acc, trade) => acc + trade.balanceResult, 0);
  const negativeBalance = props.trades
    .filter((trade) => trade.balanceResult < 0)
    .reduce((acc, trade) => acc + trade.balanceResult, 0);

  return (
    <div className="flex flex-col gap-1 min-w-40">
      <Badge
        variant="outline"
        className={cn(
          'font-semibold text-base w-full',
          result >= 0 ? 'text-green-700' : 'text-destructive',
        )}
      >
        ${result.toFixed(2)}
      </Badge>
      <div className="flex gap-2">
        <Badge variant="greenOutline" className="flex-1">
          +${positiveBalance.toFixed(2)}
        </Badge>
        <Badge variant="destructiveOutline" className="flex-1">
          ${negativeBalance.toFixed(2)}
        </Badge>
      </div>
    </div>
  );
}
