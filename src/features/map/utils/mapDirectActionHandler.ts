import type { Router } from 'expo-router';

import type { MapDirectActionPresentation } from '@/core/mapDirectAction/mapDirectActionTypes';

export type MapDirectActionCallbacks = {
  onOpenDistrictDetail?: (districtId: string) => void;
  onToggleLayers?: () => void;
};

export function handleMapDirectAction(
  action: MapDirectActionPresentation | undefined,
  router: Router,
  callbacks: MapDirectActionCallbacks = {},
): boolean {
  if (!action?.enabled || !action.targetRouteKey) return false;

  const route = action.targetRouteKey;

  if (route.startsWith('map:detail:')) {
    const districtId = route.slice('map:detail:'.length);
    if (!districtId || !callbacks.onOpenDistrictDetail) return false;
    callbacks.onOpenDistrictDetail(districtId);
    return true;
  }

  if (route === 'map:layers') {
    if (!callbacks.onToggleLayers) return false;
    callbacks.onToggleLayers();
    return true;
  }

  if (route.startsWith('/')) {
    router.push(route as never);
    return true;
  }

  return false;
}
