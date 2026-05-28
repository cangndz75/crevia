import type { ImageSource } from 'expo-image';

import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import type { HubMetricCard } from '@/features/hub/utils/hubDerived';

export const hubAssets = {
  playerAvatar: require('@/assets/characters/char_chief_operations_01.png'),
  advisorPortrait: require('@/assets/characters/char_operations_advisor_01.png'),
  dailyGoalBadge: require('@/assets/badges/badge_daily_goal_01.png'),
  regionCalm: require('@/assets/districts/status/district_safe_zone_01.png'),
  regionBalanced: require('@/assets/districts/status/district_status_balanced_01.png'),
  metrics: {
    operasyon: require('@/assets/districts/route/district_route_network_01.png'),
    halk: require('@/assets/ui/ui_public_satisfaction_01.png'),
    butce: require('@/assets/ui/ui_budget_reward_01.png'),
    ekip: require('@/assets/characters/char_field_worker_maintenance_01.png'),
  },
  quickActions: {
    team: require('@/assets/icons/actions/ic_action_assign_team_01.png'),
    route: require('@/assets/icons/actions/ic_action_route_plan_01.png'),
    maint: require('@/assets/icons/actions/ic_action_maintenance_01.png'),
    announce: require('@/assets/icons/actions/ic_action_announcement_01.png'),
  },
  day1Plan: {
    heroBuilding: require('@/assets/districts/central/district_central_overview_01.png'),
    progressStar: require('@/assets/badges/badge_daily_goal_01.png'),
    progressChest: require('@/assets/ui/ui_budget_reward_01.png'),
    mahalleThumb: require('@/assets/districts/central/district_central_overview_02.png'),
  },
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
