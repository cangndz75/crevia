import type { ActiveOperationMapBinding } from '@/core/activeOperationMapBinding/activeOperationMapBindingTypes';
import type { MapReactionLiteModel } from '@/core/mapReactions/mapReactionTypes';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { PostDecisionCityReactionPresentation } from '@/features/events/utils/postDecisionCityReactionPresentation';
import { buildPostDecisionCityReactionFromRecord } from '@/features/events/utils/postDecisionCityReactionPresentation';

import type { CreviaMapDistrictId } from '../types/creviaMapTypes';
import type {
  MapGameplayLayer,
  MapGameplayMarker,
  MapGameplayMarkerSeverity,
  MapGameplayMarkerType,
} from './mapGameplayPresentation';
import { normalizeMapMotionDistrictId } from './mapMotionPresentation';

export type MapTacticalRouteTone =
  | 'active'
  | 'warning'
  | 'completed'
  | 'critical'
  | 'neutral';

export type MapTacticalMarkerMotionKind =
  | 'none'
  | 'softPulse'
  | 'riskPulse'
  | 'selected'
  | 'completedEcho';

export type MapTacticalTone = 'positive' | 'mixed' | 'warning' | 'critical' | 'neutral';

export type MapTacticalRoutePresentation = {
  id: string;
  fromLabel: string;
  toLabel: string;
  districtId?: CreviaMapDistrictId;
  eventId?: string;
  points: Array<{ x: number; y: number }>;
  tone: MapTacticalRouteTone;
  label: string;
  animate: boolean;
};

export type MapTacticalMarkerMotion = {
  markerId: string;
  motion: MapTacticalMarkerMotionKind;
  priority: number;
  tone: MapTacticalTone;
  passive?: boolean;
};

export type MapDistrictReactionHighlight = {
  districtId: CreviaMapDistrictId;
  tone: MapTacticalTone;
  label: string;
  intensity: 'low' | 'medium' | 'high';
  coordinate: { x: number; y: number };
};

export type MapLayerHintPresentation = {
  layerId: string;
  label: string;
  count: number;
  tone: MapTacticalTone;
};

export type MapTacticalMotionPresentation = {
  activeRoute?: MapTacticalRoutePresentation;
  markerMotions: MapTacticalMarkerMotion[];
  districtHighlight?: MapDistrictReactionHighlight;
  layerHints: MapLayerHintPresentation[];
  tacticalMicroLine?: string;
  reducedMotion: boolean;
};

export type BuildMapTacticalMotionInput = {
  day: number;
  reducedMotion?: boolean;
  markers: readonly MapGameplayMarker[];
  layers?: readonly MapGameplayLayer[];
  selectedMarkerId?: string | null;
  activeOperationBinding?: ActiveOperationMapBinding | null;
  mapReactionLiteModel?: MapReactionLiteModel | null;
  recentDecisionRecord?: DecisionRecord | null;
  focusDistrictId?: CreviaMapDistrictId;
};

export const MAP_TACTICAL_MAX_ANIMATED = 5;
export const MAP_TACTICAL_MAX_PULSE = 3;
export const MAP_TACTICAL_MAX_CRITICAL_PULSE = 1;

const HUB_COORDINATE = { x: 52, y: 44 };

const DISTRICT_COORDINATES: Record<CreviaMapDistrictId, { x: number; y: number }> = {
  merkez: { x: 52, y: 44 },
  cumhuriyet: { x: 36, y: 58 },
  sanayi: { x: 64, y: 63 },
  yesilvadi: { x: 28, y: 52 },
  istasyon: { x: 72, y: 28 },
};

const LAYER_MARKER_TYPES: Record<string, readonly MapGameplayMarkerType[]> = {
  events: ['active_event', 'urgent_signal', 'resolved', 'opportunity'],
  risk: ['active_event', 'urgent_signal'],
  opportunity: ['opportunity'],
  crew: ['district', 'resource', 'operation'],
  route: ['active_event', 'operation', 'district'],
};

function districtCoordFromMarker(marker: MapGameplayMarker): { x: number; y: number } {
  return marker.coordinate;
}

function resolveDistrictIdFromMarker(marker: MapGameplayMarker): CreviaMapDistrictId | undefined {
  const name = marker.districtName?.trim().toLowerCase() ?? '';
  if (name.includes('merkez')) return 'merkez';
  if (name.includes('cumhuriyet')) return 'cumhuriyet';
  if (name.includes('sanayi')) return 'sanayi';
  if (name.includes('yesil') || name.includes('yeşil')) return 'yesilvadi';
  if (name.includes('istasyon') || name.includes('güneş') || name.includes('gunes')) {
    return name.includes('istasyon') ? 'istasyon' : 'yesilvadi';
  }
  return undefined;
}

function resolveDistrictCoordinate(districtId?: CreviaMapDistrictId): { x: number; y: number } | null {
  if (!districtId) return null;
  return DISTRICT_COORDINATES[districtId] ?? null;
}

function mapReactionToneToTactical(
  tone: string | undefined,
): MapTacticalTone {
  switch (tone) {
    case 'positive':
    case 'recovery':
      return 'positive';
    case 'watch':
    case 'risk':
      return 'warning';
    case 'operation':
      return 'mixed';
    default:
      return 'neutral';
  }
}

function mapCityReactionTone(tone: PostDecisionCityReactionPresentation['tone']): MapTacticalTone {
  return tone;
}

function resolveRouteTone(
  binding: ActiveOperationMapBinding | null | undefined,
  marker?: MapGameplayMarker,
): MapTacticalRouteTone {
  if (binding?.phase === 'completed' || binding?.phase === 'result_trace_available') {
    return 'completed';
  }
  if (marker?.severity === 'critical' || binding?.confidence === 'high') {
    return 'critical';
  }
  if (marker?.severity === 'high' || marker?.type === 'urgent_signal') {
    return 'warning';
  }
  if (
    binding?.phase === 'field_active' ||
    binding?.phase === 'dispatching' ||
    binding?.phase === 'field_paused'
  ) {
    return 'active';
  }
  return 'neutral';
}

function resolveRouteLabel(
  tone: MapTacticalRouteTone,
  binding: ActiveOperationMapBinding | null | undefined,
): string {
  if (tone === 'completed') return 'Tamamlandı';
  if (binding?.phase === 'dispatching' || binding?.phase === 'field_active') {
    return 'Ekip yolda';
  }
  if (tone === 'critical' || tone === 'warning') return 'Müdahale hattı';
  if (binding?.phase === 'result_trace_available') return 'Son etki rotası';
  return 'Aktif operasyon';
}

function markerMatchesBinding(
  marker: MapGameplayMarker,
  binding: ActiveOperationMapBinding | null | undefined,
): boolean {
  if (!binding?.eventId) return false;
  return marker.eventId === binding.eventId;
}

function markerMatchesDecision(
  marker: MapGameplayMarker,
  record: DecisionRecord | null | undefined,
): boolean {
  if (!record) return false;
  if (marker.eventId && marker.eventId === record.eventId) return true;
  if (marker.id.includes(record.eventId)) return true;
  const markerDistrict = marker.districtName?.trim().toLocaleLowerCase('tr-TR');
  const recordDistrict = (record.neighborhoodName ?? record.neighborhoodId)
    ?.trim()
    .toLocaleLowerCase('tr-TR');
  return Boolean(markerDistrict && recordDistrict && markerDistrict.includes(recordDistrict));
}

function isPulseMotion(motion: MapTacticalMarkerMotionKind): boolean {
  return motion === 'softPulse' || motion === 'riskPulse';
}

function severityPriority(severity: MapGameplayMarkerSeverity): number {
  switch (severity) {
    case 'critical':
      return 100;
    case 'high':
      return 80;
    case 'medium':
      return 50;
    default:
      return 20;
  }
}

export function buildActiveOperationRoutePresentation(
  input: Pick<
    BuildMapTacticalMotionInput,
    'day' | 'reducedMotion' | 'markers' | 'activeOperationBinding' | 'selectedMarkerId'
  >,
): MapTacticalRoutePresentation | undefined {
  if (input.day <= 1) return undefined;

  const binding = input.activeOperationBinding;
  const targetMarker =
    input.markers.find((marker) => marker.id === input.selectedMarkerId) ??
    input.markers.find((marker) => marker.type === 'active_event') ??
    input.markers.find((marker) => markerMatchesBinding(marker, binding));

  if (!targetMarker) return undefined;
  if (targetMarker.type === 'district' || targetMarker.type === 'resource') return undefined;

  const hub = input.markers.find((marker) => marker.type === 'district' || marker.id.includes('merkez'));
  const from = hub?.coordinate ?? HUB_COORDINATE;
  const to = targetMarker.coordinate;

  const samePoint = Math.abs(from.x - to.x) < 1 && Math.abs(from.y - to.y) < 1;
  if (samePoint) return undefined;

  const hasOperationContext =
    binding &&
    binding.visibilityLevel !== 'hidden' &&
    binding.phase !== 'before_inspect';
  const isCompleted =
    binding?.phase === 'completed' ||
    binding?.phase === 'result_trace_available' ||
    targetMarker.status === 'resolved' ||
    targetMarker.type === 'resolved';

  if (!hasOperationContext && !isCompleted) return undefined;
  if (!binding?.canShowRouteHint && !isCompleted && input.day < 2) return undefined;

  const tone = resolveRouteTone(binding, targetMarker);
  const mid = {
    x: from.x + (to.x - from.x) * 0.55,
    y: from.y + (to.y - from.y) * 0.42,
  };

  return {
    id: `route-${binding?.eventId ?? targetMarker.id}`,
    fromLabel: hub?.districtName ?? 'Merkez',
    toLabel: targetMarker.districtName ?? targetMarker.title,
    districtId: resolveDistrictIdFromMarker(targetMarker),
    eventId: targetMarker.eventId ?? binding?.eventId,
    points: [from, mid, to],
    tone,
    label: resolveRouteLabel(tone, binding),
    animate: !input.reducedMotion && tone !== 'completed',
  };
}

function draftMarkerMotion(
  marker: MapGameplayMarker,
  input: BuildMapTacticalMotionInput,
): { motion: MapTacticalMarkerMotionKind; priority: number; tone: MapTacticalTone } {
  const isSelected = marker.id === input.selectedMarkerId;
  const bindingMatch = markerMatchesBinding(marker, input.activeOperationBinding);
  const decisionMatch = markerMatchesDecision(marker, input.recentDecisionRecord);
  const isResolved =
    marker.type === 'resolved' ||
    marker.status === 'resolved' ||
    input.activeOperationBinding?.phase === 'completed' ||
    input.activeOperationBinding?.phase === 'result_trace_available';

  if (isSelected) {
    return { motion: 'selected', priority: 120, tone: 'neutral' };
  }

  if (isResolved && (decisionMatch || bindingMatch)) {
    return { motion: 'completedEcho', priority: 70, tone: 'positive' };
  }

  if (isResolved) {
    return { motion: 'none', priority: 10, tone: 'neutral' };
  }

  if (marker.severity === 'critical' && marker.status === 'active') {
    return { motion: 'riskPulse', priority: 105, tone: 'critical' };
  }

  if (bindingMatch && input.activeOperationBinding?.phase === 'field_active') {
    return { motion: 'softPulse', priority: 95, tone: 'mixed' };
  }

  if (marker.type === 'active_event' && marker.pulse) {
    return { motion: 'softPulse', priority: 88, tone: 'warning' };
  }

  if (marker.type === 'urgent_signal') {
    return { motion: 'riskPulse', priority: 82, tone: 'warning' };
  }

  if (decisionMatch && input.day >= 2) {
    return { motion: 'completedEcho', priority: 62, tone: 'mixed' };
  }

  if (marker.type === 'opportunity') {
    return { motion: 'none', priority: 40, tone: 'positive' };
  }

  return { motion: 'none', priority: severityPriority(marker.severity), tone: 'neutral' };
}

export function buildMapMarkerMotionPresentation(
  input: BuildMapTacticalMotionInput,
): MapTacticalMarkerMotion[] {
  const reducedMotion = input.reducedMotion === true;
  const dayPolicyMuted = input.day <= 1;

  const drafts = input.markers.map((marker) => {
    const draft = draftMarkerMotion(marker, input);
    return {
      markerId: marker.id,
      ...draft,
      passive: false,
    } satisfies MapTacticalMarkerMotion;
  });

  const sorted = [...drafts].sort((a, b) => b.priority - a.priority || a.markerId.localeCompare(b.markerId));

  let animatedCount = 0;
  let pulseCount = 0;
  let criticalPulseCount = 0;

  const emphasizedLayerId =
    input.layers?.find((layer) => layer.isActive)?.id ?? 'events';

  return sorted.map((item) => {
    let motion = item.motion;
    let passive: boolean = item.passive ?? false;

    const layerTypes = LAYER_MARKER_TYPES[emphasizedLayerId] ?? LAYER_MARKER_TYPES.events!;
    const marker = input.markers.find((entry) => entry.id === item.markerId);
    const inLayer =
      marker &&
      (layerTypes.includes(marker.type) ||
        (emphasizedLayerId === 'risk' &&
          (marker.severity === 'high' || marker.severity === 'critical')));

    if (!inLayer && marker && marker.type !== 'district') {
      passive = true;
      if (motion === 'softPulse' || motion === 'riskPulse') {
        motion = 'none';
      }
    }

    if (dayPolicyMuted && motion !== 'selected') {
      motion = 'none';
    }

    if (reducedMotion) {
      if (motion === 'softPulse' || motion === 'riskPulse') {
        motion = 'none';
      }
      return { ...item, motion, passive };
    }

    if (motion === 'selected') {
      animatedCount += 1;
      return { ...item, motion, passive };
    }

    if (motion === 'completedEcho') {
      if (animatedCount < MAP_TACTICAL_MAX_ANIMATED) {
        animatedCount += 1;
      }
      return { ...item, motion, passive };
    }

    if (!isPulseMotion(motion)) {
      return { ...item, motion, passive };
    }

    if (pulseCount >= MAP_TACTICAL_MAX_PULSE || animatedCount >= MAP_TACTICAL_MAX_ANIMATED) {
      return { ...item, motion: 'none', passive };
    }

    if (motion === 'riskPulse' && item.tone === 'critical') {
      if (criticalPulseCount >= MAP_TACTICAL_MAX_CRITICAL_PULSE) {
        return { ...item, motion: 'none', passive };
      }
      criticalPulseCount += 1;
    }

    pulseCount += 1;
    animatedCount += 1;
    return { ...item, motion, passive };
  });
}

export function buildDistrictReactionHighlightPresentation(
  input: Pick<
    BuildMapTacticalMotionInput,
    'day' | 'mapReactionLiteModel' | 'recentDecisionRecord' | 'focusDistrictId' | 'selectedMarkerId' | 'markers'
  >,
): MapDistrictReactionHighlight | undefined {
  if (input.day <= 1) return undefined;

  const reaction = input.mapReactionLiteModel?.selectedDistrictReaction;
  const postDecision =
    input.recentDecisionRecord &&
    buildPostDecisionCityReactionFromRecord({ record: input.recentDecisionRecord });

  let districtId =
    normalizeMapMotionDistrictId(reaction?.districtId ?? postDecision?.districtId) ??
    input.focusDistrictId;
  let tone: MapTacticalTone = 'neutral';
  let label = 'Etki işaretlendi';
  let intensity: MapDistrictReactionHighlight['intensity'] = 'low';

  if (reaction) {
    tone = mapReactionToneToTactical(reaction.tone);
    label =
      reaction.shortLine?.trim() ||
      reaction.label?.trim() ||
      label;
    intensity = reaction.intensity ?? 'medium';
    districtId = normalizeMapMotionDistrictId(reaction.districtId) ?? districtId;
  } else if (postDecision) {
    tone = mapCityReactionTone(postDecision.tone);
    label = postDecision.mapReaction?.trim() || postDecision.headline?.trim() || label;
    intensity = tone === 'critical' ? 'high' : tone === 'warning' ? 'medium' : 'low';
    districtId = normalizeMapMotionDistrictId(postDecision.districtId) ?? districtId;
  } else {
    return undefined;
  }

  if (!districtId) return undefined;

  const selectedMarker = input.markers.find((marker) => marker.id === input.selectedMarkerId);
  const selectedDistrict = selectedMarker
    ? resolveDistrictIdFromMarker(selectedMarker)
    : undefined;
  if (selectedDistrict && selectedDistrict === districtId) {
    intensity = intensity === 'high' ? 'high' : 'medium';
  }

  const coordinate =
    resolveDistrictCoordinate(districtId) ??
    (selectedMarker && selectedDistrict === districtId
      ? districtCoordFromMarker(selectedMarker)
      : null);
  if (!coordinate) return undefined;

  if (tone === 'neutral' && intensity === 'low' && input.day < 8) {
    return undefined;
  }

  return {
    districtId,
    tone,
    label,
    intensity,
    coordinate,
  };
}

function countMarkersForLayer(
  markers: readonly MapGameplayMarker[],
  layerId: string,
): number {
  const types = LAYER_MARKER_TYPES[layerId];
  if (!types) return 0;
  return markers.filter((marker) => {
    if (types.includes(marker.type)) return true;
    if (layerId === 'risk') {
      return marker.severity === 'high' || marker.severity === 'critical';
    }
    return false;
  }).length;
}

function layerTone(layerId: string, count: number): MapTacticalTone {
  if (count === 0) return 'neutral';
  if (layerId === 'risk') return count >= 2 ? 'warning' : 'mixed';
  if (layerId === 'opportunity') return 'positive';
  return 'neutral';
}

function layerHintLabel(layerId: string, count: number): string {
  switch (layerId) {
    case 'risk':
      return `Risk · ${count} sinyal`;
    case 'crew':
      return `Ekipler · ${count} aktif`;
    case 'route':
      return `Rota · ${count} hat`;
    case 'opportunity':
      return `Fırsat · ${count} nokta`;
    default:
      return `Olaylar · ${count} sinyal`;
  }
}

export function buildMapLayerPriorityPresentation(
  input: Pick<BuildMapTacticalMotionInput, 'markers' | 'layers'>,
): MapLayerHintPresentation[] {
  const layers = input.layers ?? [];
  const activeLayers = layers.filter((layer) => layer.isActive);
  const source = activeLayers.length > 0 ? activeLayers : layers.slice(0, 1);

  return source.slice(0, 2).map((layer) => {
    const count = countMarkersForLayer(input.markers, layer.id);
    return {
      layerId: layer.id,
      label: layerHintLabel(layer.id, count),
      count,
      tone: layerTone(layer.id, count),
    };
  });
}

function resolveTacticalMicroLine(
  route: MapTacticalRoutePresentation | undefined,
  highlight: MapDistrictReactionHighlight | undefined,
  binding: ActiveOperationMapBinding | null | undefined,
): string | undefined {
  if (route?.tone === 'active' || route?.tone === 'warning') {
    return `Rota aktif · ${route.label}`;
  }
  if (route?.tone === 'completed') {
    return 'Etki haritada işaretlendi';
  }
  if (highlight && highlight.tone !== 'neutral') {
    return highlight.label.length <= 42 ? highlight.label : 'Risk noktası izleniyor';
  }
  if (binding?.phase === 'field_active' || binding?.phase === 'dispatching') {
    return 'Ekip yolda';
  }
  return undefined;
}

export function buildMapTacticalMotionPresentation(
  input: BuildMapTacticalMotionInput,
): MapTacticalMotionPresentation {
  const reducedMotion = input.reducedMotion === true;
  const activeRoute = buildActiveOperationRoutePresentation(input);
  const markerMotions = buildMapMarkerMotionPresentation(input);
  const districtHighlight = buildDistrictReactionHighlightPresentation(input);
  const layerHints = buildMapLayerPriorityPresentation(input);
  const tacticalMicroLine = resolveTacticalMicroLine(
    activeRoute,
    districtHighlight,
    input.activeOperationBinding ?? null,
  );

  return {
    activeRoute,
    markerMotions,
    districtHighlight,
    layerHints,
    tacticalMicroLine,
    reducedMotion,
  };
}

export function getMarkerTacticalMotion(
  presentation: MapTacticalMotionPresentation | null | undefined,
  markerId: string,
): MapTacticalMarkerMotion | undefined {
  return presentation?.markerMotions.find((motion) => motion.markerId === markerId);
}

export function applyTacticalMotionToMarkers(
  markers: readonly MapGameplayMarker[],
  presentation: MapTacticalMotionPresentation | null | undefined,
): MapGameplayMarker[] {
  if (!presentation) return [...markers];

  return markers.map((marker) => {
    const motion = getMarkerTacticalMotion(presentation, marker.id);
    if (!motion) return marker;

    const shouldPulse =
      motion.motion === 'softPulse' ||
      motion.motion === 'riskPulse' ||
      (motion.motion === 'selected' && !presentation.reducedMotion);

    return {
      ...marker,
      pulse: shouldPulse && marker.status !== 'resolved' && marker.type !== 'resolved',
    };
  });
}
