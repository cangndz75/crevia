import type { ImageSource } from 'expo-image';

import { creviaAssets } from '@/core/assets/creviaAssets';
import { hubAssets } from '@/features/hub/utils/hubAssets';

/** Ana Operasyon Önizlemesi — `assets/crevia` görselleri. */
export const mainOperationPreviewAssets = {
  status: {
    pilotDone: creviaAssets.badges.pilot.firstFieldDay,
    reportReady: creviaAssets.reports.icons.checklistSuccess,
    authorityTracking: creviaAssets.authority.shieldCheck,
  },
  authorityDecor: creviaAssets.authority.shieldCheck,
  scopeDecor: creviaAssets.operations.dispatchCompass,
  heroBadge: creviaAssets.badges.authority.high,
  heroCityFallback: creviaAssets.buildings.municipalHall3d,
  systems: {
    cityMap: creviaAssets.map.icons.layersStack,
    neighborhoods: creviaAssets.districts.industrialBlock,
    butterfly: creviaAssets.icons.signals.beaconTeal,
    vehicles: creviaAssets.vehicles.fieldOperatorTruck,
  },
  scopeRowThumbs: {
    neighborhood_istasyon: creviaAssets.map.markers.publicBuilding,
    neighborhood_yesilvadi: creviaAssets.badges.status.good,
    operation_scope_main: creviaAssets.operations.dispatchCompass,
    system_crisis_desk: creviaAssets.icons.status.warningShield,
  },
} as const satisfies Record<string, unknown>;

export type MainOpPreviewStatusAssetId = keyof typeof mainOperationPreviewAssets.status;

const STATUS_ASSET_BY_CHIP_ID: Record<string, MainOpPreviewStatusAssetId> = {
  'pilot-done': 'pilotDone',
  'report-ready': 'reportReady',
  'authority-tracking': 'authorityTracking',
};

export function getMainOperationStatusImage(chipId: string): ImageSource {
  const key = STATUS_ASSET_BY_CHIP_ID[chipId];
  if (key) {
    return mainOperationPreviewAssets.status[key];
  }
  return mainOperationPreviewAssets.status.pilotDone;
}

export function getMainOperationScopeRowThumb(scopeId: string): ImageSource | undefined {
  const thumbs = mainOperationPreviewAssets.scopeRowThumbs as Record<string, ImageSource>;
  return thumbs[scopeId];
}

export function getMainOperationSystemImage(systemId: string): ImageSource {
  const map = mainOperationPreviewAssets.systems as Record<string, ImageSource>;
  return map[systemId] ?? hubAssets.metrics.operasyon;
}
