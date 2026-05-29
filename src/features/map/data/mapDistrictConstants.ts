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
