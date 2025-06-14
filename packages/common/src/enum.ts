export enum TimeUnit {
  Min = 'min',
  Hour = 'hour',
  Day = 'day',
  Week = 'week',
  Month = 'month',
}

export enum TradingPair {
  BTCUSDT = 'BTCUSDT',
  ETHUSDT = 'ETHUSDT',
  SOLUSDT = 'SOLUSDT',
  XRPUSDT = 'XRPUSDT',
  LINKUSDT = 'LINKUSDT',
  ATOMUSDT = 'ATOMUSDT',
  AAVEUSDT = 'AAVEUSDT',
  ARBUSDT = 'ARBUSDT',
}

export enum TradingTimeSetups {
  Min1 = '1min',
  Min5 = '5min',
  Min15 = '15min',
  Min30 = '30min',
  Hour1 = '1hour',
  Hour2 = '2hour',
  Hour4 = '4hour',
  Hour6 = '6hour',
  Hour12 = '12hour',
  Day1 = '1day',
  Day2 = '2day',
  Day3 = '3day',
  Day7 = '7day',
  Week1 = '1week',
  Month1 = '1month',
}

export enum TradeDirection {
  Buy = 'buy',
  Sell = 'sell',
}

export enum TradeLogDirection {
  Buy = 'buy',
  Sell = 'sell',
  Hold = 'hold',
}

export enum SortDirectionEnum {
  Asc = 'asc',
  Desc = 'desc',
}

export enum TradeResult {
  Success = 'success',
  Failure = 'failure',
  Unknown = 'unknown',
}

export enum EntityFlagEnum {
  Deafult = 'default',
}

export enum TradingPlatform {
  Binance = 'binance',
  Coinbase = 'coinbase',
}

export enum SimulationExecutionStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  LimitReached = 'limit_reached',
  Canceled = 'canceled',
}
