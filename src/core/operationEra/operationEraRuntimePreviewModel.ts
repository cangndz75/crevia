import { normalizeMapDistrictId } from '@/core/districts/districtIdentityPresentation';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import {
  buildDistrictMemoryRuntimeSnapshot,
  type CreviaDistrictMemorySnapshot,
} from '@/core/districtMemoryRuntime';
import type { CreviaDistrictOperationActionState } from '@/core/districtOperationActions/districtOperationActionTypes';
import {
  buildDistrictTrustRuntimeSnapshot,
  type CreviaDistrictTrustRuntimeSnapshot,
} from '@/core/districtTrustRuntime';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import {
  OPERATION_ERA_RUNTIME_PREVIEW_DEFINITIONS,
  OPERATION_ERA_RUNTIME_PREVIEW_KINDS,
  OPERATION_ERA_RUNTIME_PREVIEW_MIN_DAY,
  OPERATION_ERA_RUNTIME_PREVIEW_PILOT_MAX_DAY,
  OPERATION_ERA_RUNTIME_PREVIEW_SCORE_WEIGHTS,
  getOperationEraRuntimePreviewDefinition,
} from './operationEraRuntimePreviewConstants';
import type {
  CreviaOperationEraPreviewContext,
  CreviaOperationEraPreviewEligibility,
  CreviaOperationEraPreviewHealthStatus,
  CreviaOperationEraPreviewKind,
  CreviaOperationEraPreviewStatus,
  CreviaOperationEraPreviewVisibility,
  CreviaOperationEraRuntimePreviewModel,
  CreviaOperationEraScoredPreviewCandidate,
} from './operationEraRuntimePreviewTypes';

export type BuildOperationEraRuntimePreviewInput = Partial<CreviaOperationEraPreviewContext> & {
  day?: number;
  gameDay?: number;
  focusDistrictId?: MapDistrictId | string;
  districtTrustSnapshot?: CreviaDistrictTrustRuntimeSnapshot | null;
  districtMemorySnapshot?: CreviaDistrictMemorySnapshot | null;
  districtOperationActionState?: CreviaDistrictOperationActionState | null;
  storyChainRuntimeHint?: CreviaOperationEraPreviewContext['storyChainRuntimeHint'];
  existingLines?: string[];
  nextUnlockLine?: string;
  districtOperationLine?: string;
  tomorrowPreviewLine?: string;
  carryOverLine?: string;
  permissionChipLabels?: string[];
  crisisOverlayVisible?: boolean;
};

function resolveDay(input: BuildOperationEraRuntimePreviewInput): number {
  return Math.max(1, Math.round(input.gameDay ?? input.day ?? input.currentDay ?? 1));
}

function resolveDistrictId(input: BuildOperationEraRuntimePreviewInput): MapDistrictId {
  const raw =
    input.focusDistrictId ??
    input.selectedDistrictId ??
    input.districtTrustSnapshot?.focusDistrictId ??
    input.districtMemorySnapshot?.focusDistrictId ??
    'merkez';
  return normalizeMapDistrictId(raw) ?? 'merkez';
}

function textBlob(value: unknown): string {
  if (typeof value === 'string') return value.toLocaleLowerCase('tr-TR');
  if (Array.isArray(value)) return value.map(textBlob).join(' ');
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).map(textBlob).join(' ');
  }
  return '';
}

function readSignalDomain(
  signals: unknown,
  domain: string,
): { status?: string; score?: number } | null {
  if (!signals || typeof signals !== 'object') return null;
  const record = signals as Record<string, unknown>;
  const domainRecord = record[domain];
  if (!domainRecord || typeof domainRecord !== 'object') return null;
  const entry = domainRecord as Record<string, unknown>;
  return {
    status: typeof entry.status === 'string' ? entry.status : undefined,
    score: typeof entry.score === 'number' ? entry.score : undefined,
  };
}

function isHighRank(input: BuildOperationEraRuntimePreviewInput): boolean {
  const rankKey = input.rankKey ?? '';
  const permissions = input.unlockedPermissionIds ?? [];
  return (
    rankKey.includes('director') ||
    rankKey.includes('chief') ||
    rankKey.includes('manager') ||
    (input.authorityTrust ?? 0) >= 450 ||
    permissions.includes('district_specific_operations_preview')
  );
}

function hasRoutePressure(input: BuildOperationEraRuntimePreviewInput): boolean {
  const vehicles = readSignalDomain(input.operationSignals, 'vehicles');
  if (vehicles?.status === 'critical' || vehicles?.status === 'strained') return true;
  if ((vehicles?.score ?? 0) >= 78) return true;
  if (hasActiveRoute(input)) return true;
  const routeBlob = textBlob(input.activeTaskRouteModel) + textBlob(input.resourceFatigue);
  return ['route_pressure', 'vehicle_route'].some((token) => routeBlob.includes(token));
}

function hasContainerPressure(input: BuildOperationEraRuntimePreviewInput): boolean {
  const containers = readSignalDomain(input.operationSignals, 'containers');
  if (containers?.status === 'critical' || containers?.status === 'strained') return true;
  if ((containers?.score ?? 0) >= 78) return true;
  const memory = input.districtMemorySnapshot;
  return (
    memory?.districts.some((entry) =>
      ['repeated_pressure', 'resource_strain'].includes(entry.primaryKind),
    ) ?? false
  );
}

function hasSocialTrustPressure(input: BuildOperationEraRuntimePreviewInput): boolean {
  const trust = input.districtTrustSnapshot;
  const fragile = trust?.districts.some(
    (entry) => entry.band === 'fragile' || entry.band === 'strained',
  );
  const memory = input.districtMemorySnapshot?.districts.some(
    (entry) => entry.primaryKind === 'social_echo' || entry.primaryKind === 'trust_shift',
  );
  const blob = textBlob(input.operationSignals);
  return Boolean(fragile || memory || ['social', 'güven', 'guven', 'complaint'].some((t) => blob.includes(t)));
}

function hasCrisisWatch(input: BuildOperationEraRuntimePreviewInput): boolean {
  const crisisBlob = textBlob(input.crisisState);
  if (!crisisBlob) return false;
  return ['watch', 'elevated', 'active', 'crisis'].some((token) => crisisBlob.includes(token));
}

function hasResourceFatigueHigh(input: BuildOperationEraRuntimePreviewInput): boolean {
  const fatigue = input.resourceFatigue;
  if (!fatigue || typeof fatigue !== 'object') return false;
  const record = fatigue as Record<string, unknown>;
  if (typeof record.level === 'string') {
    return record.level === 'high' || record.level === 'strained';
  }
  if (typeof record.score === 'number') return record.score >= 70;
  if (typeof record.isHigh === 'boolean') return record.isHigh;
  const blob = textBlob(fatigue);
  return blob.includes('fatigue') || blob.includes('yorgun') || blob.includes('strained');
}

function hasRecentImprovement(input: BuildOperationEraRuntimePreviewInput): boolean {
  return (
    input.districtMemorySnapshot?.districts.some(
      (entry) => entry.primaryKind === 'recent_improvement' || entry.primaryKind === 'recovery_window',
    ) ?? false
  );
}

function hasActiveRoute(input: BuildOperationEraRuntimePreviewInput): boolean {
  const route = input.activeTaskRouteModel;
  if (!route) return false;
  if (typeof route === 'object') {
    const record = route as Record<string, unknown>;
    if (typeof record.visible === 'boolean') return record.visible;
    if (typeof record.active === 'boolean') return record.active;
  }
  return true;
}

function selectedActionDomain(input: BuildOperationEraRuntimePreviewInput): string | undefined {
  const day = resolveDay(input);
  const action = input.districtOperationActionState?.selectedByDay?.[day];
  if (!action) return undefined;
  return action.operationKind;
}

function hasContentPackCoverage(
  input: BuildOperationEraRuntimePreviewInput,
  packIds: readonly string[],
): boolean {
  const coverage = input.contentPackCoverage ?? [];
  if (coverage.length === 0) return true;
  return packIds.some((packId) => coverage.includes(packId));
}

export function buildOperationEraPreviewContext(
  input: BuildOperationEraRuntimePreviewInput = {},
): CreviaOperationEraPreviewContext {
  const day = resolveDay(input);
  const districtId = resolveDistrictId(input);
  const trustSnapshot =
    input.districtTrustSnapshot ??
    buildDistrictTrustRuntimeSnapshot({
      day,
      focusDistrictId: districtId,
      operationSignals: input.operationSignals,
      crisisState: input.crisisState,
      resourceFatigue: input.resourceFatigue,
    });
  const memorySnapshot =
    input.districtMemorySnapshot ??
    buildDistrictMemoryRuntimeSnapshot({
      day,
      focusDistrictId: districtId,
      trustSnapshot,
      operationSignals: input.operationSignals,
      crisisState: input.crisisState,
    });

  return {
    currentDay: day,
    selectedDistrictId: districtId,
    rankKey: input.rankKey,
    authorityTrust: input.authorityTrust,
    unlockedPermissionIds: input.unlockedPermissionIds ?? [],
    isPostPilot:
      input.isPostPilot === true ||
      input.isPilotCompleted === true ||
      day >= POST_PILOT_FIRST_OPERATION_DAY,
    isPilotCompleted: input.isPilotCompleted,
    isLimitedMode: input.isLimitedMode ?? (day >= OPERATION_ERA_RUNTIME_PREVIEW_MIN_DAY && !input.isFullMode),
    isFullMode: input.isFullMode ?? day >= POST_PILOT_FIRST_OPERATION_DAY,
    operationSignals: input.operationSignals,
    districtTrustSnapshot: trustSnapshot,
    districtMemorySnapshot: memorySnapshot,
    districtOperationActionState: input.districtOperationActionState ?? undefined,
    activeTaskRouteModel: input.activeTaskRouteModel,
    resourceFatigue: input.resourceFatigue,
    crisisState: input.crisisState,
    storyChainRuntimeHint: input.storyChainRuntimeHint ?? undefined,
    contentPackCoverage: input.contentPackCoverage,
    reportSystemsSummary: input.reportSystemsSummary,
    profileCareerSummary: input.profileCareerSummary,
    recentEraKindIds: input.recentEraKindIds ?? [],
    openEndedPhase: input.openEndedPhase,
  };
}

export function buildOperationEraEligibility(
  input: BuildOperationEraRuntimePreviewInput = {},
): CreviaOperationEraPreviewEligibility {
  const day = resolveDay(input);
  const context = buildOperationEraPreviewContext(input);
  const highRank = isHighRank(input);
  const reasons: string[] = [];

  if (day <= OPERATION_ERA_RUNTIME_PREVIEW_PILOT_MAX_DAY) {
    return {
      visible: false,
      mode: 'hidden',
      isPostPilot: false,
      isLimitedMode: true,
      isFullMode: false,
      isHighRank: highRank,
      reasons: ['pilot_window_hidden'],
    };
  }

  if (day < OPERATION_ERA_RUNTIME_PREVIEW_MIN_DAY) {
    return {
      visible: false,
      mode: 'hidden',
      isPostPilot: false,
      isLimitedMode: true,
      isFullMode: false,
      isHighRank: highRank,
      reasons: ['before_post_pilot_day'],
    };
  }

  let mode: CreviaOperationEraPreviewVisibility = 'compact';
  if (context.isFullMode && highRank) {
    mode = 'detailed';
    reasons.push('high_rank_detailed');
  } else if (context.isFullMode) {
    mode = 'standard';
    reasons.push('main_operation_standard');
  } else {
    mode = 'compact';
    reasons.push('post_pilot_limited_compact');
  }

  if (day <= OPERATION_ERA_RUNTIME_PREVIEW_PILOT_MAX_DAY + 1 && !context.isFullMode) {
    mode = 'pilot_prep';
    reasons.push('pilot_prep_limited');
  }

  return {
    visible: true,
    mode,
    isPostPilot: context.isPostPilot === true,
    isLimitedMode: context.isLimitedMode === true,
    isFullMode: context.isFullMode === true,
    isHighRank: highRank,
    reasons,
  };
}

export function scoreOperationEraPreviewCandidate(
  kind: CreviaOperationEraPreviewKind,
  input: BuildOperationEraRuntimePreviewInput = {},
): CreviaOperationEraScoredPreviewCandidate {
  const definition = getOperationEraRuntimePreviewDefinition(kind);
  const context = buildOperationEraPreviewContext(input);
  const reasons: string[] = [];
  let score = OPERATION_ERA_RUNTIME_PREVIEW_SCORE_WEIGHTS.fallbackBase;

  if (kind === 'route_efficiency_era' && hasRoutePressure(input)) {
    score += OPERATION_ERA_RUNTIME_PREVIEW_SCORE_WEIGHTS.routePressure;
    reasons.push('route_pressure');
  }
  if (kind === 'container_recovery_era' && hasContainerPressure(input)) {
    score += OPERATION_ERA_RUNTIME_PREVIEW_SCORE_WEIGHTS.containerPressure;
    reasons.push('container_pressure');
  }
  if (kind === 'social_trust_era' && hasSocialTrustPressure(input)) {
    score += OPERATION_ERA_RUNTIME_PREVIEW_SCORE_WEIGHTS.socialTrustPressure;
    reasons.push('social_trust_pressure');
  }
  if (kind === 'crisis_prevention_era' && hasCrisisWatch(input)) {
    score += OPERATION_ERA_RUNTIME_PREVIEW_SCORE_WEIGHTS.crisisWatch;
    reasons.push('crisis_watch');
  }
  if (kind === 'resource_balance_era' && hasResourceFatigueHigh(input)) {
    score += OPERATION_ERA_RUNTIME_PREVIEW_SCORE_WEIGHTS.resourceFatigue;
    reasons.push('resource_fatigue');
  }
  if (kind === 'visible_service_era' && hasRecentImprovement(input)) {
    score += OPERATION_ERA_RUNTIME_PREVIEW_SCORE_WEIGHTS.recentImprovement;
    reasons.push('recent_improvement');
  }
  if (kind === 'district_development_era' && hasRecentImprovement(input)) {
    score += 10;
    reasons.push('district_development_signal');
  }
  if (kind === 'open_operation_career_era' && context.isPostPilot) {
    score += OPERATION_ERA_RUNTIME_PREVIEW_SCORE_WEIGHTS.postPilotCareer;
    reasons.push('open_career_post_pilot');
  }

  const actionDomain = selectedActionDomain(input);
  if (actionDomain) {
    if (
      (kind === 'route_efficiency_era' && actionDomain.includes('route')) ||
      (kind === 'container_recovery_era' && actionDomain.includes('container')) ||
      (kind === 'social_trust_era' && actionDomain.includes('social')) ||
      (kind === 'crisis_prevention_era' && actionDomain.includes('crisis')) ||
      (kind === 'district_development_era' && actionDomain.includes('district'))
    ) {
      score += OPERATION_ERA_RUNTIME_PREVIEW_SCORE_WEIGHTS.districtOperationAction;
      reasons.push('district_operation_action');
    }
  }

  if (hasActiveRoute(input) && kind === 'route_efficiency_era') {
    score += OPERATION_ERA_RUNTIME_PREVIEW_SCORE_WEIGHTS.activeRoute;
    reasons.push('active_route');
  }

  const chainKind = context.storyChainRuntimeHint?.chainKind;
  if (chainKind && definition.recommendedStoryChainKinds.includes(chainKind)) {
    score += OPERATION_ERA_RUNTIME_PREVIEW_SCORE_WEIGHTS.storyChainBias;
    reasons.push('story_chain_bias');
  }

  if (hasContentPackCoverage(input, definition.relatedContentPacks)) {
    score += OPERATION_ERA_RUNTIME_PREVIEW_SCORE_WEIGHTS.contentPackCoverage;
    reasons.push('content_pack_coverage');
  } else {
    score -= 6;
    reasons.push('content_pack_gap');
  }

  if ((context.recentEraKindIds ?? []).includes(kind)) {
    score -= OPERATION_ERA_RUNTIME_PREVIEW_SCORE_WEIGHTS.freshnessPenalty;
    reasons.push('freshness_penalty');
  }

  return { kind, score: Math.max(0, score), reasons };
}

const DOMAIN_SCORE_REASONS = new Set([
  'route_pressure',
  'container_pressure',
  'social_trust_pressure',
  'crisis_watch',
  'resource_fatigue',
  'recent_improvement',
  'district_development_signal',
  'district_operation_action',
  'active_route',
  'story_chain_bias',
]);

export function resolveOperationEraPreviewKind(
  input: BuildOperationEraRuntimePreviewInput = {},
): CreviaOperationEraPreviewKind {
  const eligibility = buildOperationEraEligibility(input);
  if (!eligibility.visible) return 'open_operation_career_era';

  const scored = OPERATION_ERA_RUNTIME_PREVIEW_KINDS.filter((kind) => kind !== 'open_operation_career_era')
    .map((kind) => scoreOperationEraPreviewCandidate(kind, input))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  const hasDomainSignal = best?.reasons.some((reason) => DOMAIN_SCORE_REASONS.has(reason)) ?? false;
  if (!best || best.score < 12 || !hasDomainSignal) {
    return 'open_operation_career_era';
  }
  return best.kind;
}

export function buildOperationEraFallbackPreview(
  input: BuildOperationEraRuntimePreviewInput = {},
): CreviaOperationEraRuntimePreviewModel {
  return buildOperationEraRuntimePreviewModel({
    ...input,
    recentEraKindIds: [...(input.recentEraKindIds ?? []), 'open_operation_career_era'],
  });
}

function deriveStatus(
  eligibility: CreviaOperationEraPreviewEligibility,
): CreviaOperationEraPreviewStatus {
  if (!eligibility.visible) return 'hidden';
  if (eligibility.mode === 'pilot_prep') return 'pilot_prep';
  if (eligibility.mode === 'compact') return 'compact';
  if (eligibility.mode === 'detailed') return 'detailed';
  if (eligibility.mode === 'standard') return 'standard';
  return 'preview';
}

function deriveHealth(
  kind: CreviaOperationEraPreviewKind,
  score: number,
  eligibility: CreviaOperationEraPreviewEligibility,
  input: BuildOperationEraRuntimePreviewInput,
): CreviaOperationEraPreviewHealthStatus {
  if (!eligibility.visible) return 'blocked';
  if (kind === 'open_operation_career_era') return 'fallback';
  if (score < 15) return 'limited';
  if (hasCrisisWatch(input)) return 'watch';
  return 'healthy';
}

export function buildOperationEraPreviewDebugRows(
  model: CreviaOperationEraRuntimePreviewModel,
  input: BuildOperationEraRuntimePreviewInput = {},
): string[] {
  const day = resolveDay(input);
  return [
    `day: ${day}`,
    `visible: ${model.visible}`,
    `status: ${model.status}`,
    `visibility: ${model.visibility}`,
    `kind: ${model.kind}`,
    `score: ${model.score}`,
    `health: ${model.healthStatus}`,
    `hub: ${model.hubLine?.text?.slice(0, 40) ?? 'hidden'}`,
    `report: ${model.reportLine?.text?.slice(0, 40) ?? 'hidden'}`,
    `profile: ${model.profileLine?.text?.slice(0, 40) ?? 'hidden'}`,
    `map: ${model.mapLine?.text?.slice(0, 40) ?? 'hidden'}`,
    `reasons: ${model.scoreReasons.join(',')}`,
    `suppressed: ${model.suppressionReasons.length}`,
  ];
}

export function buildOperationEraRuntimePreviewModel(
  input: BuildOperationEraRuntimePreviewInput = {},
): CreviaOperationEraRuntimePreviewModel {
  const eligibility = buildOperationEraEligibility(input);
  const kind = eligibility.visible ? resolveOperationEraPreviewKind(input) : 'open_operation_career_era';
  const scored = scoreOperationEraPreviewCandidate(kind, input);
  const definition = getOperationEraRuntimePreviewDefinition(kind);
  const status = deriveStatus(eligibility);
  const healthStatus = deriveHealth(kind, scored.score, eligibility, input);

  const empty: CreviaOperationEraRuntimePreviewModel = {
    visible: false,
    status: 'hidden',
    visibility: eligibility.mode,
    healthStatus: 'blocked',
    kind,
    label: definition.label,
    shortLabel: definition.shortLabel,
    score: scored.score,
    scoreReasons: scored.reasons,
    eligibility,
    isRuntimeLinked: false,
    suppressionReasons: eligibility.visible ? [] : eligibility.reasons,
    debugRows: [],
  };

  if (!eligibility.visible || eligibility.mode === 'hidden') {
    return { ...empty, debugRows: buildOperationEraPreviewDebugRows(empty, input) };
  }

  const model: CreviaOperationEraRuntimePreviewModel = {
    visible: true,
    status,
    visibility: eligibility.mode,
    healthStatus,
    kind,
    label: definition.label,
    shortLabel: definition.shortLabel,
    score: scored.score,
    scoreReasons: scored.reasons,
    eligibility,
    isRuntimeLinked: false,
    suppressionReasons: [],
    debugRows: [],
  };

  return { ...model, debugRows: buildOperationEraPreviewDebugRows(model, input) };
}
