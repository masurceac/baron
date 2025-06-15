'use server';

import { fetchBars } from '@baron/bars-api';
import { TimeUnit, TradingPair } from '@baron/common';
import {
  cancelOrder,
  getFuturesOpenOrder,
  getFuturesPosition,
  openMarketFuturesOrderWithTPSL,
  setLeverage,
} from '@baron/order-api';
import { TradeClientServerWebsocketEvents } from '@baron/ws/trade-client-ws';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { add, sub } from 'date-fns';
import { TradeRoomFormSchema } from '../schema';

async function getActiveOrder(props: {
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
  setup: TradeRoomFormSchema,
): Promise<boolean> {
  const ctx = getCloudflareContext();
  const orderActive = await getActiveOrder({
    pair: data.trade.pair,
    apiKey: ctx.env.BINANCE_API_KEY,
    apiSecret: ctx.env.BINANCE_API_SECRET,
  });

  if (orderActive) {
    return false;
  }

  const currentPrice = await getCurrentPrice({
    pair: data.trade.pair,
  });

  try {
    await setLeverage({
      pair: data.trade.pair,
      leverage: setup.leverage,
      keys: {
        apiKey: ctx.env.BINANCE_API_KEY,
        apiSecret: ctx.env.BINANCE_API_SECRET,
      },
    });
    const quantity =
      Math.trunc(
        ((setup.positionSizeUsd * setup.leverage) / currentPrice) * 1000,
      ) / 1000;
    const order = await openMarketFuturesOrderWithTPSL({
      pair: data.trade.pair,
      quantity: quantity,
      direction: data.trade.type,
      stopLossPrice: data.trade.stopLossPrice,
      takeProfitPrice: data.trade.takeProfitPrice,
      keys: {
        apiKey: ctx.env.BINANCE_API_KEY,
        apiSecret: ctx.env.BINANCE_API_SECRET,
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
