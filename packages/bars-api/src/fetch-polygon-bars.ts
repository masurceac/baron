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
  const limit = 10_000; // Binance max limit per request
  let currentTime = startTime;
  const headers = new Headers();
  headers.set('Authorization', `Bearer ${input.polygon.keyId}`);

  while (currentTime < endTime) {
    const start = currentTime;
    const end = Math.min(currentTime + limit * 1000 * 60 * 60 * 24, endTime);

    try {
      const response = await fetch(
        `https://api.polygon.io/v2/aggs/ticker/C:${input.pair}/range/${input.timeframeAmount}/${unit}/${start}/${end}`,
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

      bars.push(...newBars);

      // Update currentTime to the last kline's close time + 1ms
      currentTime = data.results[data.results.length - 1]!.t + 1;
    } catch (error: any) {
      console.log(error);
      console.log(error.message);
      throw new Error(`Failed to fetch bars: ${error}`);
    }
  }

  if (bars.length === 0) {
    throw new Error(`No bars found for pair ${input.pair}`);
  }

  return bars;
};
