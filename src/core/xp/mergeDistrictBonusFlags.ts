import type { DistrictBonusFlags } from '@/core/xp/types';

/**
 * Event ipuçları, karar ve sonuç flag'lerini birleştirir.
 * Yalnızca `true` değerler korunur; false/undefined mevcut true değerleri silmez.
 */
export function mergeDistrictBonusFlags(
  ...sources: (DistrictBonusFlags | undefined)[]
): DistrictBonusFlags {
  const merged: DistrictBonusFlags = {};

  for (const source of sources) {
    if (!source) {
      continue;
    }
    for (const key of Object.keys(source) as (keyof DistrictBonusFlags)[]) {
      if (source[key] === true) {
        merged[key] = true;
      }
    }
  }

  return merged;
}
