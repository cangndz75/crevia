import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import { colors } from '@/ui/theme/colors';

import type { PilotAreaId } from '../types/map';
import { PILOT_AREA_TO_DISTRICT } from './pilotAreaMapping';

export const MAP_VIEWBOX = { width: 360, height: 260 } as const;

export type RegionGeometry = {
  districtId: PilotDistrictId;
  pilotAreaId: PilotAreaId;
  displayName: string;
  population: number;
  color: string;
  /** SVG path d attribute */
  path: string;
  label: { x: number; y: number };
  /** Risk heat ellipses (cx, cy, rx, ry, opacity) */
  heatZones: { cx: number; cy: number; rx: number; ry: number; fill: string }[];
};

/** Ana yol ağı */
export const MAP_ROADS: string[] = [
  'M 0,118 L 360,118',
  'M 180,0 L 180,260',
  'M 45,175 L 315,175',
  'M 95,52 L 265,58',
  'M 110,138 L 250,145',
  'M 55,95 L 305,88',
];

/** Nehir / yeşil koridor */
export const MAP_RIVER_PATH =
  'M 0,102 Q 90,88 140,95 T 220,108 T 360,98';

export const MAP_GREEN_PATCHES: { path: string; opacity: number }[] = [
  {
    path: 'M 28,168 Q 55,155 72,172 Q 58,188 35,182 Z',
    opacity: 0.35,
  },
  {
    path: 'M 155,118 Q 175,108 195,122 Q 188,138 162,132 Z',
    opacity: 0.28,
  },
];

export const MAP_REGIONS: RegionGeometry[] = [
  {
    districtId: 'central',
    pilotAreaId: 'merkez',
    displayName: 'Merkez Pilot Bölge',
    population: 12450,
    color: colors.primary,
    path: 'M 88,48 L 168,42 L 272,52 L 288,92 L 272,132 L 188,148 L 108,142 L 82,108 L 78,72 Z',
    label: { x: 178, y: 92 },
    heatZones: [
      { cx: 165, cy: 95, rx: 42, ry: 28, fill: 'rgba(232, 155, 46, 0.22)' },
      { cx: 220, cy: 78, rx: 28, ry: 20, fill: 'rgba(224, 90, 82, 0.12)' },
    ],
  },
  {
    districtId: 'cumhuriyet',
    pilotAreaId: 'cumhuriyet',
    displayName: 'Cumhuriyet Mahallesi',
    population: 9870,
    color: colors.purple,
    path: 'M 22,148 L 98,138 L 148,152 L 158,198 L 128,228 L 48,222 L 18,188 Z',
    label: { x: 88, y: 182 },
    heatZones: [
      { cx: 72, cy: 175, rx: 38, ry: 32, fill: 'rgba(224, 90, 82, 0.28)' },
      { cx: 115, cy: 195, rx: 24, ry: 18, fill: 'rgba(232, 155, 46, 0.2)' },
    ],
  },
  {
    districtId: 'industrial_market',
    pilotAreaId: 'sanayiPazar',
    displayName: 'Sanayi & Pazar Bölgesi',
    population: 6780,
    color: colors.hubGold,
    path: 'M 198,132 L 278,125 L 342,142 L 348,188 L 318,232 L 228,238 L 192,198 L 188,158 Z',
    label: { x: 268, y: 178 },
    heatZones: [
      { cx: 268, cy: 165, rx: 45, ry: 30, fill: 'rgba(232, 155, 46, 0.26)' },
      { cx: 310, cy: 195, rx: 32, ry: 24, fill: 'rgba(224, 90, 82, 0.2)' },
    ],
  },
];

/** Ekip rotası — normalize 0–1 değil, viewBox koordinatı */
export const CREW_ROUTE_PATHS: Record<PilotAreaId, string[]> = {
  merkez: [
    'M 155,95 L 195,110 L 210,125',
    'M 175,100 L 145,115 L 130,128',
  ],
  cumhuriyet: [
    'M 65,170 L 95,185 L 120,175',
    'M 80,165 L 55,195 L 45,210',
    'M 100,180 L 130,195',
  ],
  sanayiPazar: [
    'M 240,155 L 275,170 L 300,185',
    'M 255,165 L 220,190 L 205,210',
    'M 285,160 L 320,175 L 335,195',
  ],
};

export function getRegionByDistrict(
  districtId: PilotDistrictId,
): RegionGeometry | undefined {
  return MAP_REGIONS.find((r) => r.districtId === districtId);
}

export function getRegionByPilotArea(
  pilotAreaId: PilotAreaId,
): RegionGeometry | undefined {
  return MAP_REGIONS.find((r) => r.pilotAreaId === pilotAreaId);
}

export function districtFromArea(areaId: PilotAreaId): PilotDistrictId {
  return PILOT_AREA_TO_DISTRICT[areaId];
}
