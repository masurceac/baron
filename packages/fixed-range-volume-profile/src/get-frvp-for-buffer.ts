import { fetchBars } from '@baron/bars-api';
import {
  assertNever,
  BarsStack,
  ChartBar,
  chunkArray,
  TimeUnit,
  TradingPair,
  ZoneVolumeProfile,
  measure,
} from '@baron/common';
import { calculateVolumeProfile } from '@baron/volume-profile';
import { add } from 'date-fns';

function getEnd(date: Date, unit: TimeUnit): Date {
  const start = new Date(date);
  switch (unit) {
    case TimeUnit.Hour:
      return add(start, { hours: 1 });
    case TimeUnit.Day:
      return add(start, { days: 1 });
    case TimeUnit.Week:
      return add(start, { weeks: 1 });
    case TimeUnit.Month:
      return add(start, { months: 1 });
    case TimeUnit.Min:
      return add(start, { minutes: 1 });
    default:
      assertNever(unit);
  }
}

function getChildIntervalAndAmount(parentIntervalUnit: TimeUnit): {
  childIntervalUnit: TimeUnit;
  childIntervalAmount: number;
  parentsToGroupForFetchingChilds: number;
} {
  switch (parentIntervalUnit) {
    case TimeUnit.Min:
      return {
        childIntervalUnit: TimeUnit.Min,
        childIntervalAmount: 1,
        parentsToGroupForFetchingChilds: 15,
      };
    case TimeUnit.Hour:
      return {
        childIntervalUnit: TimeUnit.Min,
        childIntervalAmount: 1,
        parentsToGroupForFetchingChilds: 5,
      };
    case TimeUnit.Day:
      return {
        childIntervalUnit: TimeUnit.Min,
        childIntervalAmount: 15,
        parentsToGroupForFetchingChilds: 2,
      };
    case TimeUnit.Week:
      return {
        childIntervalUnit: TimeUnit.Hour,
        childIntervalAmount: 6,
        parentsToGroupForFetchingChilds: 1,
      };
    case TimeUnit.Month:
      return {
        childIntervalUnit: TimeUnit.Day,
        childIntervalAmount: 1,
        parentsToGroupForFetchingChilds: 2,
      };
    default:
      assertNever(parentIntervalUnit);
  }
}

export async function getFrvpForBuffer(input: {
  tradingPair: TradingPair;
  barsStack: BarsStack;
  parentIntervalUnit: TimeUnit;
  vpPercentageRange: number;
}): Promise<ZoneVolumeProfile | null> {
  let log: ReturnType<typeof measure> | null = null;

  const childSettings = getChildIntervalAndAmount(input.parentIntervalUnit);
  const bars: ChartBar[][] = [];

  const barsChunks = chunkArray(
    input.barsStack.bars,
    childSettings.parentsToGroupForFetchingChilds,
  ); // group chunks per request

  const parallelChunksArray = chunkArray(barsChunks, 10); // group chunks for requests in parallel
  log = measure('FRVP: fetching bars');
  for (const parallelChunks of parallelChunksArray) {
    await Promise.all(
      parallelChunks.map(async (chunk) => {
        const startTs = chunk[0]?.Timestamp;
        const endTs = chunk.at(-1)?.Timestamp;
        if (!startTs || !endTs) {
          console.warn('Buffer has no valid timestamps', chunk);
          return;
        }
        const end = getEnd(new Date(endTs), input.parentIntervalUnit);
        const barTicks = await fetchBars({
          start: new Date(startTs),
          end: end,
          timeframeAmount: childSettings.childIntervalAmount,
          timeframeUnit: childSettings.childIntervalUnit,
          pair: input.tradingPair,
          alpaca: {
            keyId: '',
            secretKey: '',
          },
        });
        bars.push(barTicks);
      }),
    );
  }
  log();

  log = measure('getFrvpForBuffer - calculateVolumeProfile');
  const result = calculateVolumeProfile(
    bars.flat(),
    0.01,
    input.vpPercentageRange / 100,
  );
  log();

  return result;
}
