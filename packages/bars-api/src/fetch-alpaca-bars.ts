import { BARS_API_URL, ChartBar, TimeUnit } from '@baron/common';
import { FetchBarsFunction } from './types';

// https://docs.alpaca.markets/reference/cryptobars-1

const timeUnitMap: Record<TimeUnit, string> = {
  [TimeUnit.Min]: 'Min',
  [TimeUnit.Hour]: 'Hour',
  [TimeUnit.Day]: 'Day',
  [TimeUnit.Week]: 'Week',
  [TimeUnit.Month]: 'Month',
};

interface AlpacaBar {
  t: string; // timestamp
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
  vw: number; // volume weighted average price
  n: number; // trade count
}

interface AlpacaBarsResponse {
  bars: Record<string, AlpacaBar[]>;
  symbol: string;
  next_page_token?: string;
}

export const fetchAlpacaBars: FetchBarsFunction = async (
  input,
): Promise<ChartBar[]> => {
  const timeframe = `${input.timeframeAmount}${timeUnitMap[input.timeframeUnit]}`;

  const params = new URLSearchParams({
    symbols: input.pair,
    timeframe,
    start: input.start.toISOString(),
    end: input.end.toISOString(),
    limit: '10000',
  });

  const response = await fetch(
    `${BARS_API_URL}/alpaca/v2/stocks/bars?${params}`,
    {
      method: 'GET',
      headers: {
        'apca-api-key-id': input.alpaca.keyId,
        'apca-api-secret-key': input.alpaca.secretKey,
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Alpaca API error: ${response.status} ${response.statusText}`,
    );
  }

  const data: AlpacaBarsResponse = await response.json();
  const barsData = data.bars[input.pair];
  // console.log(data)

  if (!barsData || barsData.length === 0) {
    throw new Error(`No bars found for pair ${input.pair}`);
  }

  return barsData.map((bar) => ({
    Timestamp: bar.t,
    Open: bar.o,
    High: bar.h,
    Low: bar.l,
    Close: bar.c,
    Volume: bar.v,
    VWAP: bar.vw,
    TradeCount: bar.n,
  }));
};

// export async function testFetchAlpacaBars() {
//   const start = new Date('2024-06-03T00:00:00Z');
//   const end = new Date('2024-06-08T00:00:00Z');

//   try {
//     const bars = await fetchAlpacaBars({
//       start,
//       end,
//       timeframeAmount: 1,
//       timeframeUnit: TimeUnit.Day,
//       pair: TradingPair.SPY,
//       alpaca: {
//         keyId: 'PKEEB1603195O3M8D1SX',
//         secretKey: 'GzhRLDsTHdtKD7q0ciKZY7IWQmEdOgwtzaQrija9',
//       },
//     });

//     console.log('Test successful! Fetched bars:', bars.length);
//     console.log('First bar:', bars[0]);
//     console.log('Last bar:', bars[bars.length - 1]);

//     return bars;
//   } catch (error) {
//     console.error('Test failed:', error);
//     throw error;
//   }
// }

// testFetchAlpacaBars();
