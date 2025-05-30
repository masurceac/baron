import { TimeUnit } from '@baron/common';
import { z } from 'zod';

export const inforBarSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  timeframeUnit: z.nativeEnum(TimeUnit),
  timeframeAmount: z
    .number()
    .int()
    .min(1, 'Timeframe amount must be at least 1'),

  historicalBarsToConsiderAmount: z
    .number()
    .int()
    .min(1, 'Historical bars to consider amount must be at least 1'),
});
