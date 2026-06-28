import type { ActiveOperationMapBinding } from '@/core/activeOperationMapBinding/activeOperationMapBindingTypes';
import { selectPressableMapDirectActions } from '@/core/mapDirectAction';
import type { BuildMapActionBundleInput } from '@/core/mapDirectAction';
import { buildMarkerMapActionBundle } from '@/core/mapDirectAction';
import { buildMarkerActionBundleInput } from '@/features/map/utils/mapDirectActionContext';

import type {
  MapGameplayMarker,
  MapGameplayMarkerType,
} from './mapGameplayPresentation';
import type { CreviaMapDistrictId } from '../types/creviaMapTypes';
import type {
  MapTacticalMarkerMotion,
  MapTacticalTone,
} from './mapTacticalMotionPresentation';
import { mapUi } from './mapUiTokens';

export type MapMarkerFeedbackState =
  | 'idle'
  | 'selected'
  | 'active'
  | 'warning'
  | 'critical'
  | 'completed'
  | 'disabled';

export type MapMarkerFeedbackTone =
  | 'positive'
  | 'mixed'
  | 'warning'
  | 'critical'
  | 'neutral'
  | 'active';

export type MapMarkerFeedbackScale = 'normal' | 'emphasized' | 'compact';

export type MapMarkerFeedbackIcon =
  | 'alert-circle'
  | 'notifications'
  | 'checkmark-circle'
  | 'sparkles'
  | 'layers'
  | 'business'
  | 'radio'
  | 'construct'
  | 'pulse';

export type MapMarkerFeedbackPresentation = {
  markerId: string;
  state: MapMarkerFeedbackState;
  tone: MapMarkerFeedbackTone;
  scale: MapMarkerFeedbackScale;
  showRing: boolean;
  showPulse: boolean;
  showLift: boolean;
  showAlertDot: boolean;
  pressable: boolean;
  label?: string;
  sourceTypeLabel?: string;
  accessibilityLabel: string;
  icon: MapMarkerFeedbackIcon;
  accentColor: string;
  backgroundColor: string;
  ringColor: string;
  size: number;
  iconSize: number;
};

export type BuildMapMarkerFeedbackInput = {
  marker: MapGameplayMarker;
  selectedMarkerId?: string | null;
  activeOperationBinding?: ActiveOperationMapBinding | null;
  tacticalMotion?: MapTacticalMarkerMotion | null;
  reducedMotion?: boolean;
  actionBundleInput?: Omit<BuildMapActionBundleInput, 'surface'> | null;
  allowCriticalAccent?: boolean;
};

const MARKER_ICON: Record<MapGameplayMarkerType, MapMarkerFeedbackIcon> = {
  active_event: 'radio',
  urgent_signal: 'notifications',
  resolved: 'checkmark-circle',
  opportunity: 'sparkles',
  resource: 'layers',
  district: 'business',
  operation: 'radio',
};

const SOURCE_TYPE_LABEL: Record<MapGameplayMarkerType, string> = {
  active_event: 'Aktif Operasyon',
  urgent_signal: 'Acil Sinyal',
  resolved: 'Operasyon Sonucu',
  opportunity: 'Fırsat Sinyali',
  resource: 'Kaynak Noktası',
  district: 'Mahalle İzleme',
  operation: 'Aktif Operasyon',
};

function markerMatchesBinding(
  marker: MapGameplayMarker,
  binding: ActiveOperationMapBinding | null | undefined,
): boolean {
  if (!binding?.eventId) return false;
  return marker.eventId === binding.eventId;
}

function isResolvedMarker(marker: MapGameplayMarker): boolean {
  return marker.type === 'resolved' || marker.status === 'resolved';
}

function isActiveOperationMarker(
  marker: MapGameplayMarker,
  binding: ActiveOperationMapBinding | null | undefined,
): boolean {
  if (marker.type === 'operation') return true;
  if (marker.type !== 'active_event') return false;
  return markerMatchesBinding(marker, binding);
}

function mapTacticalToneToFeedback(tone: MapTacticalTone | undefined): MapMarkerFeedbackTone {
  switch (tone) {
    case 'positive':
      return 'positive';
    case 'warning':
      return 'warning';
    case 'critical':
      return 'critical';
    case 'mixed':
      return 'mixed';
    case 'neutral':
    default:
      return 'neutral';
  }
}

function resolveVisualPalette(params: {
  marker: MapGameplayMarker;
  state: MapMarkerFeedbackState;
  tone: MapMarkerFeedbackTone;
  bindingMatches: boolean;
}): { accent: string; background: string; ring: string } {
  const { marker, state, tone, bindingMatches } = params;

  if (state === 'disabled') {
    return {
      accent: mapUi.textMuted,
      background: 'rgba(122, 154, 144, 0.12)',
      ring: 'rgba(122, 154, 144, 0.28)',
    };
  }

  if (state === 'completed' || isResolvedMarker(marker)) {
    return {
      accent: mapUi.teal,
      background: 'rgba(20, 184, 166, 0.12)',
      ring: 'rgba(20, 184, 166, 0.28)',
    };
  }

  if (state === 'active' || (bindingMatches && marker.type === 'active_event')) {
    return {
      accent: mapUi.gold,
      background: 'rgba(6, 78, 69, 0.88)',
      ring: 'rgba(216, 167, 46, 0.42)',
    };
  }

  if (state === 'critical' || tone === 'critical') {
    return {
      accent: '#F43F5E',
      background: 'rgba(244, 63, 94, 0.14)',
      ring: 'rgba(244, 63, 94, 0.32)',
    };
  }

  if (
    state === 'warning' ||
    tone === 'warning' ||
    marker.type === 'urgent_signal'
  ) {
    return {
      accent: mapUi.gold,
      background: 'rgba(216, 167, 46, 0.16)',
      ring: 'rgba(216, 167, 46, 0.34)',
    };
  }

  if (marker.type === 'opportunity' || tone === 'positive') {
    return {
      accent: mapUi.teal,
      background: 'rgba(20, 184, 166, 0.16)',
      ring: 'rgba(20, 184, 166, 0.3)',
    };
  }

  if (marker.type === 'district' || marker.type === 'resource') {
    return {
      accent: mapUi.teal,
      background: 'rgba(20, 184, 166, 0.14)',
      ring: 'rgba(20, 184, 166, 0.28)',
    };
  }

  return {
    accent: mapUi.teal,
    background: 'rgba(20, 184, 166, 0.16)',
    ring: 'rgba(20, 184, 166, 0.28)',
  };
}

function resolveMarkerLabel(marker: MapGameplayMarker): string | undefined {
  if (marker.traitLabel?.trim()) return marker.traitLabel.trim();
  if (marker.districtName?.trim() && marker.type === 'district') {
    return marker.districtName.trim();
  }
  return undefined;
}

function markerHasNavigableActions(
  input: Omit<BuildMapActionBundleInput, 'surface'> | null | undefined,
): boolean {
  if (!input) return true;
  const bundle = buildMarkerMapActionBundle(input);
  return selectPressableMapDirectActions(bundle).length > 0;
}

function resolveFeedbackState(params: {
  marker: MapGameplayMarker;
  isSelected: boolean;
  bindingMatches: boolean;
  binding: ActiveOperationMapBinding | null | undefined;
  tacticalMotion?: MapTacticalMarkerMotion | null;
  hasActions: boolean;
  allowCriticalAccent: boolean;
}): { state: MapMarkerFeedbackState; tone: MapMarkerFeedbackTone } {
  const {
    marker,
    isSelected,
    bindingMatches,
    binding,
    tacticalMotion,
    hasActions,
    allowCriticalAccent,
  } = params;

  if (marker.status === 'locked' || !hasActions) {
    return { state: 'disabled', tone: 'neutral' };
  }

  if (isResolvedMarker(marker)) {
    return {
      state: isSelected ? 'selected' : 'completed',
      tone: 'positive',
    };
  }

  const tacticalTone = mapTacticalToneToFeedback(tacticalMotion?.tone);

  if (isSelected) {
    if (isActiveOperationMarker(marker, binding)) {
      return { state: 'selected', tone: 'active' };
    }
    if (marker.severity === 'critical' && allowCriticalAccent) {
      return { state: 'selected', tone: 'critical' };
    }
    if (marker.type === 'urgent_signal' || tacticalTone === 'warning') {
      return { state: 'selected', tone: 'warning' };
    }
    return { state: 'selected', tone: tacticalTone };
  }

  if (isActiveOperationMarker(marker, binding) && binding?.visibilityLevel !== 'hidden') {
    return { state: 'active', tone: 'active' };
  }

  if (marker.severity === 'critical' && allowCriticalAccent && marker.status === 'active') {
    return { state: 'critical', tone: 'critical' };
  }

  if (
    marker.type === 'urgent_signal' ||
    tacticalTone === 'warning' ||
    bindingMatches && binding?.confidence === 'high'
  ) {
    return { state: 'warning', tone: 'warning' };
  }

  return { state: 'idle', tone: tacticalTone };
}

function resolveScale(state: MapMarkerFeedbackState): MapMarkerFeedbackScale {
  if (state === 'selected' || state === 'active') return 'emphasized';
  if (state === 'completed' || state === 'disabled') return 'compact';
  return 'normal';
}

function resolveSize(scale: MapMarkerFeedbackScale): { size: number; iconSize: number } {
  switch (scale) {
    case 'emphasized':
      return { size: 40, iconSize: 18 };
    case 'compact':
      return { size: 30, iconSize: 13 };
    default:
      return { size: 34, iconSize: 15 };
  }
}

function buildAccessibilityLabel(params: {
  marker: MapGameplayMarker;
  state: MapMarkerFeedbackState;
  sourceTypeLabel: string;
}): string {
  const { marker, state, sourceTypeLabel } = params;
  const district = marker.districtName ? `, ${marker.districtName}` : '';
  const trait = marker.traitLabel ? `, ${marker.traitLabel}` : '';
  if (state === 'selected') {
    return `Seçili ${sourceTypeLabel}: ${marker.title}${district}${trait}`;
  }
  if (state === 'disabled') {
    return `${marker.title}, bilgi amaçlı${district}`;
  }
  return `${sourceTypeLabel}: ${marker.title}${district}${trait}`;
}

export function resolveCreviaDistrictIdFromMarker(
  marker: MapGameplayMarker | null | undefined,
): CreviaMapDistrictId | null {
  if (!marker) return null;
  const name = marker.districtName?.trim().toLowerCase() ?? marker.title.trim().toLowerCase();
  if (name.includes('merkez')) return 'merkez';
  if (name.includes('cumhuriyet')) return 'cumhuriyet';
  if (name.includes('sanayi')) return 'sanayi';
  if (name.includes('yeşil') || name.includes('yesil')) return 'yesilvadi';
  if (name.includes('istasyon')) return 'istasyon';
  if (name.includes('güneş') || name.includes('gunes')) return 'yesilvadi';
  return null;
}

export function buildDistrictTraitLabelMap(
  markers: readonly MapGameplayMarker[],
): Partial<Record<CreviaMapDistrictId, string>> {
  const map: Partial<Record<CreviaMapDistrictId, string>> = {};
  for (const marker of markers) {
    if (!marker.traitLabel?.trim()) continue;
    const districtId = resolveCreviaDistrictIdFromMarker(marker);
    if (districtId && !map[districtId]) {
      map[districtId] = marker.traitLabel.trim();
    }
  }
  return map;
}

export function buildMapMarkerFeedbackPresentation(
  input: BuildMapMarkerFeedbackInput,
): MapMarkerFeedbackPresentation {
  const isSelected = input.marker.id === input.selectedMarkerId;
  const bindingMatches = markerMatchesBinding(
    input.marker,
    input.activeOperationBinding,
  );
  const hasActions = markerHasNavigableActions(input.actionBundleInput);
  const { state, tone } = resolveFeedbackState({
    marker: input.marker,
    isSelected,
    bindingMatches,
    binding: input.activeOperationBinding,
    tacticalMotion: input.tacticalMotion,
    hasActions,
    allowCriticalAccent: input.allowCriticalAccent !== false,
  });

  const scale = resolveScale(state);
  const { size, iconSize } = resolveSize(scale);
  const palette = resolveVisualPalette({
    marker: input.marker,
    state,
    tone,
    bindingMatches,
  });

  const reducedMotion = input.reducedMotion === true;
  const motion = input.tacticalMotion?.motion;
  const showPulse =
    !reducedMotion &&
    input.marker.status !== 'resolved' &&
    input.marker.type !== 'resolved' &&
    (motion === 'softPulse' ||
      motion === 'riskPulse' ||
      (input.marker.pulse === true && state !== 'completed'));

  const showRing =
    state === 'selected' ||
    state === 'active' ||
    (isSelected && bindingMatches);

  return {
    markerId: input.marker.id,
    state,
    tone,
    scale,
    showRing,
    showPulse,
    showLift: state === 'selected' && !reducedMotion,
    showAlertDot: state === 'warning' || state === 'critical',
    pressable: state !== 'disabled',
    label: isSelected || state === 'active' ? resolveMarkerLabel(input.marker) : undefined,
    sourceTypeLabel: SOURCE_TYPE_LABEL[input.marker.type],
    accessibilityLabel: buildAccessibilityLabel({
      marker: input.marker,
      state,
      sourceTypeLabel: SOURCE_TYPE_LABEL[input.marker.type],
    }),
    icon:
      input.marker.type === 'urgent_signal' && state === 'warning'
        ? 'pulse'
        : MARKER_ICON[input.marker.type],
    accentColor: palette.accent,
    backgroundColor: palette.background,
    ringColor: palette.ring,
    size,
    iconSize,
  };
}

export function buildMapMarkerFeedbackBatch(params: {
  markers: readonly MapGameplayMarker[];
  selectedMarkerId?: string | null;
  activeOperationBinding?: ActiveOperationMapBinding | null;
  tacticalMotions?: readonly MapTacticalMarkerMotion[];
  reducedMotion?: boolean;
  actionBundleInputForMarker?: (
    marker: MapGameplayMarker,
  ) => Omit<BuildMapActionBundleInput, 'surface'> | null;
}): Map<string, MapMarkerFeedbackPresentation> {
  const criticalCandidates = params.markers
    .filter(
      (marker) =>
        marker.severity === 'critical' &&
        marker.status === 'active' &&
        marker.type !== 'resolved',
    )
    .sort((a, b) => {
      const score = (marker: MapGameplayMarker) => {
        let value = marker.id === params.selectedMarkerId ? 50 : 0;
        if (markerMatchesBinding(marker, params.activeOperationBinding)) value += 40;
        if (marker.type === 'active_event') value += 20;
        return value;
      };
      return score(b) - score(a);
    });

  const criticalAccentId = criticalCandidates[0]?.id;

  const map = new Map<string, MapMarkerFeedbackPresentation>();
  for (const marker of params.markers) {
    const tacticalMotion = params.tacticalMotions?.find(
      (motion) => motion.markerId === marker.id,
    );
    map.set(
      marker.id,
      buildMapMarkerFeedbackPresentation({
        marker,
        selectedMarkerId: params.selectedMarkerId,
        activeOperationBinding: params.activeOperationBinding,
        tacticalMotion,
        reducedMotion: params.reducedMotion,
        actionBundleInput: params.actionBundleInputForMarker?.(marker) ?? null,
        allowCriticalAccent: marker.id === criticalAccentId,
      }),
    );
  }
  return map;
}

export function resolveMapPanelSourcePill(
  marker: MapGameplayMarker,
  binding: ActiveOperationMapBinding | null | undefined,
): string {
  if (markerMatchesBinding(marker, binding) && marker.type === 'active_event') {
    return 'Aktif Operasyon';
  }
  return SOURCE_TYPE_LABEL[marker.type];
}

export function resolveMapPanelMarkerTitle(marker: MapGameplayMarker): string {
  const district = marker.districtName?.trim();
  if (marker.type === 'district' && district) {
    return `${district} Sinyali`;
  }
  if (marker.type === 'urgent_signal' && district) {
    return `${district} · Acil Sinyal`;
  }
  if (marker.type === 'active_event' && district) {
    return marker.title.includes(district) ? marker.title : `${district} · ${marker.title}`;
  }
  if (marker.type === 'resolved') {
    return marker.title;
  }
  return marker.title;
}

export function buildMarkerActionBundleInputForFeedback(
  marker: MapGameplayMarker,
  context: {
    binding: ActiveOperationMapBinding | null;
    card: import('@/core/activeOperationMapBinding').ActiveOperationMapCardModel | null;
    maintenanceRuntime?: import('@/core/maintenanceBacklog/maintenanceBacklogRuntimeTypes').MaintenanceBacklogRuntimeState | null;
    personalitySignalLine?: string;
    periodGoalShortTitle?: string;
  },
): Omit<BuildMapActionBundleInput, 'surface'> {
  return buildMarkerActionBundleInput({
    marker,
    binding: context.binding,
    card: context.card,
    maintenanceRuntime: context.maintenanceRuntime,
    personalitySignalLine: context.personalitySignalLine,
    periodGoalShortTitle: context.periodGoalShortTitle,
    layerToggleAvailable: true,
  });
}
