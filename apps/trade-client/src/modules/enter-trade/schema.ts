import { z } from 'zod';

export const binanceTradeRoomFormSchema = z.object({
  name: z.string().min(1),
  tradeRoomId: z.string().min(1),
  leverage: z.number().min(1).max(125),
  positionSizeUsd: z.number().min(1),
  apiSecret: z.string().min(1),
  apiKey: z.string().min(1),
  crazyMode: z.boolean().default(false),
});

export type BinanceTradeRoomFormSchema = z.infer<
  typeof binanceTradeRoomFormSchema
>;
