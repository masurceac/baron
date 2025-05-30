import { ChartBar, ZoneVolumeProfile } from '@baron/common';

export function calculateVolumeProfile(
  data: ChartBar[],
  priceStep: number = 0.01,
  volumePercentage: number = 0.7,
): ZoneVolumeProfile {
  // Step 1: Build the volume profile
  const volumeProfile: Map<number, number> = new Map();

  // Calculate total volume
  let totalVolume = 0;
  for (const bar of data) {
    totalVolume += bar.Volume;
    const priceRange = bar.High - bar.Low;
    if (priceRange === 0) {
      // Single price level
      const priceKey = Math.round(bar.Low / priceStep) * priceStep;
      volumeProfile.set(
        priceKey,
        (volumeProfile.get(priceKey) || 0) + bar.Volume,
      );
    } else {
      // Distribute volume linearly across price levels
      const volumePerPrice = bar.Volume / (priceRange / priceStep);
      for (let price = bar.Low; price <= bar.High; price += priceStep) {
        const priceKey = Math.round(price / priceStep) * priceStep;
        volumeProfile.set(
          priceKey,
          (volumeProfile.get(priceKey) || 0) + volumePerPrice,
        );
      }
    }
  }

  // Step 2: Find POC (price with highest volume)
  let pocPrice = 0;
  let maxVolume = 0;
  for (const [price, volume] of volumeProfile) {
    if (volume > maxVolume) {
      maxVolume = volume;
      pocPrice = price;
    }
  }

  // Step 3: Calculate Value Area (70% of total volume)
  const targetVolume = totalVolume * volumePercentage;
  let currentVolume = maxVolume;
  let lowerPrice = pocPrice;
  let upperPrice = pocPrice;

  // Sort prices for systematic expansion
  const sortedPrices = Array.from(volumeProfile.keys()).sort((a, b) => a - b);
  let lowerIndex = sortedPrices.indexOf(pocPrice);
  let upperIndex = lowerIndex;

  while (
    currentVolume < targetVolume &&
    (lowerIndex > 0 || upperIndex < sortedPrices.length - 1)
  ) {
    let nextLowerVolume = 0;
    let nextUpperVolume = 0;

    // Check volume at next lower price
    if (lowerIndex > 0) {
      nextLowerVolume = volumeProfile.get(sortedPrices[lowerIndex - 1]!) || 0;
    }

    // Check volume at next upper price
    if (upperIndex < sortedPrices.length - 1) {
      nextUpperVolume = volumeProfile.get(sortedPrices[upperIndex + 1]!) || 0;
    }

    // Choose the side with higher volume to expand
    if (nextLowerVolume > nextUpperVolume && lowerIndex > 0) {
      lowerIndex--;
      currentVolume += nextLowerVolume;
      lowerPrice = sortedPrices[lowerIndex]!;
    } else if (upperIndex < sortedPrices.length - 1) {
      upperIndex++;
      currentVolume += nextUpperVolume;
      upperPrice = sortedPrices[upperIndex]!;
    } else if (lowerIndex > 0) {
      // If upper is exhausted, expand lower
      lowerIndex--;
      currentVolume += nextLowerVolume;
      lowerPrice = sortedPrices[lowerIndex]!;
    } else {
      break; // No more prices to expand
    }
  }

  return {
    POC: Number(pocPrice.toFixed(2)),
    VAL: Number(lowerPrice.toFixed(2)),
    VAH: Number(upperPrice.toFixed(2)),
  };
}
