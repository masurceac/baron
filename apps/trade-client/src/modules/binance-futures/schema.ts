import { z } from 'zod';

export const binanceTradeRoomFormSchema = z.object({
  name: z.string().min(1),
  tradeRoomId: z.string().min(1),
  leverage: z.number().min(1).max(125),
  positionSizeUsd: z.number().min(1),
  apiSecret: z.string().min(1),
  apiKey: z.string().min(1),
  crazyMode: z.boolean().default(false),
  rememberMe: z.boolean().default(false),
  signalsCount: z.number().min(1).max(10),
  entryPointDelta: z.number().min(0).default(0),
});

export type BinanceTradeRoomFormSchema = z.infer<
  typeof binanceTradeRoomFormSchema
>;
