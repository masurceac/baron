import _ from 'lodash';

export function chunkArray<T>(array: T[], n: number): Array<Array<T>> {
  return _.chunk(array, n);
}

export function assertNever(x: never): never {
  throw new Error('Unexpected value: ' + JSON.stringify(x));
}

export function measure(log: string) {
  const start = Date.now();
  return () => {
    const end = Date.now();
    console.log(`${log} took ${end - start}ms`);
  };
}
