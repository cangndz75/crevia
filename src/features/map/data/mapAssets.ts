import { Image } from 'react-native';

export type MapImageAsset = {
  src: number;
  width: number;
  height: number;
};

export type MapDistrictId =
  | 'cumhuriyet'
  | 'merkez'
  | 'sanayi'
  | 'istasyon'
  | 'yesilvadi';

export const MAP_DISTRICT_IDS: MapDistrictId[] = [
  'cumhuriyet',
  'merkez',
  'sanayi',
  'istasyon',
  'yesilvadi',
];

export const DEFAULT_MAP_DISTRICT_ID: MapDistrictId = 'cumhuriyet';

/** Şehir genel görünümü — hafif zoom, mahalle seçimi */
const CITY_OVERVIEW_SRC = require('@/assets/ui/crevia_base_map.webp');

/**
 * Mahalle detay haritaları.
 * Gerçek görseller: assets/maps/districts/*_detail.webp
 * Dosyalar eklenene kadar şehir haritası placeholder olarak kullanılır.
 */
const DISTRICT_DETAIL_PLACEHOLDER = CITY_OVERVIEW_SRC;

function resolveAsset(
  moduleId: number,
  fallbackWidth: number,
  fallbackHeight: number,
): MapImageAsset {
  const resolved = Image.resolveAssetSource(moduleId);
  return {
    src: moduleId,
    width: resolved.width ?? fallbackWidth,
    height: resolved.height ?? fallbackHeight,
  };
}

const cityOverviewResolved = resolveAsset(CITY_OVERVIEW_SRC, 4097, 3073);

export const mapAssets = {
  cityOverview: cityOverviewResolved,
  districts: {
    cumhuriyet: resolveAsset(DISTRICT_DETAIL_PLACEHOLDER, 2048, 1536),
    merkez: resolveAsset(DISTRICT_DETAIL_PLACEHOLDER, 2048, 1536),
    sanayi: resolveAsset(DISTRICT_DETAIL_PLACEHOLDER, 2048, 1536),
    istasyon: resolveAsset(DISTRICT_DETAIL_PLACEHOLDER, 2048, 1536),
    yesilvadi: resolveAsset(DISTRICT_DETAIL_PLACEHOLDER, 2048, 1536),
  } satisfies Record<MapDistrictId, MapImageAsset>,
} as const;

export function getDistrictMapAsset(districtId: MapDistrictId): MapImageAsset {
  return mapAssets.districts[districtId];
}

export const MAP_ZOOM_LIMITS = {
  cityOverview: { minScale: 1, maxScale: 1.5 },
  districtDetail: { minScale: 1, maxScale: 2.5 },
} as const;
