import { add } from 'date-fns';
import { z } from 'zod';
import { TimeUnit } from './enum';
import { assertNever } from './utils';

export const chartBarSchema = z.object({
  Timestamp: z.string(),
  Open: z.number(),
  High: z.number(),
  Low: z.number(),
  Close: z.number(),
  Volume: z.number(),
  VWAP: z.number(),
  TradeCount: z.number(),
});
export type ChartBar = z.infer<typeof chartBarSchema>;

export function createBarsStack() {
  const bars: ChartBar[] = [];

  return {
    bars,
    add(bar: ChartBar) {
      bars.push(bar);
    },
    length() {
      return bars.length;
    },
    maxPrice() {
      return this.bars.reduce((max, bar) => {
        return bar.High > max ? bar.High : max;
      }, 0);
    },
    minPrice() {
      return bars.reduce((min, bar) => {
        return bar.Low < min ? bar.Low : min;
      }, Infinity);
    },
  };
}

export function getBarEnd(date: Date, unit: TimeUnit): Date {
  const start = new Date(date);
  switch (unit) {
    case TimeUnit.Min:
      return add(start, { minutes: 1 });
    case TimeUnit.Hour:
      return add(start, { hours: 1 });
    case TimeUnit.Day:
      return add(start, { days: 1 });
    case TimeUnit.Week:
      return add(start, { weeks: 1 });
    case TimeUnit.Month:
      return add(start, { months: 1 });
    default:
      assertNever(unit);
  }
}

export type BarsStack = ReturnType<typeof createBarsStack>;
