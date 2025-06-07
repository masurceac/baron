import { TradingPair } from '@baron/common';
import { z } from 'zod';

export const simulationConfigSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  pair: z.nativeEnum(TradingPair),
  aiPrompt: z.string(),
  trailingStop: z.boolean().optional(),
  startDate: z.date(),
  tradesToExecute: z.number().int().optional(),

  vpcIds: z.array(z.string()),
  infoBarIds: z.array(z.string()),
});
