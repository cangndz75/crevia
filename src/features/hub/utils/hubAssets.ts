import type { ImageSource } from 'expo-image';

import { creviaAssets } from '@/core/assets/creviaAssets';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import type { HubMetricCard } from '@/features/hub/utils/hubDerived';

export const hubAssets = {
  playerAvatar: require('@/assets/characters/char_chief_operations_01.png'),
  advisorPortrait: require('@/assets/characters/char_operations_advisor_01.png'),
  dailyGoalBadge: creviaAssets.icons.goals.targetTeal,
  regionCalm: creviaAssets.badges.status.good,
  regionBalanced: creviaAssets.districts.icons.cityPulse,
  metrics: {
    operasyon: creviaAssets.icons.resources.efficiencyGauge,
    halk: creviaAssets.socialPulse.citizenGroup,
    butce: creviaAssets.reports.icons.dailyTaskCoin,
    ekip: creviaAssets.socialPulse.teamStatus,
  },
  quickActions: {
    team: creviaAssets.socialPulse.teamStatus,
    route: creviaAssets.map.icons.routePath,
    maint: creviaAssets.vehicles.fieldOperatorTruck,
    announce: creviaAssets.icons.knowledge.operationGuide,
  },
  day1Plan: {
    heroBuilding: creviaAssets.buildings.municipalHall3d,
    progressStar: creviaAssets.icons.goals.targetTeal,
    progressChest: creviaAssets.icons.premium.diamondGold,
    mahalleThumb: creviaAssets.buildings.statusSquare,
  },
  centerSummaryHero: require('@/assets/districts/central/district_central_overview_01.png'),
  centerSummaryPark: require('@/assets/districts/status/district_safe_zone_01.png'),
} as const;

const pilotDistrictHero: Record<PilotDistrictId, ImageSource> = {
  central: require('@/assets/districts/central/district_central_overview_01.png'),
  cumhuriyet: require('@/assets/districts/cumhuriyet/district_cumhuriyet_overview_01.png'),
  industrial_market: require('@/assets/districts/industrial_market/district_industrial_market_overview_01.png'),
};

const neighborhoodThumb: Record<string, ImageSource> = {
  merkez: require('@/assets/districts/central/district_central_overview_02.png'),
  pazar: require('@/assets/districts/cumhuriyet/district_cumhuriyet_overview_01.png'),
  cumhuriyet: require('@/assets/districts/cumhuriyet/district_cumhuriyet_overview_01.png'),
  yesilpark: require('@/assets/districts/status/district_safe_zone_01.png'),
  yesilvadi: require('@/assets/districts/status/district_safe_zone_01.png'),
  sanayi: require('@/assets/districts/industrial_market/district_industrial_market_overview_01.png'),
  'yeni-konut': require('@/assets/districts/central/district_central_overview_03.png'),
  istasyon: require('@/assets/districts/central/district_central_overview_03.png'),
};

export function getPilotDistrictHeroImage(
  districtId: PilotDistrictId | null | undefined,
): ImageSource {
  if (districtId && districtId in pilotDistrictHero) {
    return pilotDistrictHero[districtId];
  }
  return pilotDistrictHero.central;
}

export function getNeighborhoodThumb(neighborhoodId: string): ImageSource {
  return neighborhoodThumb[neighborhoodId] ?? hubAssets.regionBalanced;
}

export { getEventHeroImage } from '@/features/events/utils/eventAssets';

export function getMetricIcon(metricId: HubMetricCard['icon']): ImageSource {
  return hubAssets.metrics[metricId];
}

export function getQuickActionIcon(
  actionId: keyof typeof hubAssets.quickActions,
): ImageSource {
  return hubAssets.quickActions[actionId];
}
