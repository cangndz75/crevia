import { Image } from 'expo-image';
import { Image as RNImage } from 'react-native';

import { criticalEventImageModules } from '@/core/assets/eventScreenAssets';
import { creviaAssets } from '@/core/assets/creviaAssets';
import { eventAssets as operationalEventAssets } from '@/features/events/utils/eventAssets';
import { hubAssets } from '@/features/hub/utils/hubAssets';

const TAB_BAR_IMAGES = [
  require('@/assets/bt1.png'),
  require('@/assets/bt2.png'),
  require('@/assets/bt4.png'),
  require('@/assets/bt5.png'),
  require('@/assets/bt6.png'),
  require('@/assets/bt7.png'),
  require('@/assets/bt8.png'),
] as const;

const HOME_DISTRICT_IMAGES = [
  require('@/assets/districts/central/district_central_overview_01.png'),
  require('@/assets/districts/central/district_central_overview_02.png'),
  require('@/assets/districts/central/district_central_overview_03.png'),
  require('@/assets/districts/cumhuriyet/district_cumhuriyet_overview_01.png'),
  require('@/assets/districts/industrial_market/district_industrial_market_overview_01.png'),
  require('@/assets/districts/status/district_safe_zone_01.png'),
] as const;

function collectImageModules(value: unknown, out: Set<number>): void {
  if (typeof value === 'number') {
    out.add(value);
    return;
  }

  if (value && typeof value === 'object') {
    for (const nested of Object.values(value)) {
      collectImageModules(nested, out);
    }
  }
}

async function prefetchModule(moduleId: number): Promise<void> {
  const resolved = RNImage.resolveAssetSource(moduleId);
  if (resolved?.uri) {
    await Image.prefetch(resolved.uri);
  }
}

/** Splash sırasında ilk ekranda görünen PNG'leri belleğe alır. */
export async function preloadStartupImages(): Promise<void> {
  const modules = new Set<number>();

  for (const image of TAB_BAR_IMAGES) {
    modules.add(image);
  }
  for (const image of HOME_DISTRICT_IMAGES) {
    modules.add(image);
  }

  collectImageModules(creviaAssets, modules);
  collectImageModules(hubAssets, modules);
  collectImageModules(operationalEventAssets, modules);

  for (const image of criticalEventImageModules) {
    modules.add(image);
  }

  await Promise.all([...modules].map((moduleId) => prefetchModule(moduleId)));
}
