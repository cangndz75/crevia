import { Image } from 'expo-image';
import { Image as RNImage } from 'react-native';

/** Harita sekmesi ilk açılışında görünen statik görseller */
export const mapBaseImageModule = require('@/assets/maps/crevia_base_map_v1.png');

export const mapMarkerImageModules = {
  operationLive: require('@/assets/maps/markers/map_marker_operation_live.png'),
  personnel: require('@/assets/maps/markers/map_marker_personnel.png'),
  vehicle: require('@/assets/maps/markers/map_marker_vehicle.png'),
  completed: require('@/assets/maps/markers/map_marker_completed.png'),
} as const;

export const mapCriticalImageModules = [
  mapBaseImageModule,
  mapMarkerImageModules.operationLive,
  mapMarkerImageModules.personnel,
  mapMarkerImageModules.vehicle,
  mapMarkerImageModules.completed,
] as const;

async function prefetchModule(moduleId: number): Promise<void> {
  const resolved = RNImage.resolveAssetSource(moduleId);
  if (resolved?.uri) {
    await Image.prefetch(resolved.uri);
  }
}

/** Harita PNG'lerini belleğe alır — startup ve sekme odağında kullanılır. */
export async function prefetchMapCriticalImages(): Promise<void> {
  await Promise.all(mapCriticalImageModules.map((moduleId) => prefetchModule(moduleId)));
}
