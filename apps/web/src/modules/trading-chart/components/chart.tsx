import { Chart } from 'react-google-charts';
import { zones } from './zones';
import { isBefore } from 'date-fns';
import { fetchBars } from '@baron/bars-api';
import { useEffect, useState } from 'react';
import { TimeUnit, TradingPair } from '@baron/common';

const getStart = () => {
  const result = zones.reduce(
    (acc, zone) =>
      isBefore(new Date(zone.zone_start_at), new Date(acc.zone_start_at))
        ? zone
        : acc,
    zones[0],
  );

  return new Date(result.zone_start_at);
};

export function ChartExample() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const result = await fetchBars({
        start: getStart(),
        end: new Date(),
        pair: TradingPair.ETHUSDT,
        timeframeAmount: 1,
        timeframeUnit: TimeUnit.Hour,
      });

      setData(
        ([['date', 'low', 'second', 'third', 'high']] as any[]).concat(
          result.map((bar) => [
            bar.Timestamp,
            bar.Low,
            bar.Close > bar.Open ? bar.Open : bar.Close,
            bar.Close < bar.Open ? bar.Open : bar.Close,
            bar.High,
          ]),
        ),
      );
    }
    fetchData();
  }, []);

  return (
    <div>
      {!data.length ? null : (
        <Chart
          chartType="CandlestickChart"
          width="100%"
          height="400px"
          data={data}
          options={{
            legend: 'none',
          }}
        />
      )}
    </div>
  );
}
