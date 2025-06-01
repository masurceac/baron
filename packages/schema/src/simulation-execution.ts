import { TradingPair } from '@baron/common';
import { z } from 'zod';

export const simulationSetupSchema = z.object({
  tradingPair: z.nativeEnum(TradingPair),
  aiPrompt: z.string(),
  systemPrompt: z.string(),
  trailingStop: z.boolean().optional(),
  simulationRoomId: z.string(),
  vpcIds: z.array(z.string()),
  infoBarIds: z.array(z.string()),
});
