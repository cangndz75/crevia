import { CONTENT_PRODUCTION_VERIFY_PACK } from '@/core/contentProduction/contentPackSchema';
import { compareContentItemSimilarity } from '@/core/contentProduction/contentDuplicateGuard';
import { evaluateEchoCompleteness } from '@/core/contentProduction/contentEchoCompleteness';
import { contentProductionCopyContainsForbiddenTerms } from '@/core/contentProduction/contentProductionPresentation';
import type { CreviaContentPackDefinition, CreviaContentPackItem } from '@/core/contentProduction/contentProductionTypes';
import {
  buildOperationEraCandidate,
  getOperationEraContentWeightHints,
  getOperationEraDefinition,
} from '@/core/operationEra/operationEraModel';
import type { OperationEraContentWeightHints } from '@/core/operationEra/operationEraTypes';

import {
  EVENT_SELECTION_HEAVY_DOMAINS,
  EVENT_SELECTION_HEAVY_TAGS,
  EVENT_SELECTION_PANIC_WORDING_TERMS,
  EVENT_SELECTION_PHASE_DOMAIN_AFFINITY,
  EVENT_SELECTION_PLAYER_STYLE_DOMAIN_AFFINITY,
  EVENT_SELECTION_SCORE_RANGE,
  EVENT_SELECTION_TUTORIAL_MAX_DAY,
  EVENT_SELECTION_WEIGHTS,
} from './eventSelectionConstants';
import { buildEventSelectionContextFromGameState, buildEventSelectionSignalSnapshot } from './eventSelectionSignals';
import {
  applyStrategicBiasToRankedEventSelection,
  type Day8OperationFeedBindingResult,
} from '@/core/day8OperationFeedBinding';
import {
  buildEventSelectionDebugReport,
  buildEventSelectionSummaryLine,
} from './eventSelectionPresentation';
import type {
  CreviaEventSelectionCandidate,
  CreviaEventSelectionCandidateKind,
  CreviaEventSelectionContext,
  CreviaEventSelectionDecision,
  CreviaEventSelectionHealthStatus,
  CreviaEventSelectionRecommendation,
  CreviaEventSelectionRecommendedVariantKind,
  CreviaEventSelectionResult,
  CreviaEventSelectionWeightBreakdown,
} from './eventSelectionTypes';

function clampScore(score: number): number {
  return Math.min(
    EVENT_SELECTION_SCORE_RANGE.max,
    Math.max(EVENT_SELECTION_SCORE_RANGE.min, Math.round(score)),
  );
}

function stableHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function itemKind(surface: CreviaContentPackItem['surface']): CreviaEventSelectionCandidateKind {
  if (surface === 'event_family' || surface === 'event_variant') return 'event_family';
  if (surface === 'district_operation') return 'district_operation_hint';
  return 'operation_era_context';
}

function isHeavyItem(item: CreviaContentPackItem): boolean {
  return (
    item.domains.some((domain) => EVENT_SELECTION_HEAVY_DOMAINS.includes(domain as never)) ||
    item.tags.some((tag) => EVENT_SELECTION_HEAVY_TAGS.includes(tag as never))
  );
}

function hasForbiddenPlayerCopy(item: CreviaContentPackItem): boolean {
  return item.copyBlocks.some(
    (block) => block.isPlayerFacing && contentProductionCopyContainsForbiddenTerms(block.text),
  );
}

function resolveEventFamilyId(item: CreviaContentPackItem): string | undefined {
  return (
    item.eventFamilyIds?.[0] ??
    (item.surface === 'event_family' ? item.id.replace('cp_item_ef_', '') : undefined)
  );
}

function mapItemToCandidateBase(
  item: CreviaContentPackItem,
  kind: CreviaEventSelectionCandidateKind,
): Omit<CreviaEventSelectionCandidate, 'score' | 'weightBreakdown' | 'recommendedVariantKind'> {
  const blocked = hasForbiddenPlayerCopy(item);
  return {
    id: `sel_${item.id}`,
    kind,
    sourceItemId: item.id,
    eventFamilyId: kind === 'event_family' ? resolveEventFamilyId(item) : undefined,
    operationEraId: kind === 'operation_era_context' ? item.operationEraIds[0] : undefined,
    districtOperationKind:
      kind === 'district_operation_hint' ? String(item.metadata?.kind ?? item.tags[0]) : undefined,
    districtIds: [...item.districtIds],
    domains: [...item.domains],
    title: item.title,
    tags: [...item.tags],
    isBlocked: blocked,
    blockReason: blocked ? 'Player-facing forbidden copy detected.' : undefined,
    isSelectablePrimary: kind === 'event_family' && !blocked,
    isHeavyForTutorial: isHeavyItem(item),
  };
}

function countRecent(values: readonly string[], target: string): number {
  return values.filter((value) => value === target).length;
}

function resolveEraWeightHints(
  context: CreviaEventSelectionContext,
): OperationEraContentWeightHints | undefined {
  if (!context.operationEraId) return undefined;
  const definition = getOperationEraDefinition(context.operationEraId);
  if (!definition) return undefined;
  const candidate = buildOperationEraCandidate(definition, {
    day: context.day ?? 1,
    openEndedPhase: context.operationCareerPhase,
    unlockedPermissionIds: context.unlockedPermissionIds,
  });
  return getOperationEraContentWeightHints(candidate);
}

export function resolveRecommendedVariantKind(
  context: CreviaEventSelectionContext,
  candidate: Pick<CreviaEventSelectionCandidate, 'domains' | 'tags'>,
): CreviaEventSelectionRecommendedVariantKind {
  const recent = context.recentVariantKinds ?? [];
  const trust = context.districtTrustBand ?? 'unknown';
  const crisis = context.crisisRiskBand ?? 'low';
  const resource = context.resourcePressureBand ?? 'medium';

  if (context.operationEraId) return 'operation_era';
  if (recent.includes('carry_over') || (context.recentDomainIds ?? []).length >= 3) return 'carry_over';
  if (resource === 'high' || resource === 'critical') return 'resource_fatigue';
  if (crisis === 'high' || crisis === 'critical') return 'crisis_adjacent';
  if (trust === 'fragile' || trust === 'watch') {
    if (candidate.domains.includes('resource_recovery')) return 'comeback';
    return 'district_trust';
  }
  if (trust === 'trusted' || trust === 'stable') {
    if (resource === 'low') return 'reward';
    return 'improved';
  }
  return 'normal';
}

export function scoreEventSelectionCandidate(
  candidate: Omit<CreviaEventSelectionCandidate, 'score' | 'weightBreakdown' | 'recommendedVariantKind'>,
  context: CreviaEventSelectionContext,
  item: CreviaContentPackItem,
  allItems: readonly CreviaContentPackItem[],
  eraWeightHints?: OperationEraContentWeightHints,
): {
  score: number;
  breakdown: CreviaEventSelectionWeightBreakdown;
  recommendedVariantKind: CreviaEventSelectionRecommendedVariantKind;
} {
  const snapshot = buildEventSelectionSignalSnapshot(context);
  const breakdown: CreviaEventSelectionWeightBreakdown = {
    districtRelevance: 0,
    domainRelevance: 0,
    operationPhaseRelevance: 0,
    rankUnlockRelevance: 0,
    operationEraRelevance: 0,
    resourcePressureRelevance: 0,
    districtTrustRelevance: 0,
    crisisRelevance: 0,
    playerStyleRelevance: 0,
    freshnessPenalty: 0,
    duplicatePenalty: 0,
    echoCompletenessBonus: 0,
    contentQualityBonus: 0,
    mobileReadinessBonus: 0,
    total: 0,
  };

  if (candidate.isBlocked) {
    breakdown.total = 0;
    return { score: 0, breakdown, recommendedVariantKind: 'normal' };
  }

  if (snapshot.districtId && candidate.districtIds.includes(snapshot.districtId)) {
    breakdown.districtRelevance = EVENT_SELECTION_WEIGHTS.districtRelevance;
  } else if (candidate.districtIds.length === 0 && candidate.kind === 'operation_era_context') {
    breakdown.districtRelevance = EVENT_SELECTION_WEIGHTS.districtRelevance / 2;
  }

  const focusDomain = snapshot.recentExposure.domainIds[0] ?? context.recentDomainIds?.[0];
  if (focusDomain && candidate.domains.includes(focusDomain)) {
    breakdown.domainRelevance = EVENT_SELECTION_WEIGHTS.domainRelevance;
  } else if (candidate.domains.length > 0) {
    breakdown.domainRelevance = EVENT_SELECTION_WEIGHTS.domainRelevance / 2;
  }

  const phaseDomains = EVENT_SELECTION_PHASE_DOMAIN_AFFINITY[snapshot.operationCareerPhase] ?? [];
  if (candidate.domains.some((domain) => phaseDomains.includes(domain))) {
    breakdown.operationPhaseRelevance = EVENT_SELECTION_WEIGHTS.operationPhaseRelevance;
  }

  if (item.rankPermissionIds?.some((id) => (context.unlockedPermissionIds ?? []).includes(id))) {
    breakdown.rankUnlockRelevance = EVENT_SELECTION_WEIGHTS.rankUnlockRelevance;
  }

  if (eraWeightHints) {
    if (candidate.domains.some((d) => eraWeightHints.preferredEventFamilyDomains.includes(d as never))) {
      breakdown.operationEraRelevance = EVENT_SELECTION_WEIGHTS.operationEraRelevance;
    }
  } else if (context.operationEraId && item.operationEraIds.includes(context.operationEraId)) {
    breakdown.operationEraRelevance = EVENT_SELECTION_WEIGHTS.operationEraRelevance;
  }

  const resourceBand = snapshot.resourcePressureBand ?? 'medium';
  if (
    (resourceBand === 'high' || resourceBand === 'critical') &&
    ['vehicle_route', 'container', 'resource_recovery', 'personnel'].some((d) =>
      candidate.domains.includes(d),
    )
  ) {
    breakdown.resourcePressureRelevance = EVENT_SELECTION_WEIGHTS.resourcePressureRelevance;
  }

  const trust = snapshot.districtTrustBand ?? 'unknown';
  if (
    (trust === 'fragile' || trust === 'watch') &&
    ['social', 'district_balance', 'resource_recovery'].some((d) => candidate.domains.includes(d))
  ) {
    breakdown.districtTrustRelevance = EVENT_SELECTION_WEIGHTS.districtTrustRelevance;
  } else if (trust === 'stable' || trust === 'trusted') {
    breakdown.districtTrustRelevance = EVENT_SELECTION_WEIGHTS.districtTrustRelevance / 2;
  }

  const crisis = snapshot.crisisRiskBand ?? 'low';
  if ((crisis === 'high' || crisis === 'critical') && candidate.domains.includes('crisis_adjacent')) {
    breakdown.crisisRelevance = EVENT_SELECTION_WEIGHTS.crisisRelevance;
  }

  const styleDomains =
    EVENT_SELECTION_PLAYER_STYLE_DOMAIN_AFFINITY[snapshot.playerStyleId] ?? ['generic_operation'];
  if (candidate.domains.some((domain) => styleDomains.includes(domain))) {
    breakdown.playerStyleRelevance = EVENT_SELECTION_WEIGHTS.playerStyleRelevance;
  }

  const familyId = candidate.eventFamilyId;
  if (familyId && snapshot.recentExposure.familyIds.includes(familyId)) {
    breakdown.freshnessPenalty += EVENT_SELECTION_WEIGHTS.freshnessFamilyPenalty;
  }

  for (const districtId of candidate.districtIds) {
    const recentCount = countRecent(snapshot.recentExposure.districtIds, districtId);
    if (recentCount >= 2) breakdown.freshnessPenalty += EVENT_SELECTION_WEIGHTS.freshnessDistrictPenalty;
  }

  for (const domain of candidate.domains) {
    const recentCount = countRecent(snapshot.recentExposure.domainIds, domain);
    if (recentCount >= 2) breakdown.freshnessPenalty += EVENT_SELECTION_WEIGHTS.freshnessDomainPenalty;
  }

  let maxSimilarity = 0;
  for (const other of allItems) {
    if (other.id === item.id) continue;
    maxSimilarity = Math.max(maxSimilarity, compareContentItemSimilarity(item, other));
  }
  if (maxSimilarity >= 0.82) breakdown.duplicatePenalty = EVENT_SELECTION_WEIGHTS.duplicatePenalty;
  else if (maxSimilarity >= 0.65) breakdown.duplicatePenalty = EVENT_SELECTION_WEIGHTS.duplicatePenalty / 2;

  const echo = evaluateEchoCompleteness(item);
  if (echo.status === 'pass') breakdown.echoCompletenessBonus = EVENT_SELECTION_WEIGHTS.echoCompletenessBonus;
  else if (echo.status === 'warn') breakdown.echoCompletenessBonus = EVENT_SELECTION_WEIGHTS.echoCompletenessBonus / 2;

  if (item.tags.includes('echo_ready') || item.tags.includes('mobile_clear')) {
    breakdown.contentQualityBonus = EVENT_SELECTION_WEIGHTS.contentQualityBonus;
  }

  if (item.title.length <= 56) breakdown.mobileReadinessBonus = EVENT_SELECTION_WEIGHTS.mobileReadinessBonus;

  if ((context.day ?? 1) <= EVENT_SELECTION_TUTORIAL_MAX_DAY && candidate.isHeavyForTutorial) {
    breakdown.freshnessPenalty += 25;
  }

  const positive =
    breakdown.districtRelevance +
    breakdown.domainRelevance +
    breakdown.operationPhaseRelevance +
    breakdown.rankUnlockRelevance +
    breakdown.operationEraRelevance +
    breakdown.resourcePressureRelevance +
    breakdown.districtTrustRelevance +
    breakdown.crisisRelevance +
    breakdown.playerStyleRelevance +
    breakdown.echoCompletenessBonus +
    breakdown.contentQualityBonus +
    breakdown.mobileReadinessBonus;

  breakdown.total = clampScore(positive - breakdown.freshnessPenalty - breakdown.duplicatePenalty);

  return {
    score: breakdown.total,
    breakdown,
    recommendedVariantKind: resolveRecommendedVariantKind(context, candidate),
  };
}

export function buildEventSelectionCandidates(
  context: CreviaEventSelectionContext,
  pack: CreviaContentPackDefinition = CONTENT_PRODUCTION_VERIFY_PACK,
): CreviaEventSelectionCandidate[] {
  const eraWeightHints = resolveEraWeightHints(context);

  return pack.items.map((item) => {
    const kind = itemKind(item.surface);
    const base = mapItemToCandidateBase(item, kind);
    const scored = scoreEventSelectionCandidate(base, context, item, pack.items, eraWeightHints);
    return {
      ...base,
      score: scored.score,
      weightBreakdown: scored.breakdown,
      recommendedVariantKind: scored.recommendedVariantKind,
    };
  });
}

function deterministicSortKey(
  candidate: CreviaEventSelectionCandidate,
  context: CreviaEventSelectionContext,
): number {
  return stableHash(`${context.day ?? 0}|${context.districtId ?? ''}|${candidate.id}|${candidate.score}`);
}

export function rankEventSelectionCandidates(
  candidates: readonly CreviaEventSelectionCandidate[],
  context: CreviaEventSelectionContext,
  strategicBias?: Day8OperationFeedBindingResult | null,
): CreviaEventSelectionCandidate[] {
  if (strategicBias?.isActive && strategicBias.biases.length > 0) {
    return applyStrategicBiasToRankedEventSelection(candidates, strategicBias.biases);
  }
  return [...candidates].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return deterministicSortKey(a, context) - deterministicSortKey(b, context);
  });
}

export function selectEventFamilyCandidate(
  ranked: readonly CreviaEventSelectionCandidate[],
  context: CreviaEventSelectionContext,
): CreviaEventSelectionCandidate | undefined {
  return ranked.find(
    (candidate) =>
      candidate.kind === 'event_family' &&
      candidate.isSelectablePrimary &&
      !candidate.isBlocked &&
      !((context.day ?? 1) <= EVENT_SELECTION_TUTORIAL_MAX_DAY && candidate.isHeavyForTutorial),
  );
}

function resolveHealthStatus(
  rankedPrimary: readonly CreviaEventSelectionCandidate[],
): CreviaEventSelectionHealthStatus {
  const selectable = rankedPrimary.filter((c) => c.isSelectablePrimary && !c.isBlocked);
  if (selectable.length === 0) return 'blocked';
  const top = selectable[0]?.score ?? 0;
  if (top >= 70) return 'healthy';
  if (top >= 45) return 'watch';
  return 'strained';
}

export function buildEventSelectionResult(
  context: CreviaEventSelectionContext,
  pack: CreviaContentPackDefinition = CONTENT_PRODUCTION_VERIFY_PACK,
  strategicBias?: Day8OperationFeedBindingResult | null,
): CreviaEventSelectionResult {
  const candidates = buildEventSelectionCandidates(context, pack);
  const rankedCandidates = rankEventSelectionCandidates(candidates, context, strategicBias);
  const primaryCandidates = rankedCandidates.filter((c) => c.kind === 'event_family');
  const operationEraHints = rankedCandidates.filter((c) => c.kind === 'operation_era_context');
  const districtOperationHints = rankedCandidates.filter((c) => c.kind === 'district_operation_hint');
  const selected = selectEventFamilyCandidate(rankedCandidates, context);

  const decision: CreviaEventSelectionDecision = {
    selectedCandidateId: selected?.id,
    selectedEventFamilyId: selected?.eventFamilyId,
    recommendedVariantKind: selected?.recommendedVariantKind,
    operationEraHintId: operationEraHints[0]?.operationEraId,
    districtOperationHintId: districtOperationHints[0]?.sourceItemId,
    reasonLine: selected
      ? `${selected.title} seçildi; ${selected.domains.join(', ')} odağı.`
      : 'Uygun primary event family candidate bulunamadı.',
  };

  return {
    context,
    signalSnapshot: buildEventSelectionSignalSnapshot(context),
    healthStatus: resolveHealthStatus(primaryCandidates),
    candidates,
    rankedCandidates,
    primaryCandidates,
    decision,
    operationEraHints,
    districtOperationHints,
  };
}

export function buildEventSelectionRecommendationForDay(
  gameState: unknown,
  extras: Partial<CreviaEventSelectionContext> = {},
): CreviaEventSelectionRecommendation {
  const context = buildEventSelectionContextFromGameState(gameState, extras);
  const result = buildEventSelectionResult(context);
  return {
    summaryLine: buildEventSelectionSummaryLine(result),
    eventFamilyId: result.decision.selectedEventFamilyId,
    districtId: context.districtId,
    recommendedVariantKind: result.decision.recommendedVariantKind,
    isRuntimeHintOnly: true,
    debugReport: buildEventSelectionDebugReport(result),
  };
}

export function buildEventSelectionRecommendationForDistrict(
  districtId: string,
  context: Partial<CreviaEventSelectionContext> = {},
): CreviaEventSelectionRecommendation {
  const result = buildEventSelectionResult({ ...context, districtId });
  return {
    summaryLine: buildEventSelectionSummaryLine(result),
    eventFamilyId: result.decision.selectedEventFamilyId,
    districtId,
    recommendedVariantKind: result.decision.recommendedVariantKind,
    isRuntimeHintOnly: true,
    debugReport: buildEventSelectionDebugReport(result),
  };
}

export function containsEventSelectionPanicWording(text: string): boolean {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return EVENT_SELECTION_PANIC_WORDING_TERMS.some((term) => normalized.includes(term));
}

export { buildEventSelectionDebugReport } from './eventSelectionPresentation';
