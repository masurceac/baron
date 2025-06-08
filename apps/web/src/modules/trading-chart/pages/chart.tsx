import { ChartExample } from '../components/chart';

export function TradingChartPage() {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-12 w-full items-center justify-between border-b px-4">
        <h1 className="text-lg font-semibold">Trading Chart</h1>
      </div>
      <div className="flex h-full w-full flex-1">
        <ChartExample />
      </div>
    </div>
  );
}
