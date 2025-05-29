import { TimeUnit } from '@baron/common';
import { z } from 'zod';

export const volumeProfileConfigSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  timeframeUnit: z.nativeEnum(TimeUnit),
  timeframeAmount: z
    .number()
    .int()
    .min(1, 'Timeframe amount must be at least 1'),
  maxDeviationPercent: z
    .number()
    .min(0, 'Max deviation percent must be at least 0'),
  minimumBarsToConsider: z
    .number()
    .int()
    .min(1, 'Minimum bars to consider must be at least 1'),
  historicalTimeToConsiderAmount: z
    .number()
    .int()
    .min(1, 'Historical time to consider amount must be at least 1'),
});
