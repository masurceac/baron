import { ChartBar, TimeUnit } from '@baron/common';
import { FetchBarsFunction } from './types';

// https://polygon.io/docs/rest/forex/aggregates/custom-bars
function convertToPolygonFormat(unit: TimeUnit): string {
  switch (unit) {
    case TimeUnit.Min:
      return 'minute';
    case TimeUnit.Hour:
      return 'hour';
    case TimeUnit.Day:
      return 'day';
    case TimeUnit.Week:
      return 'week';
    case TimeUnit.Month:
      return 'month';
    default:
      throw new Error(`Unsupported timeframe unit: ${unit}`);
  }
}

export const fetchPolygonBars: FetchBarsFunction = async (
  input,
): Promise<ChartBar[]> => {
  const unit = convertToPolygonFormat(input.timeframeUnit);
  const startTime = input.start.getTime();
  const endTime = input.end.getTime();

  if (isNaN(startTime) || isNaN(endTime)) {
    throw new Error('Invalid start or end date');
  }

  const bars: ChartBar[] = [];
  const limit = 10_000;
  let currentTime = startTime;
  const headers = new Headers();
  headers.set('Authorization', `Bearer ${input.polygon.keyId}`);

  while (currentTime < endTime) {
    const start = currentTime;
    const end = endTime;

    try {
      const response = await fetch(
        `https://api.polygon.io/v2/aggs/ticker/C:${input.pair}/range/${input.timeframeAmount}/${unit}/${start}/${end}?limit=${limit}`,
        {
          headers,
        },
      );
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.statusText}`);
      }
      const data: {
        results: any[];
      } = await response.json();

      if (!data.results?.length) {
        break; // No more data
      }
      if (!Array.isArray(data.results)) {
        console.error('Unexpected data format:');
        console.error(data);
        throw new Error('Unexpected data format from Binance API');
      }

      const newBars = data.results.map((line) => {
        const Volume = parseFloat(line.v);
        const TradeCount = parseInt(line.n, 10);
        const quoteAssetVolume = parseFloat(line.vw); // 24.85074442

        return {
          Timestamp: new Date(line.t).toISOString(),
          Open: parseFloat(line.o),
          High: parseFloat(line.h),
          Low: parseFloat(line.l),
          Close: parseFloat(line.c),
          Volume,
          TradeCount: TradeCount,
          VWAP: quoteAssetVolume / Volume,
        } satisfies ChartBar;
      });

      if (
        newBars.length === 1 &&
        Math.abs(new Date(newBars.at(0)!.Timestamp).getTime() - currentTime) <
          1000
      ) {
        break;
      } else {
        bars.push(...newBars);

        currentTime = new Date(newBars.at(-1)!.Timestamp).getTime() + 1;
      }
    } catch (error: any) {
      console.log(error);
      console.log(error.message);
      throw new Error(`[Polygon] Failed to fetch bars: ${error}`);
    }
  }

  if (bars.length === 0) {
    throw new Error(`[Polygon] No bars found for pair ${input.pair}`);
  }

  return bars;
};
