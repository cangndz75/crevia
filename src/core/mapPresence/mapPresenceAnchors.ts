import type { MapDistrictId } from '@/features/map/data/mapDistrictConstants';
import { MAP_DISTRICT_IDS } from '@/features/map/data/mapDistrictConstants';
import { getCityDistrictRegion } from '@/features/map/data/cityOverviewGeometry';

import type { DistrictMapPresenceAnchor, MapPresenceAnchorKind, MapPresenceDomain } from './mapPresenceTypes';

function anchor(
  districtId: MapDistrictId,
  kind: MapPresenceAnchorKind,
  slug: string,
  label: string,
  x: number,
  y: number,
  priority: number,
): DistrictMapPresenceAnchor {
  return {
    id: `${districtId}-${kind}-${slug}`,
    districtId,
    kind,
    label,
    x,
    y,
    priority,
  };
}

const MERKEZ_ANCHORS: DistrictMapPresenceAnchor[] = [
  anchor('merkez', 'container', 'cami-sokak', 'Cami sokağı', 0.22, 0.28, 10),
  anchor('merkez', 'container', 'carsi-hatti', 'Çarşı hattı', 0.48, 0.35, 9),
  anchor('merkez', 'container', 'belediye-onu', 'Belediye önü', 0.72, 0.42, 8),
  anchor('merkez', 'vehicle_access', 'ana-gecis', 'Ana geçiş', 0.55, 0.22, 7),
  anchor('merkez', 'team_station', 'saha-bulusma', 'Saha buluşma', 0.38, 0.58, 6),
  anchor('merkez', 'social_hotspot', 'vatandas-merkezi', 'Vatandaş merkezi', 0.62, 0.62, 5),
  anchor('merkez', 'crisis_point', 'sikayet-hatti', 'Şikayet hattı', 0.28, 0.72, 4),
  anchor('merkez', 'district_center', 'merkez', 'Merkez', 0.5, 0.5, 1),
];

const CUMHURIYET_ANCHORS: DistrictMapPresenceAnchor[] = [
  anchor('cumhuriyet', 'container', 'esnaf-hatti', 'Esnaf hattı', 0.18, 0.32, 10),
  anchor('cumhuriyet', 'container', 'apartman-blok', 'Apartman blokları', 0.42, 0.26, 9),
  anchor('cumhuriyet', 'container', 'ara-sokak', 'Ara sokak', 0.68, 0.38, 8),
  anchor('cumhuriyet', 'vehicle_access', 'ana-gecis', 'Ana geçiş', 0.52, 0.18, 7),
  anchor('cumhuriyet', 'team_station', 'saha-bulusma', 'Saha buluşma', 0.35, 0.58, 6),
  anchor('cumhuriyet', 'social_hotspot', 'esnaf-cevresi', 'Esnaf çevresi', 0.58, 0.65, 5),
  anchor('cumhuriyet', 'crisis_point', 'sikayet-hatti', 'Yoğun şikayet hattı', 0.24, 0.78, 4),
  anchor('cumhuriyet', 'district_center', 'merkez', 'Cumhuriyet', 0.5, 0.5, 1),
];

const SANAYI_ANCHORS: DistrictMapPresenceAnchor[] = [
  anchor('sanayi', 'container', 'atolye-giris', 'Atölye girişi', 0.2, 0.34, 10),
  anchor('sanayi', 'container', 'agir-atik', 'Ağır atık noktası', 0.46, 0.28, 9),
  anchor('sanayi', 'container', 'servis-yolu', 'Servis yolu', 0.7, 0.4, 8),
  anchor('sanayi', 'vehicle_access', 'servis-giris', 'Servis girişi', 0.58, 0.16, 7),
  anchor('sanayi', 'team_station', 'teknik-ekip', 'Teknik ekip noktası', 0.4, 0.6, 6),
  anchor('sanayi', 'social_hotspot', 'atolye-hatti', 'Atölye hattı', 0.64, 0.68, 5),
  anchor('sanayi', 'crisis_point', 'agir-atik-hatti', 'Ağır atık hattı', 0.26, 0.8, 4),
  anchor('sanayi', 'district_center', 'merkez', 'Sanayi', 0.5, 0.5, 1),
];

const ISTASYON_ANCHORS: DistrictMapPresenceAnchor[] = [
  anchor('istasyon', 'container', 'peron-onu', 'Peron önü', 0.24, 0.3, 10),
  anchor('istasyon', 'container', 'aktarma-noktasi', 'Aktarma noktası', 0.5, 0.34, 9),
  anchor('istasyon', 'container', 'servis-arka', 'Servis arka sokak', 0.74, 0.42, 8),
  anchor('istasyon', 'vehicle_access', 'peron-gecis', 'Peron geçişi', 0.56, 0.2, 7),
  anchor('istasyon', 'team_station', 'saha-ekip', 'Saha ekip noktası', 0.36, 0.62, 6),
  anchor('istasyon', 'social_hotspot', 'yolcu-akisi', 'Yolcu akışı', 0.6, 0.66, 5),
  anchor('istasyon', 'crisis_point', 'gecikme-hatti', 'Gecikme hattı', 0.22, 0.76, 4),
  anchor('istasyon', 'district_center', 'merkez', 'İstasyon', 0.5, 0.5, 1),
];

const YESILVADI_ANCHORS: DistrictMapPresenceAnchor[] = [
  anchor('yesilvadi', 'container', 'park-giris', 'Park girişi', 0.2, 0.36, 10),
  anchor('yesilvadi', 'container', 'yuruyus-yolu', 'Yürüyüş yolu', 0.44, 0.3, 9),
  anchor('yesilvadi', 'container', 'geri-donusum', 'Geri dönüşüm kapısı', 0.68, 0.44, 8),
  anchor('yesilvadi', 'vehicle_access', 'park-gecis', 'Park geçişi', 0.54, 0.18, 7),
  anchor('yesilvadi', 'team_station', 'temizlik-ekip', 'Temizlik ekip', 0.38, 0.6, 6),
  anchor('yesilvadi', 'social_hotspot', 'park-cevresi', 'Park çevresi', 0.62, 0.7, 5),
  anchor('yesilvadi', 'crisis_point', 'sikayet-noktasi', 'Şikayet noktası', 0.26, 0.78, 4),
  anchor('yesilvadi', 'district_center', 'merkez', 'Yeşilvadi', 0.5, 0.5, 1),
];

export const MAP_PRESENCE_ANCHORS_BY_DISTRICT: Record<MapDistrictId, DistrictMapPresenceAnchor[]> = {
  merkez: MERKEZ_ANCHORS,
  cumhuriyet: CUMHURIYET_ANCHORS,
  sanayi: SANAYI_ANCHORS,
  istasyon: ISTASYON_ANCHORS,
  yesilvadi: YESILVADI_ANCHORS,
};

export const ALL_MAP_PRESENCE_ANCHORS: DistrictMapPresenceAnchor[] = MAP_DISTRICT_IDS.flatMap(
  (id) => MAP_PRESENCE_ANCHORS_BY_DISTRICT[id],
);

export function getMapPresenceAnchorsForDistrict(
  districtId: MapDistrictId,
): DistrictMapPresenceAnchor[] {
  return MAP_PRESENCE_ANCHORS_BY_DISTRICT[districtId] ?? [];
}

export function selectMapPresenceAnchors(
  districtId: MapDistrictId,
  domain: MapPresenceDomain,
): DistrictMapPresenceAnchor[] {
  const anchors = getMapPresenceAnchorsForDistrict(districtId);
  switch (domain) {
    case 'container':
      return anchors.filter((a) => a.kind === 'container' || a.kind === 'district_center');
    case 'vehicle_route':
      return anchors.filter(
        (a) =>
          a.kind === 'vehicle_access' ||
          a.kind === 'container' ||
          a.kind === 'district_center',
      );
    case 'personnel':
      return anchors.filter(
        (a) => a.kind === 'team_station' || a.kind === 'vehicle_access' || a.kind === 'district_center',
      );
    case 'social':
      return anchors.filter(
        (a) => a.kind === 'social_hotspot' || a.kind === 'team_station' || a.kind === 'district_center',
      );
    case 'crisis_adjacent':
      return anchors.filter((a) => a.kind === 'crisis_point' || a.kind === 'district_center');
    case 'district_balance':
      return anchors.filter((a) => a.kind === 'district_center');
    default:
      return anchors.filter((a) => a.kind === 'district_center');
  }
}

function clampCoord(value: number): number {
  return Math.min(0.95, Math.max(0.05, value));
}

/** Mahalle içi 0–1 anchor → şehir geneli normalize koordinat */
export function resolveAnchorToCityPosition(
  districtId: MapDistrictId,
  anchor: DistrictMapPresenceAnchor,
): { x: number; y: number } {
  const region = getCityDistrictRegion(districtId);
  if (!region) {
    return { x: clampCoord(anchor.x), y: clampCoord(anchor.y) };
  }
  const spreadX = 0.14;
  const spreadY = 0.12;
  return {
    x: clampCoord(region.label.x + (anchor.x - 0.5) * spreadX),
    y: clampCoord(region.label.y + (anchor.y - 0.5) * spreadY),
  };
}

/** Detay haritasında doğrudan anchor koordinatları */
export function resolveAnchorToDistrictPosition(anchor: DistrictMapPresenceAnchor): {
  x: number;
  y: number;
} {
  return { x: clampCoord(anchor.x), y: clampCoord(anchor.y) };
}
