import { MAP_DISTRICT_IDS } from '@/features/map/data/mapDistrictConstants';

import { ALL_MAP_PRESENCE_ANCHORS, MAP_PRESENCE_ANCHORS_BY_DISTRICT } from './mapPresenceAnchors';
import type { MapPresenceViewModel } from './mapPresenceTypes';

const FORBIDDEN_WORDS = [
  'premium',
  'satın al',
  'paywall',
  'kilitli',
  'kriz başladı',
  'felaket',
  'skandal',
  'gps',
  'gerçek zamanlı',
] as const;

export function validateMapPresenceAnchors(): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const districtId of MAP_DISTRICT_IDS) {
    const anchors = MAP_PRESENCE_ANCHORS_BY_DISTRICT[districtId];
    const containers = anchors.filter((a) => a.kind === 'container');
    if (containers.length < 3) {
      errors.push(`${districtId}: container anchor < 3`);
    }
    for (const kind of [
      'vehicle_access',
      'team_station',
      'social_hotspot',
      'crisis_point',
      'district_center',
    ] as const) {
      if (!anchors.some((a) => a.kind === kind)) {
        errors.push(`${districtId}: missing ${kind}`);
      }
    }
    for (const anchor of anchors) {
      if (ids.has(anchor.id)) errors.push(`duplicate anchor id ${anchor.id}`);
      ids.add(anchor.id);
      if (anchor.x < 0.05 || anchor.x > 0.95 || anchor.y < 0.05 || anchor.y > 0.95) {
        errors.push(`${anchor.id}: coords out of range`);
      }
    }
  }

  return errors;
}

export function validateMapPresenceCoordinates(model: MapPresenceViewModel): string[] {
  const errors: string[] = [];
  const all = [
    ...model.containerMarkers,
    ...model.vehicleMarkers,
    ...model.teamMarkers,
  ];
  for (const marker of all) {
    if (marker.x < 0.05 || marker.x > 0.95 || marker.y < 0.05 || marker.y > 0.95) {
      errors.push(`${marker.id}: marker coords out of range`);
    }
  }
  for (const hint of model.routeHints) {
    if (hint.toX < 0.05 || hint.toX > 0.95 || hint.toY < 0.05 || hint.toY > 0.95) {
      errors.push(`${hint.id}: route coords out of range`);
    }
  }
  return errors;
}

export function validateMapPresenceMarkerCaps(model: MapPresenceViewModel): string[] {
  const errors: string[] = [];
  if (model.containerMarkers.length > 5) errors.push('container cap exceeded');
  if (model.vehicleMarkers.length > 3) errors.push('vehicle cap exceeded');
  if (model.teamMarkers.length > 3) errors.push('team cap exceeded');
  if (model.routeHints.length > 1) errors.push('route hint cap exceeded');
  const total =
    model.containerMarkers.length +
    model.vehicleMarkers.length +
    model.teamMarkers.length +
    model.routeHints.length;
  if (total > 9) errors.push('total marker cap exceeded');
  return errors;
}

export function validateMapPresenceDayVisibility(
  model: MapPresenceViewModel,
  day: number,
): string[] {
  const errors: string[] = [];
  const total =
    model.containerMarkers.length +
    model.vehicleMarkers.length +
    model.teamMarkers.length;
  if (day === 1 && total > 1) errors.push('day1 too many markers');
  if (day === 2 && total > 3) errors.push('day2 too many markers');
  if (day === 7 && total > 5) errors.push('day7 not compact');
  return errors;
}

export function validateMapPresenceCrisisPriority(
  model: MapPresenceViewModel,
  crisisState?: { active?: boolean } | null,
): string[] {
  const errors: string[] = [];
  if (crisisState?.active) {
    const total =
      model.containerMarkers.length + model.vehicleMarkers.length + model.teamMarkers.length;
    if (total > 4) errors.push('crisis active but too many presence markers');
  }
  return errors;
}

export function validateMapPresenceNoForbiddenWords(lines: string[]): string[] {
  const errors: string[] = [];
  const blob = lines.join(' ').toLowerCase();
  for (const word of FORBIDDEN_WORDS) {
    if (blob.includes(word)) errors.push(`forbidden word: ${word}`);
  }
  return errors;
}

export function validateMapPresenceViewModel(model: MapPresenceViewModel): string[] {
  return [
    ...validateMapPresenceCoordinates(model),
    ...validateMapPresenceMarkerCaps(model),
    ...validateMapPresenceDayVisibility(model, model.day),
    ...validateMapPresenceNoForbiddenWords(model.panelLines),
  ];
}

export function validateMapPresenceAnchorRegistry(): boolean {
  return validateMapPresenceAnchors().length === 0 && ALL_MAP_PRESENCE_ANCHORS.length > 0;
}
