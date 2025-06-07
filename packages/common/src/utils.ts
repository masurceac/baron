import _ from 'lodash';

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
  };
}
