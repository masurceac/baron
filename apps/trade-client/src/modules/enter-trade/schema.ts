import { z } from 'zod';

export const tradeRoomFormSchema = z.object({
  tradeRoomId: z.string().min(1),
  leverage: z.number().min(1).max(125),
  positionSizeUsd: z.number().min(1),
});

export type TradeRoomFormSchema = z.infer<typeof tradeRoomFormSchema>;
