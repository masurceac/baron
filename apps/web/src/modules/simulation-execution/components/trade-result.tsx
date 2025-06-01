import { RedGreenHighlight } from '@/modules/shared';

export function TradeResult(props: {
  trades: Array<{ balanceResult: number }>;
}) {
  const result = props.trades.reduce(
    (acc, trade) => acc + trade.balanceResult,
    0,
  );
  const positiveTrades = props.trades.filter(
    (trade) => trade.balanceResult > 0,
  ).length;
  const negativeTrades = props.trades.filter(
    (trade) => trade.balanceResult < 0,
  ).length;

  return (
    <div className="flex items-center space-x-2">
      <p>{props.trades.length} trades</p>
      <span>/</span>
      <p>
        <RedGreenHighlight variant={result < 0 ? 'red' : 'green'}>
          {result > 0 ? '+' : ''}
          {result.toFixed(2)}$
        </RedGreenHighlight>
      </p>
      <span>/</span>
      <p>
        <RedGreenHighlight variant="green">{positiveTrades}</RedGreenHighlight>/
        <RedGreenHighlight variant="red">{negativeTrades}</RedGreenHighlight>
      </p>
    </div>
  );
}
