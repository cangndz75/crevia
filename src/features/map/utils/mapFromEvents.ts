import type { EventCard } from '@/core/models/EventCard';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import { colors } from '@/ui/theme/colors';

import { getRegionByDistrict } from '../data/mapGeometry';
import {
  getCrews,
  getContainers,
  getDayEvent,
  getPinsForFilter,
  getVehicles,
} from '../data/mapSelectors';
import type {
  ActiveLayers,
  Container,
  Crew,
  MapFilterId,
  MapPin,
  MapPinType,
  PinSeverity,
  PilotAreaId,
  Vehicle,
} from '../types/map';

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function severityFromRisk(risk: EventCard['riskLevel']): PinSeverity {
  if (risk === 'critical') return 'critical';
  if (risk === 'high') return 'high';
  if (risk === 'medium') return 'medium';
  return 'low';
}

function pinTypeFromEvent(event: EventCard): MapPinType {
  const t = event.eventType;
  if (t === 'social_media' || t === 'citizen_complaint' || t === 'noise') {
    return 'social';
  }
  if (t === 'opportunity' || t === 'permanent_solution') return 'opportunity';
  if (t === 'butterfly') return 'risk';
  if (t === 'vehicle' || t === 'staff') return 'crew';
  if (t === 'waste' || t === 'market') return 'event';
  return 'event';
}

function colorForPinType(type: MapPinType, severity: PinSeverity): string {
  if (type === 'container') {
    switch (severity) {
      case 'critical':
      case 'high':
        return colors.danger;
      case 'medium':
        return colors.warning;
      default:
        return colors.success;
    }
  }
  if (type === 'risk' || severity === 'critical' || severity === 'high') {
    return colors.danger;
  }
  if (type === 'social' || severity === 'medium') return colors.warning;
  if (type === 'crew') return colors.purple;
  if (type === 'vehicle') return colors.secondary;
  if (type === 'opportunity') return colors.hubGold;
  return colors.primary;
}

/** Olayları seçili bölge polygon label merkezi etrafında konumlandır */
export function eventsToMapPins(
  events: EventCard[],
  districtId: PilotDistrictId,
): MapPin[] {
  const region = getRegionByDistrict(districtId);
  if (!region || events.length === 0) return [];

  const { x: cx, y: cy } = region.label;
  const vbW = 360;
  const vbH = 260;

  return events.map((event, index) => {
    const h = hashId(event.id);
    const angle = (index / Math.max(events.length, 1)) * Math.PI * 2 + (h % 7) * 0.4;
    const radius = 14 + (h % 22);
    const sx = cx + Math.cos(angle) * radius;
    const sy = cy + Math.sin(angle) * radius * 0.75;
    const severity = severityFromRisk(event.riskLevel);
    const type = pinTypeFromEvent(event);

    return {
      id: event.id,
      type,
      label: event.title,
      x: sx / vbW,
      y: sy / vbH,
      color: colorForPinType(type, severity),
      icon: 'alert-circle',
      severity,
      regionId: districtId,
    };
  });
}

function crewToPins(crews: Crew[], districtId: PilotDistrictId): MapPin[] {
  const region = getRegionByDistrict(districtId);
  if (!region) return [];

  const { x: cx, y: cy } = region.label;
  const vbW = 360;
  const vbH = 260;

  return crews.map((crew, i) => {
    const h = hashId(crew.id);
    const angle = i * 1.8 + 0.3;
    const r = 18 + (h % 12);
    return {
      id: `crew-${crew.id}`,
      type: 'crew' as const,
      label: crew.name,
      x: (cx + Math.cos(angle) * r) / vbW,
      y: (cy + Math.sin(angle) * r * 0.8) / vbH,
      color: colors.purple,
      icon: 'people',
      severity: 'medium' as const,
      regionId: districtId,
    };
  });
}

function vehicleToPins(vehicles: Vehicle[], districtId: PilotDistrictId): MapPin[] {
  const region = getRegionByDistrict(districtId);
  if (!region) return [];

  const { x: cx, y: cy } = region.label;
  const vbW = 360;
  const vbH = 260;

  return vehicles.map((v, i) => {
    const angle = i * 2.1 + 0.5;
    const r = 22 + i * 8;
    const severity: PinSeverity =
      v.status === 'maintenance' || v.status === 'broken' ? 'high' : 'medium';
    return {
      id: `veh-${v.id}`,
      type: 'vehicle' as const,
      label: v.name,
      x: (cx + Math.cos(angle) * r) / vbW,
      y: (cy + Math.sin(angle) * r * 0.7) / vbH,
      color: v.status === 'maintenance' ? colors.warning : colors.secondary,
      icon: 'car',
      severity,
      regionId: districtId,
    };
  });
}

function containerToPins(
  containers: Container[],
  districtId: PilotDistrictId,
): MapPin[] {
  const region = getRegionByDistrict(districtId);
  if (!region) return [];

  const { x: cx, y: cy } = region.label;
  const vbW = 360;
  const vbH = 260;

  return containers.map((c, i) => {
    const angle = i * 1.4 + 1;
    const r = 16 + i * 10;
    let severity: PinSeverity = 'low';
    if (c.status === 'critical') severity = 'critical';
    else if (c.status === 'full') severity = 'medium';
    else if (c.status === 'normal') severity = 'medium';

    const color =
      c.fillPercentage >= 95
        ? colors.danger
        : c.fillPercentage >= 75
          ? colors.warning
          : c.fillPercentage >= 25
            ? colors.hubGold
            : colors.success;

    return {
      id: `cnt-${c.id}`,
      type: 'container' as const,
      label: `%${c.fillPercentage}`,
      x: (cx + Math.cos(angle) * r) / vbW,
      y: (cy + Math.sin(angle) * r * 0.85) / vbH,
      color,
      icon: 'trash',
      severity,
      value: String(c.fillPercentage),
      regionId: districtId,
    };
  });
}

export type MapDisplayPinsInput = {
  pilotAreaId: PilotAreaId;
  selectedDistrictId: PilotDistrictId;
  selectedFilter: MapFilterId;
  activeLayers: ActiveLayers;
  gameDay: number;
  activeEvents: EventCard[];
};

/**
 * Filtre + katmanlara göre birleşik pin listesi.
 * Olaylar store'dan; ekip/araç/konteyner preset + store hibrit.
 */
export function buildMapPins(input: MapDisplayPinsInput): MapPin[] {
  const {
    pilotAreaId,
    selectedDistrictId,
    selectedFilter,
    activeLayers,
    gameDay,
    activeEvents,
  } = input;

  const eventPins = eventsToMapPins(activeEvents, selectedDistrictId);
  const presetPins = getPinsForFilter(
    pilotAreaId,
    selectedFilter,
    gameDay,
    selectedDistrictId,
  );

  const dayEvent = getDayEvent(pilotAreaId, gameDay);
  const pinScale = dayEvent.pinMultiplier;

  function scalePreset(pins: MapPin[]): MapPin[] {
    if (pinScale >= 1) return pins;
    const n = Math.max(1, Math.round(pins.length * pinScale));
    return pins.slice(0, n);
  }

  switch (selectedFilter) {
    case 'events': {
      const base = eventPins.length > 0 ? eventPins : scalePreset(presetPins);
      if (activeLayers.complaints) {
        const social = scalePreset(
          presetPins.filter((p) => p.type === 'event' || p.type === 'social'),
        );
        return mergePins(base, social);
      }
      return base;
    }
    case 'risk': {
      const riskPins = scalePreset(presetPins.filter((p) => p.type === 'risk'));
      const fromEvents = eventPins.filter(
        (p) => p.severity === 'high' || p.severity === 'critical',
      );
      return mergePins(
        fromEvents.length > 0 ? fromEvents : riskPins,
        activeLayers.risk ? riskPins : [],
      );
    }
    case 'crews':
      return mergePins(
        crewToPins(getCrews(pilotAreaId), selectedDistrictId),
        scalePreset(presetPins.filter((p) => p.type === 'crew')),
      );
    case 'vehicles':
      return mergePins(
        vehicleToPins(getVehicles(pilotAreaId), selectedDistrictId),
        scalePreset(presetPins.filter((p) => p.type === 'vehicle')),
      );
    case 'containers':
      return mergePins(
        containerToPins(getContainers(pilotAreaId), selectedDistrictId),
        activeLayers.waste
          ? scalePreset(presetPins.filter((p) => p.type === 'container'))
          : [],
      );
    default:
      return eventPins;
  }
}

function mergePins(primary: MapPin[], extra: MapPin[]): MapPin[] {
  const ids = new Set(primary.map((p) => p.id));
  const merged = [...primary];
  for (const p of extra) {
    if (!ids.has(p.id)) merged.push(p);
  }
  return merged;
}

export function shouldShowHeatmap(
  filter: MapFilterId,
  layers: ActiveLayers,
): boolean {
  return filter === 'risk' || layers.risk;
}

export function shouldShowRoutes(
  filter: MapFilterId,
  layers: ActiveLayers,
): boolean {
  return filter === 'crews' || layers.routes;
}

export function shouldShowGreenPatches(layers: ActiveLayers): boolean {
  return layers.greenAreas;
}
