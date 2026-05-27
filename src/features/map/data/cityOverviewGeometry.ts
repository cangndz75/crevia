import { colors } from '@/ui/theme/colors';

import type { MapDistrictId } from './mapAssets';

/** Normalize 0–1 koordinatlar — crevia_base_map.webp üzerinde */
export type CityDistrictRegion = {
  id: MapDistrictId;
  displayName: string;
  color: string;
  /** SVG path — viewBox 0 0 1 1 */
  path: string;
  label: { x: number; y: number };
  heatZones: { cx: number; cy: number; rx: number; ry: number; fill: string }[];
};

export const CITY_OVERVIEW_VIEWBOX = { width: 1, height: 1 } as const;

export const CITY_DISTRICT_REGIONS: CityDistrictRegion[] = [
  {
    id: 'merkez',
    displayName: 'Merkez',
    color: colors.primary,
    path: 'M 0.24 0.14 L 0.42 0.12 L 0.58 0.15 L 0.66 0.22 L 0.68 0.34 L 0.62 0.44 L 0.48 0.48 L 0.32 0.46 L 0.24 0.36 L 0.22 0.24 Z',
    label: { x: 0.44, y: 0.3 },
    heatZones: [
      { cx: 0.42, cy: 0.28, rx: 0.08, ry: 0.05, fill: 'rgba(232, 155, 46, 0.22)' },
    ],
  },
  {
    id: 'cumhuriyet',
    displayName: 'Cumhuriyet',
    color: colors.purple,
    path: 'M 0.06 0.48 L 0.22 0.44 L 0.34 0.48 L 0.38 0.58 L 0.32 0.72 L 0.18 0.76 L 0.08 0.68 L 0.05 0.56 Z',
    label: { x: 0.2, y: 0.6 },
    heatZones: [
      { cx: 0.18, cy: 0.58, rx: 0.07, ry: 0.06, fill: 'rgba(224, 90, 82, 0.28)' },
    ],
  },
  {
    id: 'sanayi',
    displayName: 'Sanayi',
    color: colors.hubGold,
    path: 'M 0.52 0.44 L 0.72 0.42 L 0.88 0.48 L 0.92 0.58 L 0.86 0.72 L 0.68 0.76 L 0.54 0.7 L 0.5 0.56 Z',
    label: { x: 0.72, y: 0.58 },
    heatZones: [
      { cx: 0.72, cy: 0.54, rx: 0.08, ry: 0.05, fill: 'rgba(232, 155, 46, 0.26)' },
    ],
  },
  {
    id: 'istasyon',
    displayName: 'İstasyon',
    color: colors.secondary,
    path: 'M 0.38 0.52 L 0.52 0.5 L 0.58 0.58 L 0.54 0.72 L 0.42 0.76 L 0.34 0.68 L 0.34 0.58 Z',
    label: { x: 0.44, y: 0.64 },
    heatZones: [
      { cx: 0.44, cy: 0.62, rx: 0.06, ry: 0.05, fill: 'rgba(224, 90, 82, 0.18)' },
    ],
  },
  {
    id: 'yesilvadi',
    displayName: 'Yeşilvadi',
    color: colors.success,
    path: 'M 0.08 0.22 L 0.2 0.18 L 0.28 0.24 L 0.3 0.36 L 0.22 0.44 L 0.1 0.42 L 0.06 0.32 Z',
    label: { x: 0.17, y: 0.3 },
    heatZones: [
      { cx: 0.16, cy: 0.3, rx: 0.06, ry: 0.05, fill: 'rgba(46, 160, 120, 0.22)' },
    ],
  },
];

/** Şehir geneli ekip rotaları — normalize path */
export const CITY_OVERVIEW_ROUTES: string[] = [
  'M 0.2 0.6 L 0.35 0.55 L 0.44 0.5',
  'M 0.44 0.3 L 0.55 0.45 L 0.65 0.52',
  'M 0.72 0.55 L 0.8 0.62 L 0.85 0.68',
];

export function getCityDistrictRegion(
  districtId: MapDistrictId,
): CityDistrictRegion | undefined {
  return CITY_DISTRICT_REGIONS.find((r) => r.id === districtId);
}
