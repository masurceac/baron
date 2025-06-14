import { ChartBar, TimeUnit, TradingPair } from '@baron/common';

export type FetchBarsFunction = {
  (input: {
    start: Date;
    end: Date;
    timeframeAmount: number;
    timeframeUnit: TimeUnit;
    pair: TradingPair;
  }): Promise<ChartBar[]>;
};
