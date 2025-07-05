import { fetchBars } from '@baron/bars-api';
import { TimeUnit, TradingPair } from '@baron/common';
import { calculateVolumeProfile } from '@baron/volume-profile';
import { isBefore } from 'date-fns';
import { z } from 'zod';

const tradingViewFRVPPluginPointSchema = z.object({
  time_t: z.number(),
  offset: z.number(),
  price: z.number(),
  interval: z.string(),
});

const tradingViewLayoutDataSchema = z.object({
  state: z.object({
    points: tradingViewFRVPPluginPointSchema.array().optional(),
    type: z
      .enum(['LineToolFixedRangeVolumeProfile', 'LineToolRectangle'])
      .or(z.string()),
    state: z.object({
      interval: z.string(),
    }),
  }),
});

const tradingViewSourceDataSchema = z.record(
  z.string(),
  tradingViewLayoutDataSchema,
);

type TradingViewSourceData = z.infer<typeof tradingViewSourceDataSchema>;

type Config = {
  alpaca: {
    keyId: string;
    secretKey: string;
  };
  polygon: {
    keyId: string;
  };
  pair: TradingPair;
};
async function calculateFrvpForPoints(
  point: z.infer<typeof tradingViewFRVPPluginPointSchema>[],
  config: Config,
) {
  if (!Array.isArray(point)) {
    throw new Error('');
  }
  const [start, end] = point.toSorted((a, b) => a.time_t - b.time_t);

  if (!start || !end) {
    throw new Error('No start or end point');
  }

  const startDate = new Date(start.time_t * 1000);
  const endDate = new Date(end.time_t * 1000);
  const { amount, unit } = getChildAmountForFRVP(point[0]?.interval ?? '');

  const bars = await fetchBars({
    start: startDate,
    end: endDate,
    timeframeAmount: amount,
    timeframeUnit: unit,
    pair: config.pair,
    alpaca: config.alpaca,
    polygon: config.polygon,
  });

  const volumeProfile = calculateVolumeProfile(bars, 0.01, 0.7);

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    ...volumeProfile,
  };
}

type KnownInterval = '5' | '15' | '30' | '60' | '240' | '1D';

function intervalToTimeLabel(interval: string) {
  switch (interval as KnownInterval) {
    case '5':
      return '5 Minutes';
    case '15':
      return '15 Minutes';
    case '30':
      return '30 Minutes';
    case '60':
      return '1 Hour';
    case '240':
      return '4 Hours';
    case '1D':
      return '1 Day';
    default:
      throw new Error(`Unknown interval: ${interval}`);
  }
}

function getChildAmountForFRVP(interval: string): {
  amount: number;
  unit: TimeUnit;
} {
  switch (interval as KnownInterval) {
    case '5':
      return {
        amount: 1,
        unit: TimeUnit.Min,
      };
    case '15':
      return {
        amount: 1,
        unit: TimeUnit.Min,
      };
    case '30':
      return {
        amount: 5,
        unit: TimeUnit.Min,
      };
    case '60':
      return {
        amount: 5,
        unit: TimeUnit.Min,
      };
    case '240':
      return {
        amount: 15,
        unit: TimeUnit.Min,
      };
    case '1D':
      return {
        amount: 60,
        unit: TimeUnit.Min,
      };
  }
}

async function getFrvpProfilesFromData<T extends TradingViewSourceData>(
  data: T,
  config: Config,
) {
  const values = Object.values(data);
  const label = intervalToTimeLabel(
    values[0]?.state.points?.[0]?.interval ?? '',
  );

  const frvpProfiles = values.filter(
    (v) => v.state.type === 'LineToolFixedRangeVolumeProfile',
  );

  const frvpProfilesResult = await Promise.all(
    frvpProfiles.map(async (v) => {
      const zone = await calculateFrvpForPoints(v.state.points ?? [], config);
      return {
        startDate: zone.startDate,
        endDate: zone.endDate,
        VAL: zone.VAL,
        VAH: zone.VAH,
        POC: zone.POC,
      };
    }),
  );

  const profiles = frvpProfilesResult.sort((a, b) => {
    return isBefore(a.startDate, b.startDate) ? -1 : 1;
  });

  return {
    label,
    profiles,
  };
}

export async function getDataFromTradingView(
  getData: () => ReturnType<typeof fetch>,
  config: Config,
) {
  const response = await getData();

  if (!response.ok) {
    console.error(
      'Failed to fetch data:',
      response.status,
      response.statusText,
    );
    return;
  }

  const data = await response.json();

  try {
    const parsed = z
      .object({
        success: z.boolean(),
        payload: z.object({
          sources: tradingViewSourceDataSchema,
        }),
      })
      .parse(data);

    const frvpResult = await getFrvpProfilesFromData(
      parsed.payload.sources,
      config,
    );

    return frvpResult;
  } catch (parseError) {
    console.error('Failed to parse response:', parseError);
    console.error('Raw data:', data);
    throw parseError;
  }
}
