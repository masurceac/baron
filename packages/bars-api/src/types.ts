import { ChartBar, TimeUnit, TradingPair } from '@baron/common';

export type FetchBarsFunction = {
  (input: {
    start: string;
    end: string;
    timeframeAmount: number;
    timeframeUnit: TimeUnit;
    pair: TradingPair;
  }): Promise<ChartBar[]>;
};
