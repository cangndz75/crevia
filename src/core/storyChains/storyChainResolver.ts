import { DISTRICT_IDENTITIES } from '@/core/districts/districtIdentityConstants';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { normalizeMapDistrictId } from '@/core/districts/districtIdentityPresentation';

import {
  STORY_CHAIN_SCORE_WEIGHTS,
  deriveStoryChainHealthStatus,
  isStoryChainDayOneBlocked,
} from './storyChainConstants';
import {
  STORY_CHAIN_TEMPLATES,
  getStoryChainTemplateById,
  getStoryChainTemplatesByDistrict,
  isKnownContentPackEventFamilyId,
} from './storyChainTemplates';
import type {
  CreviaResolvedStoryChain,
  CreviaStoryChainContext,
  CreviaStoryChainDebugRow,
  CreviaStoryChainScoredCandidate,
  CreviaStoryChainStatus,
  CreviaStoryChainStep,
  CreviaStoryChainStepPreview,
  CreviaStoryChainTemplate,
} from './storyChainTypes';

const RECOVERY_CHAIN_KINDS = new Set(['social_trust_chain', 'district_recovery_chain', 'container_recovery_chain']);
const ROUTE_CHAIN_KINDS = new Set(['route_pressure_chain', 'operation_followup_chain']);

function normalizeDistrictId(value?: string): MapDistrictId | undefined {
  if (!value) return undefined;
  return normalizeMapDistrictId(value) ?? undefined;
}

function districtName(districtId: MapDistrictId): string {
  return DISTRICT_IDENTITIES[districtId]?.name ?? districtId;
}

function sharedDomains(a: readonly string[], b: readonly string[]): string[] {
  const setB = new Set(b);
  return a.filter((domain) => setB.has(domain));
}

function getTrustBand(context: CreviaStoryChainContext, districtId: MapDistrictId): string | undefined {
  const snapshot = context.districtTrustSnapshot;
  if (!snapshot) return undefined;
  return snapshot.districts.find((entry) => entry.districtId === districtId)?.band;
}

function getMemoryKind(context: CreviaStoryChainContext, districtId: MapDistrictId): string | undefined {
  const snapshot = context.districtMemorySnapshot;
  if (!snapshot) return undefined;
  return snapshot.districts.find((entry) => entry.districtId === districtId)?.primaryKind;
}

function isResourceFatigueHigh(context: CreviaStoryChainContext): boolean {
  const fatigue = context.resourceFatigue;
  if (!fatigue || typeof fatigue !== 'object') return false;
  const record = fatigue as Record<string, unknown>;
  if (typeof record.level === 'string') {
    return record.level === 'high' || record.level === 'strained';
  }
  if (typeof record.score === 'number') return record.score >= 70;
  if (typeof record.isHigh === 'boolean') return record.isHigh;
  return false;
}

function isCrisisWatchActive(context: CreviaStoryChainContext): boolean {
  const crisis = context.crisisState;
  if (!crisis || typeof crisis !== 'object') return false;
  const record = crisis as Record<string, unknown>;
  if (typeof record.watchActive === 'boolean') return record.watchActive;
  if (typeof record.level === 'string') return record.level === 'watch' || record.level === 'elevated';
  if (Array.isArray(record.signals)) return record.signals.length > 0;
  return false;
}

function hasActiveRouteHint(context: CreviaStoryChainContext): boolean {
  const route = context.activeRouteHint;
  if (!route) return false;
  if (typeof route === 'string') return route.length > 0;
  if (typeof route === 'object') {
    const record = route as Record<string, unknown>;
    if (typeof record.active === 'boolean') return record.active;
    if (typeof record.routeId === 'string') return record.routeId.length > 0;
  }
  return true;
}

export function buildStoryChainContext(input: Partial<CreviaStoryChainContext> = {}): CreviaStoryChainContext {
  return {
    currentDay: input.currentDay ?? 1,
    selectedDistrictId: input.selectedDistrictId,
    eventFamilyId: input.eventFamilyId,
    eventFamilyDomains: input.eventFamilyDomains ?? [],
    variantKind: input.variantKind,
    districtTrustSnapshot: input.districtTrustSnapshot,
    districtMemorySnapshot: input.districtMemorySnapshot,
    districtOperationsRecommendation: input.districtOperationsRecommendation,
    districtOperationActionState: input.districtOperationActionState,
    operationSignals: input.operationSignals,
    resourceFatigue: input.resourceFatigue,
    crisisState: input.crisisState,
    recentEventExposure: input.recentEventExposure,
    activeRouteHint: input.activeRouteHint,
    contentPackMetadata: input.contentPackMetadata,
    recentChainKindIds: input.recentChainKindIds ?? [],
    rankKey: input.rankKey,
    unlockedPermissionIds: input.unlockedPermissionIds ?? [],
  };
}

export function scoreStoryChainTemplate(
  template: CreviaStoryChainTemplate,
  context: CreviaStoryChainContext,
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  const focusDistrict = normalizeDistrictId(context.selectedDistrictId?.toString());
  const templateDistrict = focusDistrict && template.districtIds.includes(focusDistrict) ? focusDistrict : template.districtIds[0]!;

  if (focusDistrict && template.districtIds.includes(focusDistrict)) {
    score += STORY_CHAIN_SCORE_WEIGHTS.districtMatch;
    reasons.push('district_match');
  }

  const domainOverlap = sharedDomains(template.relatedDomains, context.eventFamilyDomains ?? []);
  if (domainOverlap.length > 0) {
    score += STORY_CHAIN_SCORE_WEIGHTS.domainMatch;
    reasons.push(`domain_match:${domainOverlap[0]}`);
  }

  if (context.eventFamilyId && template.relatedEventFamilyIds.includes(context.eventFamilyId)) {
    score += STORY_CHAIN_SCORE_WEIGHTS.eventFamilyMatch;
    reasons.push('event_family_match');
  } else if (context.eventFamilyId && !isKnownContentPackEventFamilyId(context.eventFamilyId)) {
    reasons.push('event_family_fallback');
  }

  const memoryKind = getMemoryKind(context, templateDistrict);
  if (memoryKind === 'unresolved_carry_over' || memoryKind === 'repeated_pressure') {
    score += STORY_CHAIN_SCORE_WEIGHTS.memoryFollowUp;
    reasons.push(`memory_follow_up:${memoryKind}`);
  }

  const trustBand = getTrustBand(context, templateDistrict);
  if (trustBand && (trustBand === 'fragile' || trustBand === 'strained') && RECOVERY_CHAIN_KINDS.has(template.kind)) {
    score += STORY_CHAIN_SCORE_WEIGHTS.trustRecovery;
    reasons.push(`trust_recovery:${trustBand}`);
  }
  if (trustBand && (trustBand === 'improving' || trustBand === 'recovering')) {
    score += STORY_CHAIN_SCORE_WEIGHTS.trustImprovement;
    reasons.push(`trust_improvement:${trustBand}`);
  }

  if (isResourceFatigueHigh(context) && template.kind === 'resource_fatigue_chain') {
    score += STORY_CHAIN_SCORE_WEIGHTS.resourceFatigue;
    reasons.push('resource_fatigue_high');
  }

  if (isCrisisWatchActive(context) && template.kind === 'crisis_watch_chain') {
    score += STORY_CHAIN_SCORE_WEIGHTS.crisisWatch;
    reasons.push('crisis_watch_active');
  }

  if (hasActiveRouteHint(context) && ROUTE_CHAIN_KINDS.has(template.kind)) {
    score += STORY_CHAIN_SCORE_WEIGHTS.activeRoute;
    reasons.push('active_route_bonus');
  }

  if (context.recentChainKindIds?.includes(template.kind)) {
    score -= STORY_CHAIN_SCORE_WEIGHTS.freshnessPenalty;
    reasons.push('freshness_penalty');
  }

  if (isStoryChainDayOneBlocked(context.currentDay)) {
    score = Math.min(score, 5);
    reasons.push('day_one_capped');
  }

  return { score: Math.max(0, score), reasons };
}

export function resolveStoryChainCandidates(
  context: CreviaStoryChainContext,
): CreviaStoryChainScoredCandidate[] {
  return STORY_CHAIN_TEMPLATES.map((template) => {
    const scored = scoreStoryChainTemplate(template, context);
    return {
      templateId: template.id,
      kind: template.kind,
      score: scored.score,
      reasons: scored.reasons,
    };
  }).sort((a, b) => b.score - a.score);
}

function deriveChainStatus(context: CreviaStoryChainContext, score: number): CreviaStoryChainStatus {
  if (isStoryChainDayOneBlocked(context.currentDay)) return 'blocked';
  if (score <= 0) return 'preview';
  if (score < 20) return 'preview';
  if (score < 35) return 'candidate';
  if (score < 50) return 'active_hint';
  return 'continued';
}

function mapSteps(template: CreviaStoryChainTemplate, currentStepIndex: number): CreviaStoryChainStep[] {
  return template.steps.map((step, index) => ({
    stepIndex: index,
    stepKind: step.stepKind,
    dayOffset: step.dayOffset,
    title: step.title,
    shortLine: step.shortLine,
    eventFamilyIntent: step.eventFamilyIntent,
    variantBias: step.variantBias,
    districtMemoryIntent: step.districtMemoryIntent,
    districtTrustIntent: step.districtTrustIntent,
    relatedEventFamilyId: step.relatedEventFamilyId,
    hints: step.hints,
    isCurrentStep: index === currentStepIndex,
    isFutureStep: index > currentStepIndex,
  }));
}

export function buildResolvedStoryChain(
  template: CreviaStoryChainTemplate,
  context: CreviaStoryChainContext,
  overrides: Partial<Pick<CreviaResolvedStoryChain, 'status' | 'currentStepIndex'>> = {},
): CreviaResolvedStoryChain {
  const scored = scoreStoryChainTemplate(template, context);
  const focusDistrict = normalizeDistrictId(context.selectedDistrictId?.toString());
  const districtId =
    focusDistrict && template.districtIds.includes(focusDistrict) ? focusDistrict : template.districtIds[0]!;
  const status = overrides.status ?? deriveChainStatus(context, scored.score);
  const currentStepIndex = overrides.currentStepIndex ?? 0;
  const isComplexityHidden = isStoryChainDayOneBlocked(context.currentDay);
  const isFallback = !context.districtTrustSnapshot && !context.districtMemorySnapshot;

  return {
    id: template.id,
    kind: template.kind,
    status,
    healthStatus: deriveStoryChainHealthStatus(status, isFallback),
    title: template.title,
    shortLabel: template.shortLabel,
    districtId,
    districtName: districtName(districtId),
    currentDay: context.currentDay,
    stepCount: template.steps.length,
    currentStepIndex,
    steps: mapSteps(template, currentStepIndex),
    score: scored.score,
    scoreReasons: scored.reasons,
    memoryIntent: template.memoryIntent,
    trustIntent: template.trustIntent,
    freshnessIntent: template.freshnessIntent,
    isRuntimeLinked: false,
    isComplexityHidden,
    reasonLine: isComplexityHidden
      ? 'Ilk gun zincir onizlemesi sinirli.'
      : `${template.shortLabel}: ${template.steps[currentStepIndex]?.shortLine ?? template.memoryIntent}`,
  };
}

export function resolveStoryChainForDistrict(
  districtId: MapDistrictId | string,
  context: Partial<CreviaStoryChainContext> = {},
): CreviaResolvedStoryChain | null {
  const normalized = normalizeDistrictId(districtId.toString());
  if (!normalized) return null;

  const fullContext = buildStoryChainContext({ ...context, selectedDistrictId: normalized });
  const templates = getStoryChainTemplatesByDistrict(normalized);
  if (templates.length === 0) return null;

  const best = templates
    .map((template) => ({ template, scored: scoreStoryChainTemplate(template, fullContext) }))
    .sort((a, b) => b.scored.score - a.scored.score)[0];

  if (!best) return null;
  return buildResolvedStoryChain(best.template, fullContext);
}

export function resolveStoryChainForEventFamily(
  eventFamilyId: string,
  context: Partial<CreviaStoryChainContext> = {},
): CreviaResolvedStoryChain | null {
  const template =
    STORY_CHAIN_TEMPLATES.find((entry) => entry.relatedEventFamilyIds.includes(eventFamilyId)) ??
    getStoryChainTemplateById('resource_fatigue_balance_chain');

  const fullContext = buildStoryChainContext({ ...context, eventFamilyId });
  return buildResolvedStoryChain(template!, fullContext);
}

export function buildStoryChainStepPreview(
  templateId: string,
  stepIndex: number,
): CreviaStoryChainStepPreview | null {
  const template = getStoryChainTemplateById(templateId);
  if (!template) return null;
  const step = template.steps[stepIndex];
  if (!step) return null;

  return {
    chainId: template.id,
    stepIndex,
    stepKind: step.stepKind,
    title: step.title,
    shortLine: step.shortLine,
    dayOffset: step.dayOffset,
    hints: step.hints,
  };
}

export function buildStoryChainDebugRows(context: Partial<CreviaStoryChainContext> = {}): CreviaStoryChainDebugRow[] {
  const fullContext = buildStoryChainContext(context);
  return resolveStoryChainCandidates(fullContext).map((candidate) => {
    const template = getStoryChainTemplateById(candidate.templateId)!;
    const resolved = buildResolvedStoryChain(template, fullContext);
    return {
      templateId: candidate.templateId,
      kind: candidate.kind,
      districtIds: template.districtIds.join(','),
      score: candidate.score,
      status: resolved.status,
      topReason: candidate.reasons[0] ?? 'baseline',
    };
  });
}
