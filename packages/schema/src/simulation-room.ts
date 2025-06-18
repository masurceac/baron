import { z } from 'zod';
import { TimeUnit, TradingPair } from '@baron/common';
import {
  AiModelPriceStrategyEnum,
  AiModelStrategyEnum,
  aiModelSchema,
} from './ai';

export const simulationRoomSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  pair: z.nativeEnum(TradingPair),
  aiPrompt: z.string(),
  startDate: z.date(),
  maxTradesToExecute: z.number().int().optional(),
  trailingStopLoss: z.boolean().optional(),
  crazyMode: z.boolean().optional(),

  aiModels: z.array(aiModelSchema).min(1),
  aiModelStrategy: z.nativeEnum(AiModelStrategyEnum).optional(),
  aiModelPriceStrategy: z.nativeEnum(AiModelPriceStrategyEnum).optional(),

  predefinedFrvpId: z.string(),
  infoBarIds: z.array(z.string()),

  bulkExecutionsCount: z.number().int().optional(),
  bulkExecutionsIntervalUnits: z.nativeEnum(TimeUnit).optional(),
  bulkExecutionsIntervalAmount: z.number().int().optional(),
});
