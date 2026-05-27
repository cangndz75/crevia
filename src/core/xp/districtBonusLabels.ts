import type { DistrictBonusFlags } from '@/core/xp/types';

export const DISTRICT_BONUS_FLAG_LABELS: Record<
  keyof DistrictBonusFlags,
  string
> = {
  trafficReduced: 'Trafik rahatlar',
  crowdControlled: 'Yoğunluk kontrolü',
  publicTrustProtected: 'Güven korunur',
  socialRiskPrevented: 'Sosyal medya riski azalır',
  vehicleBreakdownPrevented: 'Araç arızası önlenir',
  resolvedQuickly: 'Hızlı müdahale',
  parkOrderProtected: 'Park düzeni korunur',
};

export function getActiveDistrictBonusLabels(
  flags?: DistrictBonusFlags,
): string[] {
  if (!flags) {
    return [];
  }

  return (Object.keys(DISTRICT_BONUS_FLAG_LABELS) as (keyof DistrictBonusFlags)[])
    .filter((key) => flags[key] === true)
    .map((key) => DISTRICT_BONUS_FLAG_LABELS[key]);
}
