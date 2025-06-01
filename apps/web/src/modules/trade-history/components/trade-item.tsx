import { RouterOutput } from '@baron/server';
import { FormatDate } from '@baron/ui/components/format-date';

export function TradeItem({
  trade,
}: {
  trade: RouterOutput['tradeHistory']['list'][number];
}) {
  return (
    <div className="p-4 border last:rounded-b-xl first:rounded-t-xl">
      <p>
        Entry on <FormatDate date={trade.entryDate} />
        at ${trade.entryPrice}
      </p>
      <p>
        Exit on <FormatDate date={trade.exitDate} />
        at ${trade.exitPrice}
      </p>
    </div>
  );
}
