'use server';

import { fetchBars } from '@baron/bars-api';
import { TimeUnit, TradeDirection, TradingPair } from '@baron/common';
import {
  cancelOrder,
  getFuturesOpenOrder,
  getFuturesPosition,
  openLimitFuturesOrderWithTPSL,
  setLeverage,
} from '@baron/order-api';
import { TradeClientServerWebsocketEvents } from '@baron/ws/trade-client-ws';
import { add, sub } from 'date-fns';
import { BinanceTradeRoomFormSchema } from '../schema';

export async function hasActiveOrder(props: {
  pair: TradingPair;
  apiKey: string;
  apiSecret: string;
}) {
  const position = await getFuturesPosition({
    pair: props.pair,
    keys: {
      apiKey: props.apiKey,
      apiSecret: props.apiSecret,
    },
  });

  if (position) {
    return true;
  }

  const order = await getFuturesOpenOrder({
    pair: props.pair,
    keys: {
      apiKey: props.apiKey,
      apiSecret: props.apiSecret,
    },
  });
  // if (order) {
  //   console.log('order');
  //   console.log(order);
  //   return true;
  // }

  if (order) {
    await cancelOrder({
      pair: props.pair,
      clientOrderId: order.clientOrderId,
      keys: {
        apiKey: props.apiKey,
        apiSecret: props.apiSecret,
      },
    });
  }

  return false;
}

async function getCurrentPrice(props: { pair: TradingPair }) {
  const executionTime = new Date();
  const result = await fetchBars({
    start: sub(executionTime, {
      minutes: 5,
    }),
    end: add(executionTime, { minutes: 5 }),
    timeframeAmount: 1,
    timeframeUnit: TimeUnit.Min,
    pair: props.pair,
    alpaca: {
      keyId: process.env.ALPACA_KEY_ID!,
      secretKey: process.env.ALPACA_SECRET_KEY!,
    },
  });

  if (!result?.length) {
    throw new Error(
      `No bars found for ${props.pair} at ${executionTime.toISOString()}`,
    );
  }

  const entryPrice = result[result.length - 1]?.Close ?? 0;
  return entryPrice;
}

export async function enterTrade(
  data: TradeClientServerWebsocketEvents['enterTrade'],
  setup: BinanceTradeRoomFormSchema,
): Promise<boolean> {
  const orderActive = await hasActiveOrder({
    pair: data.trade.pair,
    apiKey: setup.apiKey,
    apiSecret: setup.apiSecret,
  });

  if (orderActive) {
    return false;
  }

  const currentPrice = await getCurrentPrice({
    pair: data.trade.pair,
  });

  const direction = setup.crazyMode
    ? data.trade.type === TradeDirection.Buy
      ? TradeDirection.Sell
      : TradeDirection.Buy
    : data.trade.type;

  const stopLossPrice = setup.crazyMode
    ? data.trade.takeProfitPrice
    : data.trade.stopLossPrice;
  const takeProfitPrice = setup.crazyMode
    ? data.trade.stopLossPrice
    : data.trade.takeProfitPrice;

  // Apply entry point delta
  let adjustedEntryPrice = currentPrice;
  let adjustedStopLossPrice = stopLossPrice;

  if (setup.entryPointDelta > 0) {
    const priceDifference = Math.abs(currentPrice - stopLossPrice);
    const deltaAmount = (priceDifference * setup.entryPointDelta) / 100;

    if (direction === TradeDirection.Buy) {
      // For buy trades: move entry down, stop loss down
      adjustedEntryPrice = currentPrice - deltaAmount;
      adjustedStopLossPrice = stopLossPrice - deltaAmount;
    } else {
      // For sell trades: move entry up, stop loss up
      adjustedEntryPrice = currentPrice + deltaAmount;
      adjustedStopLossPrice = stopLossPrice + deltaAmount;
    }
  }

  try {
    await setLeverage({
      pair: data.trade.pair,
      leverage: setup.leverage,
      keys: {
        apiKey: setup.apiKey,
        apiSecret: setup.apiSecret,
      },
    });
    const quantity =
      Math.trunc(
        ((setup.positionSizeUsd * setup.leverage) / currentPrice) * 1000,
      ) / 1000;
    const order = await openLimitFuturesOrderWithTPSL({
      pair: data.trade.pair,
      quantity: quantity,
      limitPrice: adjustedEntryPrice,
      direction,
      stopLossPrice: adjustedStopLossPrice,
      takeProfitPrice: takeProfitPrice,
      keys: {
        apiKey: setup.apiKey,
        apiSecret: setup.apiSecret,
      },
    });
    console.log('order');
    console.log(order);
    return true;
  } catch (error) {
    console.error('Unable to place order');
    console.error(error);
    return false;
  }
}
