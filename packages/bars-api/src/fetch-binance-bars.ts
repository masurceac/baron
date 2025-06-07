import { BARS_API_URL, ChartBar, TimeUnit, TradingPair } from '@baron/common';

function convertToBinanceFormat(amount: number, unit: TimeUnit): string {
  switch (unit) {
    case TimeUnit.Min:
      return `${amount}m`;
    case TimeUnit.Hour:
      return `${amount}h`;
    case TimeUnit.Day:
      return `${amount}d`;
    case TimeUnit.Week:
      return `${amount}w`;
    case TimeUnit.Month:
      return `${amount}M`;
    default:
      throw new Error(`Unsupported timeframe unit: ${unit}`);
  }
}

export async function fetchBinanceBars(input: {
  start: Date;
  end: Date;
  timeframeAmount: number;
  timeframeUnit: TimeUnit;
  pair: TradingPair;
}): Promise<ChartBar[]> {
  const symbol = input.pair;
  const interval = convertToBinanceFormat(
    input.timeframeAmount,
    input.timeframeUnit,
  );
  const startTime = input.start.getTime();
  const endTime = input.end.getTime();

  if (isNaN(startTime) || isNaN(endTime)) {
    throw new Error('Invalid start or end date');
  }

  const baseUrl = `${BARS_API_URL}/binance/api/v3/klines`; // proxy server

  const bars: ChartBar[] = [];
  const limit = 1000; // Binance max limit per request
  let currentTime = startTime;

  while (currentTime < endTime) {
    const params = new URLSearchParams({
      symbol,
      interval,
      startTime: currentTime.toString(),
      endTime: Math.min(
        currentTime + limit * 1000 * 60 * 60 * 24,
        endTime,
      ).toString(), // Cap at endTime
      limit: limit.toString(),
    });

    try {
      const response = await fetch(`${baseUrl}?${params}`);
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.statusText}`);
      }
      const data: any[][] = await response.json();

      if (data.length === 0) {
        break; // No more data
      }

      const newBars = data.map((kline) => {
        const Volume = parseFloat(kline[5]);
        const TradeCount = parseInt(kline[8], 10);
        const quoteAssetVolume = parseFloat(kline[7]); // 24.85074442

        return {
          Timestamp: new Date(kline[0]).toISOString(),
          Open: parseFloat(kline[1]),
          High: parseFloat(kline[2]),
          Low: parseFloat(kline[3]),
          Close: parseFloat(kline[4]),
          Volume,
          TradeCount: TradeCount,
          VWAP: quoteAssetVolume / Volume,
        } satisfies ChartBar;
      });

      bars.push(...newBars);

      // Update currentTime to the last kline's close time + 1ms
      currentTime = data[data.length - 1]![6] + 1;
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
}
