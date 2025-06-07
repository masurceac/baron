import { getDatabase } from '@/database';
import { zoneVolumeProfile } from '@baron/db/schema';
import {
  getFrvpProfiles,
  GetFrvpProfilesInput,
} from '@baron/fixed-range-volume-profile';
import { and, eq } from 'drizzle-orm';

export async function getFrvpProfilesWithDb(input: GetFrvpProfilesInput) {
  const db = getDatabase();
  const profiles = await getFrvpProfiles(input, {
    writeFrvp: async (input) => {
      try {
        await db.insert(zoneVolumeProfile).values({
          volumeAreaHigh: input.zone.VAH,
          volumeAreaLow: input.zone.VAL,
          pointOfControl: input.zone.POC,
          zoneStartAt: input.start,
          zoneEndAt: input.end,
          tradingPair: input.pair,
          timeUnit: input.timeframeUnit,
          timeAmount: input.timeframeAmount,
          maxDeviationPercent: input.maxDeviationPercent,
          minimumBarsToConsider: input.minBarsToConsider,
          volumeProfilePercentage: input.volumePercentageRange,
        });
      } catch (e) {
        console.log(e);
      }
    },
    readFrvp: async (input) => {
      const [exist] = await db
        .select()
        .from(zoneVolumeProfile)
        .where(
          and(
            eq(zoneVolumeProfile.tradingPair, input.pair),
            eq(zoneVolumeProfile.timeUnit, input.timeframeUnit),
            eq(zoneVolumeProfile.timeAmount, input.timeframeAmount),
            eq(zoneVolumeProfile.zoneStartAt, input.start),
            eq(zoneVolumeProfile.zoneEndAt, input.end),
          ),
        );
      if (!exist) {
        return null;
      }
      return {
        VAH: exist.volumeAreaHigh,
        VAL: exist.volumeAreaLow,
        POC: exist.pointOfControl,
      };
    },
  });

  return profiles;
}
