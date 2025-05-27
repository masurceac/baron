import { z } from 'zod';

export const zoneVolumeProfileSchema = z.object({
  VAH: z.number(),
  VAL: z.number(),
  POC: z.number(),
});

export type ZoneVolumeProfile = z.infer<typeof zoneVolumeProfileSchema>;