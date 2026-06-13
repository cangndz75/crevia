import { Image } from 'react-native';

import type {
  CreviaMapDistrictLayout,
  CreviaMapImageAsset,
  CreviaMapOperationMarker,
} from '../types/creviaMapTypes';

const CREVIA_BASE_MAP_V1_SOURCE = require('@/assets/maps/crevia_base_map_v1.png');

function resolveMapAsset(moduleId: number): CreviaMapImageAsset {
  const resolved =
    typeof Image.resolveAssetSource === 'function'
      ? Image.resolveAssetSource(moduleId)
      : undefined;

  return {
    source: moduleId,
    width: resolved?.width ?? 1000,
    height: resolved?.height ?? 1000,
  };
}

export const creviaBaseMapV1 = resolveMapAsset(CREVIA_BASE_MAP_V1_SOURCE);

export const creviaDistrictLayout = [
  {
    id: 'merkez',
    label: 'Merkez',
    center: { x: 500, y: 480 },
    color: '#005B53',
  },
  {
    id: 'cumhuriyet',
    label: 'Cumhuriyet',
    center: { x: 300, y: 650 },
    color: '#B7644B',
  },
  {
    id: 'sanayi',
    label: 'Sanayi',
    center: { x: 720, y: 665 },
    color: '#B8871D',
  },
  {
    id: 'istasyon',
    label: 'Istasyon',
    center: { x: 735, y: 250 },
    color: '#7B5BB8',
  },
  {
    id: 'yesilvadi',
    label: 'Yesilvadi',
    center: { x: 260, y: 240 },
    color: '#2D8F65',
  },
] as const satisfies readonly CreviaMapDistrictLayout[];

export const creviaBaseOperationMarkers = [
  {
    id: 'base-main-merkez',
    districtId: 'merkez',
    point: { x: 520, y: 505 },
    kind: 'main',
    priority: 'high',
    color: '#0F8F86',
  },
  {
    id: 'base-main-cumhuriyet',
    districtId: 'cumhuriyet',
    point: { x: 330, y: 665 },
    kind: 'main',
    priority: 'normal',
    color: '#B7644B',
  },
  {
    id: 'base-pulse-sanayi',
    districtId: 'sanayi',
    point: { x: 690, y: 630 },
    kind: 'pulse',
    priority: 'normal',
    color: '#B8871D',
    minZoom: 1.25,
  },
  {
    id: 'base-completed-cumhuriyet',
    districtId: 'cumhuriyet',
    point: { x: 255, y: 705 },
    kind: 'completed',
    priority: 'normal',
    color: '#2D8F65',
    minZoom: 1.25,
  },
  {
    id: 'base-vehicle-istasyon',
    districtId: 'istasyon',
    point: { x: 760, y: 280 },
    kind: 'vehicle',
    priority: 'normal',
    color: '#7B5BB8',
    minZoom: 1.75,
  },
  {
    id: 'base-personnel-yesilvadi',
    districtId: 'yesilvadi',
    point: { x: 285, y: 270 },
    kind: 'personnel',
    priority: 'normal',
    color: '#2D8F65',
    minZoom: 1.75,
  },
] as const satisfies readonly CreviaMapOperationMarker[];

export const CREVIA_BASE_MAP_ZOOM_LIMITS = {
  min: 1,
  max: 2.2,
} as const;
