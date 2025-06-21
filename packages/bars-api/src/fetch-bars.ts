import { assertNever, TradingPair } from '@baron/common';
import { fetchAlpacaBars } from './fetch-alpaca-bars';
import { fetchBinanceBars } from './fetch-binance-bars';
import { FetchBarsFunction } from './types';

export const fetchBars: FetchBarsFunction = (args) => {
  switch (args.pair) {
    case TradingPair.QQQ:
    case TradingPair.SPY:
      return fetchAlpacaBars(args);
    case TradingPair.BTCUSDT:
    case TradingPair.ETHUSDT:
    case TradingPair.SOLUSDT:
    case TradingPair.XRPUSDT:
    case TradingPair.LINKUSDT:
    case TradingPair.ATOMUSDT:
    case TradingPair.AAVEUSDT:
    case TradingPair.ARBUSDT:
      return fetchBinanceBars(args);
    default:
      assertNever(args.pair);
  }
};
