import { TradeDirection, TradingPair } from '@baron/common';
import { z } from 'zod';
import { createWebSocketAPI } from '../core';

export const tradeClientWebsockets = createWebSocketAPI({
  server: {
    enterTrade: {
      schema: z.object({
        trade: z.object({
          type: z.nativeEnum(TradeDirection),
          stopLossPrice: z.number(),
          takeProfitPrice: z.number(),
          pair: z.nativeEnum(TradingPair),
        }),
      }),
    },
  },
  client: {
    heartbeat: {
      schema: z.object({
        date: z.string(),
      }),
    },
  },
});

type TradeClientWebSockets = typeof tradeClientWebsockets;
export type TradeClientServerWebsocketEvents = {
  [K in keyof TradeClientWebSockets['server']]: z.infer<
    TradeClientWebSockets['server'][K]['schema']
  >;
};
