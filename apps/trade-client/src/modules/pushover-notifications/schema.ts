import { z } from 'zod';

export const pushoverTradeRoomFormSchema = z.object({
  name: z.string().min(1),
  tradeRoomId: z.string().min(1),
  user: z.string().min(1),
  token: z.string().min(1),
  rememberMe: z.boolean().default(false),
});

export type PushoverTradeRoomFormSchema = z.infer<
  typeof pushoverTradeRoomFormSchema
>; 