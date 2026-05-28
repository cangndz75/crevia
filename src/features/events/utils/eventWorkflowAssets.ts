import type { ImageSource } from 'expo-image';

import type { PilotDistrictId } from '@/core/models/DistrictProfile';

/** İnceleme / operasyon workflow görselleri — `assets/events/inspect/` */
export const eventWorkflowAssets = {
  findingsScene: require('@/assets/events/inspect/ev_inspect_findings_scene_01.png'),
  neighborhoodHero: {
    central: require('@/assets/events/inspect/ev_inspect_neighborhood_hero_01.png'),
    cumhuriyet: require('@/assets/events/inspect/ev_inspect_neighborhood_hero_01.png'),
    industrial_market: require('@/assets/districts/industrial_market/district_industrial_market_overview_01.png'),
  },
} as const;

const districtHeroById: Record<PilotDistrictId, ImageSource> = {
  central: require('@/assets/districts/central/district_central_overview_01.png'),
  cumhuriyet: eventWorkflowAssets.neighborhoodHero.cumhuriyet,
  industrial_market: eventWorkflowAssets.neighborhoodHero.industrial_market,
};

export function getInspectNeighborhoodHero(
  districtId?: PilotDistrictId | string | null,
): ImageSource {
  if (districtId && districtId in districtHeroById) {
    return districtHeroById[districtId as PilotDistrictId];
  }
  return eventWorkflowAssets.neighborhoodHero.cumhuriyet;
}

export function getInspectFindingsScene(): ImageSource {
  return eventWorkflowAssets.findingsScene;
}
