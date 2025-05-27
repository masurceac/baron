import { ZoneVolumeProfile } from '@baron/common';

export function calculateVolumeProfile(
  vpMap: Map<number, number>, // price -> volume pair. Price step is 0.1
  targetPercentage: number,
): ZoneVolumeProfile | null {
  if (!vpMap || vpMap.size === 0) return null;

  // Convert Map to array and sort by price
  const sortedData = Array.from(vpMap.entries()).sort((a, b) => a[0] - b[0]);

  // Calculate total volume
  const totalVolume = sortedData.reduce((sum, [, volume]) => sum + volume, 0);
  const targetVolume = totalVolume * targetPercentage;

  let minRangeWidth = Infinity;
  // let resultRange: [number, number] | null = null;
  let VAH = 0;
  let VAL = 0;
  let POC = 0;
  let pocMaxVolume = 0;

  // Iterate over possible start points
  for (let i = 0; i < sortedData.length; i++) {
    const [iPrice] = sortedData[i]!;

    let currentVolume = 0;

    // Iterate over possible end points
    for (let j = i; j < sortedData.length; j++) {
      const [jPrice, jVolume] = sortedData[j]!;
      currentVolume += jVolume; // Add volume at current price

      // Check if we've reached or exceeded the target volume
      if (currentVolume >= targetVolume) {
        const rangeWidth = jPrice - iPrice;
        // Update result if this range is smaller
        if (rangeWidth < minRangeWidth) {
          minRangeWidth = rangeWidth;
          // resultRange = [price, jPrice];
          VAH = jPrice; // Value Area High
          VAL = iPrice; // Value Area Low
        }
        break; // No need to check larger ranges from this start point
      }
    }
  }

  for (let i = 0; i < sortedData.length; i++) {
    const [price, volume] = sortedData[i]!;

    // Check if this price has the maximum volume
    if (volume > pocMaxVolume && price >= VAL && price <= VAH) {
      pocMaxVolume = volume;
      POC = price; // Point of Control
    }
  }

  return {
    VAH,
    VAL,
    POC,
  };
}
