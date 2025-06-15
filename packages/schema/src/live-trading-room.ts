import { TradingPair } from '@baron/common';
import { z } from 'zod';
import {
  AiModelPriceStrategyEnum,
  AiModelStrategyEnum,
  aiModelSchema,
} from './ai';

export const liveTradingRoomSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  pair: z.nativeEnum(TradingPair),
  aiPrompt: z.string(),

  aiModels: z.array(aiModelSchema).min(1),
  aiModelStrategy: z.nativeEnum(AiModelStrategyEnum).optional(),
  aiModelPriceStrategy: z.nativeEnum(AiModelPriceStrategyEnum).optional(),

  predefinedFrvpId: z.string(),
  infoBarIds: z.array(z.string()),
});
