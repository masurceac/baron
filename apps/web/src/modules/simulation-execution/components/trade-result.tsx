import { cn } from '@baron/ui/lib/utils';

export function TradeResult(props: {
  trades: Array<{ balanceResult: number }>;
}) {
  const result = props.trades.reduce(
    (acc, trade) => acc + trade.balanceResult,
    0,
  );
  return (
    <div className="flex items-center space-x-2">
      <p>{props.trades.length} trades</p>
      <span>/</span>
      <p className={cn(result < 0 ? 'text-red-500' : 'text-green-500')}>
        {result > 0 ? '+' : ''}
        {result.toFixed(2)}$
      </p>
    </div>
  );
}
