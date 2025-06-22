import Alpaca from '@alpacahq/alpaca-trade-api';
import {
  CryptoBar,
  TimeFrameUnit,
} from '@alpacahq/alpaca-trade-api/dist/resources/datav2/entityv2';
import { TimeUnit } from '@baron/common';
import { FetchBarsFunction } from './types';

// https://docs.alpaca.markets/reference/cryptobars-1

const timeUnitMap: Record<TimeUnit, TimeFrameUnit> = {
  [TimeUnit.Min]: TimeFrameUnit.MIN,
  [TimeUnit.Hour]: TimeFrameUnit.HOUR,
  [TimeUnit.Day]: TimeFrameUnit.DAY,
  [TimeUnit.Week]: TimeFrameUnit.WEEK,
  [TimeUnit.Month]: TimeFrameUnit.MONTH,
};

export const fetchAlpacaBars: FetchBarsFunction = async (
  input,
): Promise<CryptoBar[]> => {
  const alpaca = new Alpaca({
    keyId: input.alpaca.keyId,
    secretKey: input.alpaca.secretKey,
    paper: true,
  });

  const r = await alpaca.getMultiBarsV2([input.pair], {
    start: input.start,
    end: input.end,
    timeframe: alpaca.newTimeframe(
      input.timeframeAmount,
      timeUnitMap[input.timeframeUnit],
    ),
    limit: 10000,
  });

  const bars = r.get(input.pair);
  if (!bars) {
    throw new Error(`No bars found for pair ${input.pair}`);
  }
  return bars.map((bar) => ({
    VWAP: bar.VWAP,
    TradeCount: bar.TradeCount,
    Open: bar.OpenPrice,
    High: bar.HighPrice,
    Low: bar.LowPrice,
    Close: bar.ClosePrice,
    Volume: bar.Volume,
    Timestamp: bar.Timestamp,
  }));
};
