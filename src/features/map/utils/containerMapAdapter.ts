import { CONTAINER_TYPE_LABELS } from '@/core/containers/containerConstants';
import {
  normalizeContainerNeighborhoodId,
  toDisplayContainerNeighborhoodName,
} from '@/core/containers/containerNeighborhoodBridge';
import { selectContainerUnitsByNeighborhood } from '@/core/containers/containerSelectors';
import {
  buildHubContainerDetail,
  formatContainerRecommendedAction,
  getContainerSeverityTone,
  mapContainerSeverityFromStatus,
} from '@/core/containers/containerUiHelpers';
import type {
  ContainerNeighborhoodId,
  ContainerState,
  ContainerUnit,
} from '@/core/containers/containerTypes';
import { colors } from '@/ui/theme/colors';

import type { MapDistrictId } from '../data/mapAssets';
import { getCityDistrictRegion } from '../data/cityOverviewGeometry';
import type { ContainerSummary, MapPin, PinSeverity } from '../types/map';

export type MapContainerPin = {
  id: string;
  neighborhoodId: ContainerNeighborhoodId;
  x: number;
  y: number;
  label: string;
  typeLabel: string;
  statusLabel: string;
  severity: PinSeverity;
  fillRate: number;
  odorLevel: number;
  maintenanceNeed: number;
  condition: number;
  recommendedAction: string;
};

export type NeighborhoodContainerMapSignal = {
  neighborhoodId: ContainerNeighborhoodId;
  statusLabel: string;
  severity: PinSeverity;
  detail: string;
  pinCount: number;
  recommendedAction: string;
};

export type MapContainerPanelItem = {
  id: string;
  label: string;
  district: string;
  fillPercentage: number;
  statusLabel: string;
  severity: PinSeverity;
  metricsLine: string;
  recommendedAction: string;
};

const SEVERITY_PIN_COLORS: Record<PinSeverity, string> = {
  low: colors.success,
  medium: colors.warning,
  high: '#D9933D',
  critical: colors.danger,
};

function clamp01(value: number): number {
  return Math.max(0.05, Math.min(0.95, value));
}

function hashUnitId(unitId: string): number {
  let hash = 0;
  for (let i = 0; i < unitId.length; i += 1) {
    hash = (hash * 31 + unitId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function resolveUnitSeverity(unit: ContainerUnit): PinSeverity {
  if (unit.status === 'overflowing' || unit.overflowRisk === 'critical') {
    return 'critical';
  }
  if (unit.status === 'needs_collection' || unit.overflowRisk === 'high') {
    return 'high';
  }
  if (unit.status === 'needs_maintenance' || unit.maintenanceNeed >= 65) {
    return unit.maintenanceNeed >= 75 ? 'high' : 'medium';
  }
  return 'low';
}

function resolveUnitStatusLabel(unit: ContainerUnit): string {
  if (unit.status === 'overflowing') {
    return 'Taşma Riski';
  }
  if (unit.status === 'needs_collection') {
    return 'Toplama Gerekli';
  }
  if (unit.status === 'needs_maintenance') {
    return 'Bakım Gerekli';
  }
  if (unit.status === 'disabled') {
    return 'Devre Dışı';
  }
  if (unit.fillRate >= 70) {
    return 'Doluluk Artıyor';
  }
  return 'Dengeli';
}

function fallbackUnitPosition(
  unit: ContainerUnit,
  index: number,
): { x: number; y: number } {
  const region = getCityDistrictRegion(unit.neighborhoodId as MapDistrictId);
  const cx = region?.label.x ?? 0.5;
  const cy = region?.label.y ?? 0.5;
  const hash = hashUnitId(unit.id);
  const angle = ((hash % 360) / 360) * Math.PI * 2;
  const radius = 0.035 + (index % 6) * 0.01;
  return {
    x: clamp01(cx + Math.cos(angle) * radius),
    y: clamp01(cy + Math.sin(angle) * radius),
  };
}

export function buildContainerMapPins(input: {
  containerState: ContainerState;
  neighborhoodId?: string | null;
}): MapContainerPin[] {
  const resolvedNeighborhood = normalizeContainerNeighborhoodId(
    input.neighborhoodId,
  );

  const units = resolvedNeighborhood
    ? selectContainerUnitsByNeighborhood(input.containerState, resolvedNeighborhood)
    : input.containerState.units;

  return units
    .filter((unit) => unit.status !== 'disabled')
    .map((unit, index) => {
      const fallback = fallbackUnitPosition(unit, index);
      const x =
        typeof unit.location.x === 'number' ? unit.location.x : fallback.x;
      const y =
        typeof unit.location.y === 'number' ? unit.location.y : fallback.y;
      const severity = resolveUnitSeverity(unit);
      const status = input.containerState.aggregates[unit.neighborhoodId];
      const recommendedAction = status
        ? formatContainerRecommendedAction(status.recommendedAction)
        : 'İzle';

      return {
        id: unit.id,
        neighborhoodId: unit.neighborhoodId,
        x: clamp01(x),
        y: clamp01(y),
        label: unit.location.locationLabel,
        typeLabel: CONTAINER_TYPE_LABELS[unit.type],
        statusLabel: resolveUnitStatusLabel(unit),
        severity,
        fillRate: unit.fillRate,
        odorLevel: unit.odorLevel,
        maintenanceNeed: unit.maintenanceNeed,
        condition: unit.condition,
        recommendedAction,
      };
    });
}

export function buildNeighborhoodContainerMapSignals(
  containerState: ContainerState,
): NeighborhoodContainerMapSignal[] {
  return Object.values(containerState.aggregates)
    .filter((status) => status.activeContainerCount > 0)
    .map((status) => {
      const pinCount = selectContainerUnitsByNeighborhood(
        containerState,
        status.neighborhoodId,
      ).filter((unit) => unit.status !== 'disabled').length;

      return {
        neighborhoodId: status.neighborhoodId,
        statusLabel: status.statusLabel,
        severity: mapContainerSeverityFromStatus(status),
        detail: buildHubContainerDetail(
          status.neighborhoodId,
          status.criticalContainerCount > 0
            ? `${status.criticalContainerCount} noktada taşma riski`
            : status.statusLabel === 'Dengeli'
              ? 'dengeli seyir'
              : status.statusLabel.toLowerCase(),
        ),
        pinCount,
        recommendedAction: formatContainerRecommendedAction(
          status.recommendedAction,
        ),
      };
    });
}

export function containerMapPinToMapPin(
  pin: MapContainerPin,
  mapDistrictId?: MapDistrictId,
): MapPin {
  return {
    id: `container-${pin.id}`,
    type: 'container',
    label: pin.label,
    x: pin.x,
    y: pin.y,
    color: SEVERITY_PIN_COLORS[pin.severity],
    icon: 'trash',
    severity: pin.severity,
    value: `%${Math.round(pin.fillRate)}`,
    mapDistrictId: mapDistrictId ?? (pin.neighborhoodId as MapDistrictId),
  };
}

export function buildContainerPanelItems(
  pins: MapContainerPin[],
): MapContainerPanelItem[] {
  return [...pins]
    .sort((a, b) => {
      const order: Record<PinSeverity, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      };
      return order[b.severity] - order[a.severity];
    })
    .map((pin) => ({
      id: pin.id,
      label: pin.label,
      district: toDisplayContainerNeighborhoodName(pin.neighborhoodId),
      fillPercentage: Math.round(pin.fillRate),
      statusLabel: pin.statusLabel,
      severity: pin.severity,
      metricsLine: `Doluluk %${Math.round(pin.fillRate)} · Koku %${Math.round(pin.odorLevel)}`,
      recommendedAction: pin.recommendedAction,
    }));
}

export function buildContainerSummaryFromPins(
  pins: MapContainerPin[],
): ContainerSummary {
  if (pins.length === 0) {
    return {
      averageFill: 0,
      empty: 0,
      normal: 0,
      full: 0,
      critical: 0,
      delayedCollection: 0,
    };
  }

  let empty = 0;
  let normal = 0;
  let full = 0;
  let critical = 0;
  let delayed = 0;
  let fillSum = 0;

  for (const pin of pins) {
    fillSum += pin.fillRate;
    if (pin.severity === 'critical') {
      critical += 1;
      delayed += 1;
    } else if (pin.severity === 'high') {
      full += 1;
      delayed += 1;
    } else if (pin.severity === 'medium') {
      normal += 1;
    } else {
      empty += 1;
    }
  }

  return {
    averageFill: Math.round(fillSum / pins.length),
    empty,
    normal,
    full,
    critical,
    delayedCollection: delayed,
  };
}

export function getContainerSignalTone(severity: PinSeverity): string {
  return getContainerSeverityTone(
    severity === 'critical'
      ? 'critical'
      : severity === 'high'
        ? 'high'
        : severity === 'medium'
          ? 'medium'
          : 'low',
  ).iconColor;
}
