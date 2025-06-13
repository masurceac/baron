import { add, sub } from 'date-fns';
import _ from 'lodash';
import { TimeUnit } from './enum';

export function chunkArray<T>(array: T[], n: number): Array<Array<T>> {
  return _.chunk(array, n);
}

export function assertNever(x: never): never {
  throw new Error('Unexpected value: ' + JSON.stringify(x));
}

export function measure(log: string) {
  const start = Date.now();
  console.log(`🟩 START: ${log}`);
  return () => {
    const end = Date.now();
    console.log(`🟥 STOP ${Math.trunc((end - start) / 1000)}s: ${log}`);

    return Math.trunc((end - start) / 1000);
  };
}

export const subtractTimeUnits = (date: Date, unit: TimeUnit, bars: number) => {
  switch (unit) {
    case TimeUnit.Min:
      return sub(date, {
        minutes: bars,
      });
    case TimeUnit.Hour:
      return sub(date, {
        hours: bars,
      });
    case TimeUnit.Day:
      return sub(date, {
        days: bars,
      });
    case TimeUnit.Week:
      return sub(date, {
        days: bars,
      });
    case TimeUnit.Month:
      return sub(date, {
        days: bars,
      });
    default:
      assertNever(unit);
  }
};

export const addTimeUnits = (date: Date, unit: TimeUnit, bars: number) => {
  switch (unit) {
    case TimeUnit.Min:
      return add(date, {
        minutes: bars,
      });
    case TimeUnit.Hour:
      return add(date, {
        hours: bars,
      });
    case TimeUnit.Day:
      return add(date, {
        days: bars,
      });
    case TimeUnit.Week:
      return add(date, {
        days: bars,
      });
    case TimeUnit.Month:
      return add(date, {
        days: bars,
      });
    default:
      assertNever(unit);
  }
};
