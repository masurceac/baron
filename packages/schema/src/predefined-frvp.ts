import { TradingPair } from '@baron/common';
import { z } from 'zod';

export const predefinedFrvpValueSchema = z.object({
  volumeAreaHigh: z.number(),
  volumeAreaLow: z.number(),
  pointOfControl: z.number(),
  zoneStartAt: z.date(),
  zoneEndAt: z.date(),
});

export type PredefinedFrvpValue = z.infer<typeof predefinedFrvpValueSchema>;

export const predefinedFrvpProfileSchema = z.object({
  label: z.string(),
  zones: z.array(predefinedFrvpValueSchema),
});

export type PredefinedFrvpProfile = z.infer<typeof predefinedFrvpProfileSchema>;

export const createPredefinedFrvpSchema = z.object({
  profiles: z.array(predefinedFrvpProfileSchema),
  name: z.string(),
  pair: z.nativeEnum(TradingPair),
  lastDate: z.date(),
});
