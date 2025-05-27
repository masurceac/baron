type Item = { index: number; value: number };

function createChain(input: { maxDeviationPercent: number }) {
  const items: Item[] = [];

  return {
    items,
    add(i: Item) {
      this.items.push(i);
    },
    canAdd(i: Item): boolean {
      const min = Math.min(...this.items.map((item) => item.value));
      const max = Math.max(...this.items.map((item) => item.value));
      const comparedMin = Math.min(i.value, min);
      const comparedMax = Math.max(i.value, max);

      const priceDeviation = (comparedMax - comparedMin) / comparedMin;

      return priceDeviation <= input.maxDeviationPercent / 100;
    },
  };
}

export function findLongestSubsets<T extends Item>(
  items: T[],
  percent: number,
  minLength: number,
): T[][] {
  const resultIndexMap = new Map<number, number>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const subarray = items.slice(i + 1);
    if (!subarray.length) continue;
    const chain = createChain({ maxDeviationPercent: percent });
    chain.add(item);
    for (const j of subarray) {
      if (chain.canAdd(j)) {
        chain.add(j);
      } else {
        break;
      }
    }

    resultIndexMap.set(i, chain.items.at(-1)?.index!);
  }

  const result: T[][] = [];

  const hasBiggerChain = (startIndex: number, endIndex: number) => {
    const chainLength = endIndex - startIndex + 1;
    for (let i = startIndex; i <= endIndex; i++) {
      const childIndex = resultIndexMap.get(i)!;
      const childIndexSize = childIndex - i;
      if (childIndexSize >= chainLength) {
        return true;
      }
    }
    return false;
  };

  let nextIndex = 0;

  for (const [startIndex, endIndex] of resultIndexMap.entries()) {
    if (nextIndex > startIndex) {
      continue; // Skip if we have already processed this index
    }
    if (
      endIndex - startIndex + 1 >= minLength &&
      !hasBiggerChain(startIndex, endIndex)
    ) {
      const chain = items.slice(startIndex, endIndex + 1);
      result.push(chain);
      nextIndex = endIndex + 1; // Move to the next index after the current chain
    } else {
      nextIndex = endIndex + 1; // Move to the next index after the current item
    }
  }

  return result;
}
