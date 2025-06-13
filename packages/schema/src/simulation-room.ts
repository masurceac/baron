import { z } from 'zod';
import { TimeUnit, TradingPair } from '@baron/common';
import { aiModelSchema } from './ai';

export const simulationRoomSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  pair: z.nativeEnum(TradingPair),
  aiPrompt: z.string(),
  startDate: z.date(),
  maxTradesToExecute: z.number().int().optional(),

  aiModels: z.array(aiModelSchema).min(1),
  predefinedFrvpId: z.string(),
  infoBarIds: z.array(z.string()),

  bulkExecutionsCount: z.number().int().optional(),
  bulkExecutionsIntervalUnits: z.nativeEnum(TimeUnit).optional(),
  bulkExecutionsIntervalAmount: z.number().int().optional(),
});
