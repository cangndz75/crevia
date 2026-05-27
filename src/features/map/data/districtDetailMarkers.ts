import { colors } from '@/ui/theme/colors';

import type { MapDistrictId } from './mapAssets';
import type { MapPin } from '../types/map';

export type DistrictPoiKind =
  | 'school'
  | 'market'
  | 'park'
  | 'container'
  | 'clinic'
  | 'station';

export type DistrictPoi = {
  id: string;
  kind: DistrictPoiKind;
  label: string;
  x: number;
  y: number;
};

const POI_COLORS: Record<DistrictPoiKind, string> = {
  school: colors.primary,
  market: colors.hubGold,
  park: colors.success,
  container: colors.warning,
  clinic: colors.danger,
  station: colors.secondary,
};

const POI_ICONS: Record<DistrictPoiKind, string> = {
  school: 'school',
  market: 'cart',
  park: 'leaf',
  container: 'trash',
  clinic: 'medical',
  station: 'train',
};

function poiToPin(poi: DistrictPoi, districtId: MapDistrictId): MapPin {
  return {
    id: poi.id,
    type: poi.kind === 'container' ? 'container' : 'event',
    label: poi.label,
    x: poi.x,
    y: poi.y,
    color: POI_COLORS[poi.kind],
    icon: POI_ICONS[poi.kind],
    severity: poi.kind === 'container' ? 'medium' : 'low',
    mapDistrictId: districtId,
  };
}

const DISTRICT_POIS: Record<MapDistrictId, DistrictPoi[]> = {
  cumhuriyet: [
    { id: 'c-school', kind: 'school', label: 'Cumhuriyet İlkokulu', x: 0.28, y: 0.38 },
    { id: 'c-market', kind: 'market', label: 'Mahalle Pazarı', x: 0.52, y: 0.45 },
    { id: 'c-park', kind: 'park', label: 'Cumhuriyet Parkı', x: 0.62, y: 0.55 },
    { id: 'c-container', kind: 'container', label: 'Konteyner Noktası', x: 0.4, y: 0.62 },
    { id: 'c-clinic', kind: 'clinic', label: 'Sağlık Ocağı', x: 0.72, y: 0.4 },
  ],
  merkez: [
    { id: 'm-school', kind: 'school', label: 'Merkez Ortaokulu', x: 0.45, y: 0.35 },
    { id: 'm-market', kind: 'market', label: 'Belediye Pazarı', x: 0.55, y: 0.48 },
    { id: 'm-park', kind: 'park', label: 'Kent Meydanı', x: 0.38, y: 0.52 },
    { id: 'm-container', kind: 'container', label: 'Ana Konteyner', x: 0.5, y: 0.58 },
    { id: 'm-clinic', kind: 'clinic', label: 'Toplum Sağlığı', x: 0.65, y: 0.32 },
  ],
  sanayi: [
    { id: 's-market', kind: 'market', label: 'Sanayi Pazarı', x: 0.35, y: 0.42 },
    { id: 's-container', kind: 'container', label: 'Atık Konteyneri', x: 0.48, y: 0.55 },
    { id: 's-station', kind: 'station', label: 'Yükleme Alanı', x: 0.62, y: 0.38 },
    { id: 's-park', kind: 'park', label: 'Dinlenme Alanı', x: 0.72, y: 0.6 },
  ],
  istasyon: [
    { id: 'i-station', kind: 'station', label: 'İstasyon Meydanı', x: 0.5, y: 0.4 },
    { id: 'i-market', kind: 'market', label: 'Peron Pazarı', x: 0.38, y: 0.52 },
    { id: 'i-container', kind: 'container', label: 'Transfer Konteyner', x: 0.58, y: 0.58 },
    { id: 'i-clinic', kind: 'clinic', label: 'Acil Sağlık', x: 0.68, y: 0.45 },
  ],
  yesilvadi: [
    { id: 'y-park', kind: 'park', label: 'Yeşilvadi Parkı', x: 0.42, y: 0.45 },
    { id: 'y-school', kind: 'school', label: 'Yeşilvadi Okulu', x: 0.55, y: 0.35 },
    { id: 'y-market', kind: 'market', label: 'Organik Pazar', x: 0.32, y: 0.55 },
    { id: 'y-container', kind: 'container', label: 'Geri Dönüşüm', x: 0.6, y: 0.62 },
  ],
};

export function getDistrictPoiPins(districtId: MapDistrictId): MapPin[] {
  return (DISTRICT_POIS[districtId] ?? []).map((poi) => poiToPin(poi, districtId));
}
