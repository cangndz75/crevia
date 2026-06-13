import type { ViewStyle } from 'react-native';

import type { CreviaMapPoint } from '../types/creviaMapTypes';

export const CREVIA_MAP_COORDINATE_MAX = 1000;

export function clampMapCoordinate(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(CREVIA_MAP_COORDINATE_MAX, Math.max(0, value));
}

export function normalizeMapPoint(point: CreviaMapPoint): CreviaMapPoint {
  return {
    x: clampMapCoordinate(point.x),
    y: clampMapCoordinate(point.y),
  };
}

export function mapPointToPercent(point: CreviaMapPoint): { left: `${number}%`; top: `${number}%` } {
  const normalized = normalizeMapPoint(point);

  return {
    left: `${(normalized.x / CREVIA_MAP_COORDINATE_MAX) * 100}%`,
    top: `${(normalized.y / CREVIA_MAP_COORDINATE_MAX) * 100}%`,
  };
}

export function mapPointToAbsoluteOverlayStyle(point: CreviaMapPoint): ViewStyle {
  return {
    position: 'absolute',
    ...mapPointToPercent(point),
  };
}

