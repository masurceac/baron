import { Badge } from '@baron/ui/components/badge';

export function TradeResult(props: {
  trades: Array<{ balanceResult: number }>;
}) {
  const result = props.trades.reduce(
    (acc, trade) => acc + trade.balanceResult,
    0,
  );
  const positiveTrades = props.trades.filter(
    (trade) => trade.balanceResult >= 0,
  ).length;
  const negativeTrades = props.trades.filter(
    (trade) => trade.balanceResult < 0,
  ).length;

  const positiveBalance = props.trades
    .filter((trade) => trade.balanceResult > 0)
    .reduce((acc, trade) => acc + trade.balanceResult, 0);
  const negativeBalance = props.trades
    .filter((trade) => trade.balanceResult < 0)
    .reduce((acc, trade) => acc + trade.balanceResult, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-4">
        <Badge variant="green">{positiveTrades} positive trades</Badge>
        <span className="text-sm font-medium">
          {positiveTrades + negativeTrades} total
        </span>
        <Badge variant="destructive">{negativeTrades} negative trades</Badge>
      </div>
      <div className="flex items-center space-x-4">
        <Badge variant="green">+${positiveBalance.toFixed(2)} earned</Badge>
        <span className="font-semibold">${result.toFixed(2)}</span>
        <Badge variant="destructive">${negativeBalance.toFixed(2)} lost</Badge>
      </div>
    </div>
  );
}
