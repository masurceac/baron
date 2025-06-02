import { fetchBars } from '@baron/bars-api';
import {
  BarsStack,
  createBarsStack,
  TimeUnit,
  TradingPair,
  ZoneVolumeProfile,
} from '@baron/common';
import { findLongestSubsets } from '@baron/volume-profile';
import { getFrvpForBuffer } from './get-frvp-for-buffer';

type GetFrvpProfilesInput = {
  start: Date;
  end: Date;
  timeframeAmount: number;
  timeframeUnit: TimeUnit;
  maxDeviationPercent: number;
  minBarsToConsiderConsolidation: number;
  pair: TradingPair;
  volumePercentageRange: number;
  currentPrice: number;
};

type MethodInput = {
  start: Date;
  end: Date;
  pair: TradingPair;
  timeframeAmount: number;
  timeframeUnit: TimeUnit;
  maxDeviationPercent: number;
  minBarsToConsider: number;
  volumePercentageRange: number;
};

export async function getFrvpProfiles(
  input: GetFrvpProfilesInput,
  methods: {
    readFrvp: (input: MethodInput) => Promise<ZoneVolumeProfile | null>;
    writeFrvp: (
      input: MethodInput & { zone: ZoneVolumeProfile },
    ) => Promise<void>;
  },
): Promise<Array<ZoneVolumeProfile>> {
  const consolidationBuffers: Array<BarsStack> = [];

  const bars = await fetchBars({
    start: input.start,
    end: input.end,
    timeframeAmount: input.timeframeAmount,
    timeframeUnit: input.timeframeUnit,
    pair: input.pair,
  });

  const groupedChains = findLongestSubsets(
    bars.map((v, i) => ({ ...v, index: i, value: v.Close })),
    input.maxDeviationPercent,
    input.minBarsToConsiderConsolidation,
  );

  groupedChains.forEach((chain) => {
    const buffer = createBarsStack();
    chain.forEach((item) => {
      buffer.add(item);
    });
    consolidationBuffers.push(buffer);
  });

  const volumeProfilesResult: Array<ZoneVolumeProfile> = [];

  const bufferSizes = consolidationBuffers
    .map((b) => b.length())
    .sort((a, b) => a - b);

  console.log(
    `Processing  ${consolidationBuffers.length} consolidation buffers`,
  );

  const conslidationBuffersToProcess: BarsStack[] = [];
  // find one buffer that includes current price

  const containingCurrentPrice = consolidationBuffers.filter(
    (barsStack) =>
      barsStack.minPrice() <= input.currentPrice &&
      barsStack.maxPrice() >= input.currentPrice,
  );

  // push first buffer that contains current price
  const mostRecentBuffer = containingCurrentPrice.length
    ? containingCurrentPrice.reduce((mostRecent, current) => {
        const currentStart = new Date(current.bars[0]?.Timestamp ?? '');
        const mostRecentStart = new Date(mostRecent.bars[0]?.Timestamp ?? '');
        return currentStart > mostRecentStart ? current : mostRecent;
      }, containingCurrentPrice[0]!)
    : null;

  if (mostRecentBuffer) {
    conslidationBuffersToProcess.push(mostRecentBuffer);
  }
  const higherBuffers = consolidationBuffers
    .filter((barsStack) => barsStack.minPrice() > input.currentPrice)
    // sort ascending by lower price
    .sort((a, b) => a.minPrice() - b.minPrice());

  conslidationBuffersToProcess.push(...higherBuffers.slice(0, 2));

  const lowerBuffers = consolidationBuffers
    .filter((barsStack) => barsStack.maxPrice() < input.currentPrice)
    // sort descending by higher price
    .sort((a, b) => b.maxPrice() - a.maxPrice());

  conslidationBuffersToProcess.push(...lowerBuffers.slice(0, 2));

  for (let i = 0; i < conslidationBuffersToProcess.length; i++) {
    const barsStack = conslidationBuffersToProcess[i]!;
    const stackStart = barsStack.bars.at(0)?.Timestamp ?? '';
    const stackEnd = barsStack.bars.at(-1)?.Timestamp ?? '';
    const alreadyParsed = await methods.readFrvp({
      start: new Date(stackStart),
      end: new Date(stackEnd),
      pair: input.pair,
      timeframeAmount: input.timeframeAmount,
      timeframeUnit: input.timeframeUnit,
      maxDeviationPercent: input.maxDeviationPercent,
      minBarsToConsider: input.minBarsToConsiderConsolidation,
      volumePercentageRange: input.volumePercentageRange,
    });

    if (alreadyParsed) {
      volumeProfilesResult.push(alreadyParsed);
      continue;
    }

    const vp = await getFrvpForBuffer({
      barsStack: barsStack,
      parentIntervalUnit: input.timeframeUnit,
      tradingPair: input.pair,
      vpPercentageRange: input.volumePercentageRange,
    });

    if (vp) {
      // 0-33% - low, 34-66% - medium, 67-100% - high
      const percentage = (barsStack.length() / bufferSizes.at(-1)!) * 100;
      const power =
        percentage < 34 ? 'low' : percentage < 67 ? 'medium' : 'high';
      const volumeProfileResult = {
        ...vp,
        duration: power,
        start: barsStack.bars[0]?.Timestamp ?? '',
        end: barsStack.bars[barsStack.bars.length - 1]?.Timestamp ?? '',
      } as const;
      volumeProfilesResult.push(volumeProfileResult);

      await methods.writeFrvp({
        start: new Date(volumeProfileResult.start),
        end: new Date(volumeProfileResult.end),
        pair: input.pair,
        timeframeAmount: input.timeframeAmount,
        timeframeUnit: input.timeframeUnit,
        maxDeviationPercent: input.maxDeviationPercent,
        minBarsToConsider: input.minBarsToConsiderConsolidation,
        zone: volumeProfileResult,
        volumePercentageRange: input.volumePercentageRange,
      });
    }
  }

  return volumeProfilesResult;
}
