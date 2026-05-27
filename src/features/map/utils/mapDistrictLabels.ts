import type { MapDistrictId } from '../data/mapAssets';

const LABELS: Record<MapDistrictId, string> = {
  cumhuriyet: 'Cumhuriyet Mahallesi',
  merkez: 'Merkez',
  sanayi: 'Sanayi',
  istasyon: 'İstasyon',
  yesilvadi: 'Yeşilvadi',
};

export function getMapDistrictLabel(districtId: MapDistrictId): string {
  return LABELS[districtId];
}
