import type { ActiveOperationMapBinding } from '@/core/activeOperationMapBinding/activeOperationMapBindingTypes';
import type { CreviaActiveTaskRouteUiModel } from '@/core/activeTaskRoutes/activeTaskRouteUiTypes';
import type { CityMemoryVisibilityResult } from '@/core/cityMemoryVisibility/cityMemoryVisibilityTypes';
import type { Day8StrategicContentResult } from '@/core/day8StrategicContent/day8StrategicContentTypes';
import type { DistrictNeglectRecoveryResult } from '@/core/districtNeglectRecovery/districtNeglectRecoveryTypes';
import type { MapGameplayBinding } from '@/core/mapGameplayBinding/mapGameplayBindingTypes';
import type { MapGameplayRuntimeFeedbackResult } from '@/core/mapGameplayBinding/mapGameplayRuntimeFeedbackTypes';
import type { MapPresenceViewModel } from '@/core/mapPresence/mapPresenceTypes';
import type { PositiveComebackResult } from '@/core/positiveComeback/positiveComebackTypes';

import type { CreviaMapDistrictId } from '../types/creviaMapTypes';
import { getMapDistrictLabel } from './mapDistrictLabels';

export type MapMotionSourceKind =
  | 'active_operation_map_binding'
  | 'map_gameplay_binding'
  | 'day8_strategic_content'
  | 'district_neglect_recovery'
  | 'positive_comeback'
  | 'city_memory_visibility'
  | 'follow_up_action'
  | 'portfolio_defer_risk'
  | 'daily_capacity_portfolio'
  | 'active_task_route'
  | 'map_presence'
  | 'vehicle_maintenance'
  | 'team_specialization'
  | 'container_network'
  | 'fallback';

export type MapMarkerMotionKind =
  | 'active_operation'
  | 'route_pressure'
  | 'district_neglect'
  | 'district_recovery'
  | 'city_memory_trace'
  | 'positive_opportunity'
  | 'resource_pressure'
  | 'container_pressure'
  | 'social_trust'
  | 'safe_watch'
  | 'idle';

export type MapMotionIntensity = 'none' | 'subtle' | 'medium' | 'strong';

export type MapMarkerMotionModel = {
  id: string;
  districtId?: CreviaMapDistrictId;
  markerId?: string;
  kind: MapMarkerMotionKind;
  intensity: MapMotionIntensity;
  pulse: boolean;
  glow: boolean;
  routeHint: boolean;
  label?: string;
  accessibilityLabel: string;
  sourceIds: string[];
  sourceKinds: MapMotionSourceKind[];
  priority: number;
  reducedMotionFallback: boolean;
  portfolioStatus?: string;
  portfolioBadgeLabel?: string;
};

export type MapMotionPresentationResult = {
  markers: MapMarkerMotionModel[];
  primaryMarker?: MapMarkerMotionModel;
  routeMotionEnabled: boolean;
  globalMotionIntensity: MapMotionIntensity;
  suppressAnimationReason?: string;
};

export type MapMotionPresentationInput = {
  day: number;
  reducedMotion?: boolean;
  focusDistrictId?: CreviaMapDistrictId;
  activeOperationBinding?: ActiveOperationMapBinding | null;
  mapGameplayBindings?: readonly MapGameplayBinding[];
  day8StrategicContent?: Day8StrategicContentResult | null;
  districtNeglectRecovery?: DistrictNeglectRecoveryResult | null;
  positiveComeback?: PositiveComebackResult | null;
  cityMemoryVisibility?: CityMemoryVisibilityResult | null;
  activeTaskRoute?: CreviaActiveTaskRouteUiModel | null;
  mapPresenceViewModel?: MapPresenceViewModel | null;
  mapGameplayRuntimeFeedback?: MapGameplayRuntimeFeedbackResult | null;
};

export const MAP_MOTION_MAX_ANIMATED = 5;
export const MAP_MOTION_MAX_STRONG = 1;
export const MAP_MOTION_MAX_MEDIUM = 2;

const MAP_DISTRICT_IDS: readonly CreviaMapDistrictId[] = [
  'merkez',
  'cumhuriyet',
  'sanayi',
  'istasyon',
  'yesilvadi',
];

type MotionDraft = Omit<MapMarkerMotionModel, 'id' | 'reducedMotionFallback'>;

function clampPriority(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function uniqueSourceKinds(values: readonly MapMotionSourceKind[]): MapMotionSourceKind[] {
  return [...new Set(values)];
}

export function normalizeMapMotionDistrictId(raw?: string | null): CreviaMapDistrictId | undefined {
  if (!raw?.trim()) return undefined;
  const normalized = raw.trim().toLowerCase();
  const direct = MAP_DISTRICT_IDS.find((id) => id === normalized);
  if (direct) return direct;
  return MAP_DISTRICT_IDS.find((id) => normalized.includes(id));
}

function districtAccessibilityName(districtId?: CreviaMapDistrictId, fallback?: string): string {
  if (districtId) return getMapDistrictLabel(districtId);
  if (fallback?.trim()) return fallback.trim();
  return 'Sehir';
}

function districtMotionLabel(
  districtId: CreviaMapDistrictId | undefined,
  fallback: string | undefined,
  suffix: string,
): string {
  return `${districtAccessibilityName(districtId, fallback)} bolgesinde ${suffix}`;
}

function intensityRank(intensity: MapMotionIntensity): number {
  switch (intensity) {
    case 'strong':
      return 4;
    case 'medium':
      return 3;
    case 'subtle':
      return 2;
    default:
      return 0;
  }
}

function strongerIntensity(
  a: MapMotionIntensity,
  b: MapMotionIntensity,
): MapMotionIntensity {
  return intensityRank(a) >= intensityRank(b) ? a : b;
}

function mergeDrafts(existing: MotionDraft, incoming: MotionDraft): MotionDraft {
  const intensity = strongerIntensity(existing.intensity, incoming.intensity);
  return {
    districtId: existing.districtId ?? incoming.districtId,
    markerId: existing.markerId ?? incoming.markerId,
    kind: existing.priority >= incoming.priority ? existing.kind : incoming.kind,
    intensity,
    pulse: existing.pulse || incoming.pulse,
    glow: existing.glow || incoming.glow,
    routeHint: existing.routeHint || incoming.routeHint,
    label: existing.label ?? incoming.label,
    accessibilityLabel:
      existing.priority >= incoming.priority
        ? existing.accessibilityLabel
        : incoming.accessibilityLabel,
    sourceIds: uniqueStrings([...existing.sourceIds, ...incoming.sourceIds]),
    sourceKinds: uniqueSourceKinds([...existing.sourceKinds, ...incoming.sourceKinds]),
    priority: Math.max(existing.priority, incoming.priority),
  };
}

function pushDraft(
  drafts: Map<string, MotionDraft>,
  draft: MotionDraft,
): void {
  const key = `${draft.districtId ?? 'global'}:${draft.kind}`;
  const existing = drafts.get(key);
  drafts.set(key, existing ? mergeDrafts(existing, draft) : draft);
}

function collectFromActiveOperation(
  drafts: Map<string, MotionDraft>,
  binding: ActiveOperationMapBinding | null | undefined,
): void {
  if (!binding || binding.visibilityLevel === 'hidden') return;

  const districtId = normalizeMapMotionDistrictId(binding.districtId ?? binding.districtName);
  const strong = binding.confidence === 'high' || binding.phase === 'field_active';
  const intensity: MapMotionIntensity = strong ? 'strong' : 'medium';

  pushDraft(drafts, {
    districtId,
    markerId: binding.eventId,
    kind: 'active_operation',
    intensity,
    pulse: true,
    glow: false,
    routeHint: binding.canShowRouteHint,
    label: binding.phaseLabel,
    accessibilityLabel: districtMotionLabel(districtId, binding.districtName, 'aktif operasyon isareti'),
    sourceIds: uniqueStrings([binding.id, ...binding.sourceIds]),
    sourceKinds: ['active_operation_map_binding'],
    priority: clampPriority(Math.max(binding.priority, 96)),
  });
}

function collectFromMapGameplayBindings(
  drafts: Map<string, MotionDraft>,
  bindings: readonly MapGameplayBinding[] | undefined,
): void {
  if (!bindings?.length) return;

  for (const binding of bindings) {
    if (binding.visibilityLevel === 'hidden') continue;

    let kind: MapMarkerMotionKind | null = null;
    let intensity: MapMotionIntensity = 'subtle';
    let pulse = false;
    let glow = false;
    let routeHint = false;
    let label = binding.title;
    let priority = binding.priority;
    let accessibilitySuffix = 'harita sinyali';

    switch (binding.id) {
      case 'active_operation_tracker':
        kind = 'active_operation';
        intensity = binding.confidence === 'high' ? 'strong' : 'medium';
        pulse = true;
        priority = Math.max(priority, 90);
        accessibilitySuffix = 'aktif operasyon takibi';
        break;
      case 'district_risk_reader':
        kind = 'district_neglect';
        intensity = binding.isActionable ? 'medium' : 'subtle';
        pulse = binding.isActionable;
        priority = Math.max(priority, 72);
        accessibilitySuffix = 'mahalle risk sinyali';
        break;
      case 'resource_pressure_board':
        kind = 'resource_pressure';
        intensity = 'subtle';
        priority = Math.max(priority, 48);
        accessibilitySuffix = 'kaynak baskisi sinyali';
        break;
      case 'district_memory_trace':
      case 'result_trace_stamp':
        kind = 'city_memory_trace';
        intensity = 'subtle';
        glow = true;
        priority = Math.max(priority, 58);
        accessibilitySuffix = 'sehir hafiza izi';
        break;
      case 'route_support_hint':
        kind = 'route_pressure';
        intensity = 'medium';
        routeHint = true;
        priority = Math.max(priority, 52);
        accessibilitySuffix = 'rota baskisi sinyali';
        break;
      default:
        continue;
    }

    pushDraft(drafts, {
      kind,
      intensity,
      pulse,
      glow,
      routeHint,
      label,
      accessibilityLabel: `Haritada ${accessibilitySuffix}`,
      sourceIds: uniqueStrings([binding.id, ...binding.sourceIds]),
      sourceKinds: ['map_gameplay_binding'],
      priority: clampPriority(priority),
    });
  }
}

function mapDay8KindToMotion(
  kind: string,
): { motionKind: MapMarkerMotionKind; intensity: MapMotionIntensity; pulse: boolean; glow: boolean; routeHint: boolean } | null {
  switch (kind) {
    case 'map_priority_focus':
      return { motionKind: 'active_operation', intensity: 'medium', pulse: true, glow: false, routeHint: false };
    case 'safe_watch_focus':
      return { motionKind: 'safe_watch', intensity: 'subtle', pulse: false, glow: false, routeHint: false };
    case 'district_neglect_focus':
      return { motionKind: 'district_neglect', intensity: 'medium', pulse: true, glow: false, routeHint: false };
    case 'district_recovery_focus':
      return { motionKind: 'district_recovery', intensity: 'medium', pulse: false, glow: true, routeHint: false };
    case 'positive_comeback_focus':
      return { motionKind: 'positive_opportunity', intensity: 'medium', pulse: false, glow: true, routeHint: false };
    case 'route_pressure_focus':
      return { motionKind: 'route_pressure', intensity: 'medium', pulse: false, glow: false, routeHint: true };
    case 'container_pressure_focus':
      return { motionKind: 'container_pressure', intensity: 'subtle', pulse: false, glow: false, routeHint: false };
    case 'social_trust_focus':
      return { motionKind: 'social_trust', intensity: 'subtle', pulse: false, glow: false, routeHint: false };
    case 'memory_trace_focus':
      return { motionKind: 'city_memory_trace', intensity: 'subtle', pulse: false, glow: true, routeHint: false };
    default:
      return null;
  }
}

function collectFromDay8(
  drafts: Map<string, MotionDraft>,
  result: Day8StrategicContentResult | null | undefined,
): void {
  if (!result || result.day < 8) return;
  const candidate = result.mapCandidate ?? result.primaryCandidate;
  if (!candidate || candidate.isFallback || candidate.visibilityLevel === 'hidden') return;

  const mapped = mapDay8KindToMotion(candidate.kind);
  if (!mapped) return;

  const districtId = normalizeMapMotionDistrictId(candidate.districtId ?? candidate.districtName);

  pushDraft(drafts, {
    districtId,
    kind: mapped.motionKind,
    intensity: mapped.intensity,
    pulse: mapped.pulse,
    glow: mapped.glow,
    routeHint: mapped.routeHint,
    label: candidate.title,
    accessibilityLabel: districtMotionLabel(districtId, candidate.districtName, 'stratejik harita odaği'),
    sourceIds: uniqueStrings([candidate.id, ...candidate.sourceIds]),
    sourceKinds: ['day8_strategic_content'],
    priority: clampPriority(Math.max(candidate.priority, 88)),
  });
}

function collectFromDistrictNeglectRecovery(
  drafts: Map<string, MotionDraft>,
  result: DistrictNeglectRecoveryResult | null | undefined,
): void {
  if (!result?.signals?.length) return;

  for (const signal of result.signals) {
    if (signal.isFallback) continue;

    const districtId = normalizeMapMotionDistrictId(signal.districtId ?? signal.districtName);
    const districtName = districtAccessibilityName(districtId, signal.districtName);

    if (
      signal.neglectBand === 'high' ||
      signal.neglectBand === 'rising' ||
      signal.kind === 'neglect_warning'
    ) {
      const strong = signal.neglectBand === 'high';
      pushDraft(drafts, {
        districtId,
        kind: 'district_neglect',
        intensity: strong ? 'strong' : 'medium',
        pulse: true,
        glow: false,
        routeHint: false,
        label: signal.title,
        accessibilityLabel: `${districtName} bolgesinde ihmal ve risk sinyali`,
        sourceIds: uniqueStrings([signal.id, ...signal.sourceIds]),
        sourceKinds: ['district_neglect_recovery'],
        priority: clampPriority(Math.max(signal.priority, strong ? 82 : 76)),
      });
      continue;
    }

    if (signal.recoveryBand === 'active' || signal.recoveryBand === 'strong') {
      const strong = signal.recoveryBand === 'strong';
      pushDraft(drafts, {
        districtId,
        kind: 'district_recovery',
        intensity: strong ? 'strong' : 'medium',
        pulse: false,
        glow: true,
        routeHint: false,
        label: signal.title,
        accessibilityLabel: `${districtName} bolgesinde toparlanma firsati`,
        sourceIds: uniqueStrings([signal.id, ...signal.sourceIds]),
        sourceKinds: ['district_neglect_recovery'],
        priority: clampPriority(Math.max(signal.priority, strong ? 80 : 74)),
      });
      continue;
    }

    if (signal.kind === 'route_backlog') {
      pushDraft(drafts, {
        districtId,
        kind: 'route_pressure',
        intensity: 'medium',
        pulse: false,
        glow: false,
        routeHint: true,
        label: signal.title,
        accessibilityLabel: `${districtName} bolgesinde rota baskisi sinyali`,
        sourceIds: uniqueStrings([signal.id, ...signal.sourceIds]),
        sourceKinds: ['district_neglect_recovery'],
        priority: clampPriority(Math.max(signal.priority, 50)),
      });
      continue;
    }

    if (signal.kind === 'container_backlog') {
      pushDraft(drafts, {
        districtId,
        kind: 'container_pressure',
        intensity: 'subtle',
        pulse: false,
        glow: false,
        routeHint: false,
        label: signal.title,
        accessibilityLabel: `${districtName} bolgesinde konteyner baskisi sinyali`,
        sourceIds: uniqueStrings([signal.id, ...signal.sourceIds]),
        sourceKinds: ['district_neglect_recovery'],
        priority: clampPriority(Math.max(signal.priority, 46)),
      });
      continue;
    }

    if (signal.kind === 'trust_fragility' || signal.kind === 'social_cooling') {
      pushDraft(drafts, {
        districtId,
        kind: 'social_trust',
        intensity: 'subtle',
        pulse: false,
        glow: false,
        routeHint: false,
        label: signal.title,
        accessibilityLabel: `${districtName} bolgesinde guven sinyali`,
        sourceIds: uniqueStrings([signal.id, ...signal.sourceIds]),
        sourceKinds: ['district_neglect_recovery'],
        priority: clampPriority(Math.max(signal.priority, 44)),
      });
    }
  }
}

function collectFromPositiveComeback(
  drafts: Map<string, MotionDraft>,
  result: PositiveComebackResult | null | undefined,
): void {
  if (!result?.candidates?.length) return;

  for (const candidate of result.candidates) {
    if (candidate.isFallback || candidate.visibilityLevel === 'hidden') continue;

    const districtId = normalizeMapMotionDistrictId(candidate.districtId ?? candidate.districtName);
    const districtName = districtAccessibilityName(districtId, candidate.districtName);

    let kind: MapMarkerMotionKind = 'positive_opportunity';
    let intensity: MapMotionIntensity = 'medium';
    let pulse = false;
    let glow = true;
    let routeHint = false;
    let priority = candidate.priority;

    switch (candidate.kind) {
      case 'district_recovery':
        kind = 'district_recovery';
        intensity = 'medium';
        break;
      case 'route_relief':
        kind = 'route_pressure';
        intensity = 'subtle';
        glow = false;
        routeHint = true;
        break;
      case 'container_improvement':
        kind = 'container_pressure';
        intensity = 'subtle';
        glow = false;
        break;
      case 'social_support':
      case 'trust_recovery':
        kind = 'social_trust';
        intensity = 'subtle';
        break;
      case 'memory_positive_trace':
        kind = 'city_memory_trace';
        intensity = 'subtle';
        break;
      case 'opportunity_window':
        kind = 'positive_opportunity';
        intensity = 'medium';
        priority = Math.max(priority, 70);
        break;
      default:
        continue;
    }

    pushDraft(drafts, {
      districtId,
      kind,
      intensity,
      pulse,
      glow,
      routeHint,
      label: candidate.title,
      accessibilityLabel: `${districtName} bolgesinde toparlanma firsati`,
      sourceIds: uniqueStrings([candidate.id, ...candidate.sourceIds]),
      sourceKinds: ['positive_comeback'],
      priority: clampPriority(Math.max(priority, 68)),
    });
  }
}

function collectFromCityMemory(
  drafts: Map<string, MotionDraft>,
  result: CityMemoryVisibilityResult | null | undefined,
): void {
  if (!result) return;

  const traces = [
    result.mapTrace,
    ...result.traces.filter(
      (trace) =>
        trace.kind === 'map_memory_hint' ||
        trace.kind === 'district_trace' ||
        trace.kind === 'story_chain_trace',
    ),
  ].filter(Boolean);

  for (const trace of traces) {
    if (!trace || trace.isFallback) continue;
    const districtId = normalizeMapMotionDistrictId(trace.districtId ?? trace.districtName);
    const districtName = districtAccessibilityName(districtId, trace.districtName);

    pushDraft(drafts, {
      districtId,
      kind: 'city_memory_trace',
      intensity: 'subtle',
      pulse: false,
      glow: true,
      routeHint: false,
      label: trace.title,
      accessibilityLabel: `${districtName} bolgesinde sehir hafiza izi`,
      sourceIds: uniqueStrings([trace.id, ...trace.sourceIds]),
      sourceKinds: ['city_memory_visibility'],
      priority: clampPriority(Math.max(trace.priority, 56)),
    });
  }
}

function collectFromActiveTaskRoute(
  drafts: Map<string, MotionDraft>,
  route: CreviaActiveTaskRouteUiModel | null | undefined,
): void {
  if (!route?.visible) return;

  pushDraft(drafts, {
    kind: 'route_pressure',
    intensity: 'subtle',
    pulse: false,
    glow: false,
    routeHint: true,
    label: route.statusLine,
    accessibilityLabel: 'Aktif gorev rotasi haritada isaretli',
    sourceIds: uniqueStrings([route.id]),
    sourceKinds: ['active_task_route'],
    priority: clampPriority(36),
  });
}

function collectFromMapPresence(
  drafts: Map<string, MotionDraft>,
  presence: MapPresenceViewModel | null | undefined,
  focusDistrictId?: CreviaMapDistrictId,
): void {
  if (!presence?.visible) return;

  pushDraft(drafts, {
    districtId: focusDistrictId,
    kind: 'safe_watch',
    intensity: 'subtle',
    pulse: false,
    glow: false,
    routeHint: presence.routeHints.some((hint) => hint.visible),
    label: presence.panelLines?.[0],
    accessibilityLabel: focusDistrictId
      ? `${districtAccessibilityName(focusDistrictId)} bolgesinde saha varligi`
      : 'Haritada saha varligi sinyali',
    sourceIds: uniqueStrings(['map_presence']),
    sourceKinds: ['map_presence'],
    priority: clampPriority(28),
  });
}

function collectFromMapGameplayRuntimeFeedback(
  drafts: Map<string, MotionDraft>,
  feedback: MapGameplayRuntimeFeedbackResult | null | undefined,
): void {
  if (!feedback || feedback.mode !== 'portfolio_runtime' || feedback.markers.length === 0) return;

  for (const marker of feedback.markers) {
    const districtId = normalizeMapMotionDistrictId(marker.districtId ?? marker.districtName);
    let kind: MapMarkerMotionKind = 'safe_watch';
    let intensity: MapMotionIntensity = 'subtle';
    let pulse = false;
    let glow = false;
    let routeHint = false;
    const sourceKinds: MapMotionSourceKind[] = ['daily_capacity_portfolio', 'map_gameplay_binding'];

    switch (marker.status) {
      case 'active':
        kind = 'active_operation';
        intensity = 'strong';
        pulse = true;
        routeHint = true;
        break;
      case 'today_focus':
        kind = 'active_operation';
        intensity = 'medium';
        pulse = true;
        routeHint = true;
        break;
      case 'recommended':
        kind = 'positive_opportunity';
        intensity = 'medium';
        glow = true;
        break;
      case 'deferred':
      case 'blocked_by_capacity':
        kind = 'safe_watch';
        intensity = 'subtle';
        sourceKinds.push('portfolio_defer_risk');
        break;
      case 'completed':
        kind = 'city_memory_trace';
        intensity = 'subtle';
        break;
      default:
        kind = 'safe_watch';
        break;
    }

    pushDraft(drafts, {
      districtId,
      markerId: marker.eventId,
      kind,
      intensity,
      pulse,
      glow,
      routeHint,
      label: marker.badgeLabel,
      accessibilityLabel: `${marker.explanationLine}. ${marker.ctaLabel}`,
      sourceIds: uniqueStrings(marker.sourceIds),
      sourceKinds: uniqueSourceKinds(sourceKinds),
      priority: clampPriority(marker.priority),
    });
  }
}

function applyPerformanceGuards(
  markers: MapMarkerMotionModel[],
  reducedMotion: boolean,
): MapMarkerMotionModel[] {
  const sorted = [...markers].sort((a, b) => b.priority - a.priority || a.kind.localeCompare(b.kind));
  let animatedCount = 0;
  let strongCount = 0;
  let mediumCount = 0;

  return sorted.map((marker) => {
    const wantsAnimation = marker.pulse || marker.glow || marker.routeHint;
    let next = { ...marker };

    if (reducedMotion) {
      return {
        ...next,
        pulse: false,
        glow: false,
        reducedMotionFallback: true,
      };
    }

    if (!wantsAnimation) {
      return { ...next, reducedMotionFallback: false };
    }

    if (animatedCount >= MAP_MOTION_MAX_ANIMATED) {
      return {
        ...next,
        intensity: 'none',
        pulse: false,
        glow: false,
        routeHint: false,
        reducedMotionFallback: false,
      };
    }

    if (next.intensity === 'strong') {
      if (strongCount >= MAP_MOTION_MAX_STRONG) {
        next = { ...next, intensity: 'medium' };
      } else {
        strongCount += 1;
      }
    }

    if (next.intensity === 'medium') {
      if (mediumCount >= MAP_MOTION_MAX_MEDIUM) {
        next = { ...next, intensity: 'subtle' };
      } else {
        mediumCount += 1;
      }
    }

    animatedCount += 1;
    return { ...next, reducedMotionFallback: false };
  });
}

function resolvePrimaryMarker(markers: MapMarkerMotionModel[]): MapMarkerMotionModel | undefined {
  const activeOperation = markers.find((marker) => marker.kind === 'active_operation');
  if (activeOperation) return activeOperation;
  return markers[0];
}

function resolveGlobalIntensity(markers: MapMarkerMotionModel[]): MapMotionIntensity {
  if (markers.length === 0) return 'none';
  const primary = resolvePrimaryMarker(markers);
  return primary?.intensity ?? 'none';
}

export function buildMapMotionPresentation(
  input: MapMotionPresentationInput,
): MapMotionPresentationResult {
  const reducedMotion = input.reducedMotion === true;
  const drafts = new Map<string, MotionDraft>();

  collectFromActiveOperation(drafts, input.activeOperationBinding);
  collectFromMapGameplayBindings(drafts, input.mapGameplayBindings);
  collectFromDay8(drafts, input.day8StrategicContent);
  collectFromDistrictNeglectRecovery(drafts, input.districtNeglectRecovery);
  collectFromPositiveComeback(drafts, input.positiveComeback);
  collectFromCityMemory(drafts, input.cityMemoryVisibility);
  collectFromActiveTaskRoute(drafts, input.activeTaskRoute);
  collectFromMapPresence(drafts, input.mapPresenceViewModel, input.focusDistrictId);
  collectFromMapGameplayRuntimeFeedback(drafts, input.mapGameplayRuntimeFeedback);

  if (drafts.size === 0) {
    pushDraft(drafts, {
      kind: 'idle',
      intensity: 'none',
      pulse: false,
      glow: false,
      routeHint: false,
      accessibilityLabel: 'Harita sakin durumda',
      sourceIds: ['map_motion_idle'],
      sourceKinds: ['fallback'],
      priority: 0,
    });
  }

  let markers: MapMarkerMotionModel[] = [...drafts.values()].map((draft, index) => ({
    id: `map_motion_${draft.kind}_${draft.districtId ?? 'global'}_${index}`,
    ...draft,
    priority: clampPriority(draft.priority),
    sourceIds: uniqueStrings(draft.sourceIds),
    sourceKinds: uniqueSourceKinds(draft.sourceKinds),
    reducedMotionFallback: false,
  }));

  if (input.mapGameplayRuntimeFeedback?.mode === 'portfolio_runtime') {
    const feedbackByEvent = new Map(
      input.mapGameplayRuntimeFeedback.markers
        .filter((marker) => marker.eventId)
        .map((marker) => [marker.eventId as string, marker]),
    );
    markers = markers.map((marker) => {
      const feedback = marker.markerId ? feedbackByEvent.get(marker.markerId) : undefined;
      if (!feedback) return marker;
      return {
        ...marker,
        portfolioStatus: feedback.status,
        portfolioBadgeLabel: feedback.badgeLabel,
      };
    });
  }

  markers = applyPerformanceGuards(markers, reducedMotion);

  const primaryMarker = resolvePrimaryMarker(markers);
  const routeMotionEnabled =
    !reducedMotion && markers.some((marker) => marker.routeHint && marker.intensity !== 'none');

  return {
    markers,
    primaryMarker,
    routeMotionEnabled,
    globalMotionIntensity: resolveGlobalIntensity(markers),
    suppressAnimationReason: reducedMotion ? 'reduced_motion' : undefined,
  };
}

export function countAnimatedMapMotionMarkers(markers: readonly MapMarkerMotionModel[]): number {
  return markers.filter(
    (marker) =>
      !marker.reducedMotionFallback &&
      marker.intensity !== 'none' &&
      (marker.pulse || marker.glow || marker.routeHint),
  ).length;
}

export function countMapMotionByIntensity(
  markers: readonly MapMarkerMotionModel[],
  intensity: MapMotionIntensity,
): number {
  return markers.filter((marker) => marker.intensity === intensity).length;
}
