import type { ImageSourcePropType } from 'react-native';

import type { PilotDistrictId } from '@/core/models/DistrictProfile';

/** Kolay değiştirilebilir asset haritası */
export const onboardingAssets = {
  districts: {
    central: require('@/assets/districts/central/district_central_overview_01.png'),
    cumhuriyet: require('@/assets/districts/cumhuriyet/district_cumhuriyet_overview_01.png'),
    industrial_market: require('@/assets/districts/industrial_market/district_industrial_market_overview_01.png'),
  } satisfies Record<PilotDistrictId, ImageSourcePropType>,
  neighborhoodMap: require('@/assets/districts/central/district_central_overview_02.png'),
  eventHero: require('@/assets/events/market/ev_market_area_pollution_01.png'),
  outcomeMap: require('@/assets/districts/central/district_central_overview_03.png'),
  characters: {
    muhtar: require('@/assets/characters/char_manager_municipal_01.png'),
    sahaSefi: require('@/assets/characters/char_chief_operations_01.png'),
    vatandas: require('@/assets/characters/char_citizen_family_group_01.png'),
  },
} as const;

export function getDistrictAsset(id: PilotDistrictId): ImageSourcePropType {
  return onboardingAssets.districts[id];
}
