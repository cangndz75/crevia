import { compareContentItemSimilarity } from '@/core/contentProduction/contentDuplicateGuard';
import { evaluateEchoCompleteness } from '@/core/contentProduction/contentEchoCompleteness';
import type { CreviaContentPackItem } from '@/core/contentProduction/contentProductionTypes';
import type {
  CreviaEventSelectionCandidate,
  CreviaEventSelectionResult,
} from '@/core/eventSelection/eventSelectionTypes';
import type { CreviaEventVariantKind, CreviaResolvedEventVariant } from '@/core/eventVariants/eventVariantTypes';

import {
  EVENT_FRESHNESS_HEAVY_DOMAINS,
  EVENT_FRESHNESS_PENALTIES,
  EVENT_FRESHNESS_SCORE_RANGE,
  EVENT_FRESHNESS_STRONG_VARIANT_KINDS,
  EVENT_FRESHNESS_THRESHOLDS,
  EVENT_FRESHNESS_TUTORIAL_MAX_DAY,
} from './eventFreshnessConstants';
import {
  buildCompositeFreshnessSignature,
  buildCompositeFreshnessSignatureFromItem,
  compareTitleCopySignatures,
  signaturesEqual,
} from './eventFreshnessSignature';
import type {
  CreviaEventExposureRecord,
  CreviaEventFreshnessContext,
  CreviaEventFreshnessDecision,
  CreviaEventFreshnessDecisionStatus,
  CreviaEventFreshnessGuardResult,
  CreviaEventFreshnessHealthStatus,
  CreviaEventFreshnessPenalty,
  CreviaEventFreshnessRecommendation,
  CreviaEventFreshnessAwareSelectionResult,
} from './eventFreshnessTypes';

function clampScore(score: number): number {
  return Math.min(EVENT_FRESHNESS_SCORE_RANGE.max, Math.max(EVENT_FRESHNESS_SCORE_RANGE.min, Math.round(score)));
}

function isCriticalContext(context: CreviaEventFreshnessContext): boolean {
  return context.crisisRiskBand === 'high' || context.crisisRiskBand === 'critical';
}

function exposureRecords(context: CreviaEventFreshnessContext): CreviaEventExposureRecord[] {
  return context.recentExposureRecords ?? [];
}

function familyIdFromCandidate(candidate?: CreviaEventSelectionCandidate): string | undefined {
  return candidate?.eventFamilyId ?? candidate?.sourceItemId;
}

function resolveVariantKind(
  context: CreviaEventFreshnessContext,
): CreviaEventVariantKind | string | undefined {
  return (
    context.resolvedVariant?.kind ??
    context.candidate?.recommendedVariantKind ??
    context.recentVariantKinds?.[0]
  );
}

export function buildEventFreshnessContext(input: {
  currentDay?: number;
  candidate?: CreviaEventSelectionCandidate;
  candidateItem?: CreviaContentPackItem;
  selectionResult?: CreviaEventSelectionResult;
  resolvedVariant?: CreviaResolvedEventVariant;
  recentExposureRecords?: CreviaEventExposureRecord[];
  activeDailyEventIds?: string[];
  recentFamilyIds?: string[];
  recentDistrictIds?: string[];
  recentDomainIds?: string[];
  recentVariantKinds?: string[];
  recentEchoSignatures?: string[];
  recentTitleCopySignatures?: string[];
  crisisRiskBand?: CreviaEventFreshnessContext['crisisRiskBand'];
  gameState?: unknown;
} = {}): CreviaEventFreshnessContext {
  const currentDay =
    input.currentDay ??
    input.selectionResult?.context.day ??
    (input.gameState && typeof input.gameState === 'object'
      ? ((input.gameState as Record<string, unknown>).day as number | undefined)
      : undefined) ??
    1;

  const recentExposureRecords = input.recentExposureRecords ?? [];
  const recentFamilyIds =
    input.recentFamilyIds ?? recentExposureRecords.map((r) => r.familyId).filter(Boolean) as string[];
  const recentDistrictIds =
    input.recentDistrictIds ??
    recentExposureRecords.flatMap((r) => r.districtIds ?? []);
  const recentDomainIds =
    input.recentDomainIds ?? recentExposureRecords.flatMap((r) => r.domains ?? []);
  const recentVariantKinds =
    input.recentVariantKinds ??
    recentExposureRecords.map((r) => r.variantKind).filter(Boolean) as string[];
  const recentEchoSignatures =
    input.recentEchoSignatures ??
    recentExposureRecords.map((r) => r.echoSignature).filter(Boolean) as string[];
  const recentTitleCopySignatures =
    input.recentTitleCopySignatures ??
    recentExposureRecords.map((r) => r.titleCopySignature).filter(Boolean) as string[];

  const candidate = input.candidate;
  const isHeavyCandidate =
    candidate?.isHeavyForTutorial ||
    (candidate?.domains.some((d) => EVENT_FRESHNESS_HEAVY_DOMAINS.includes(d as never)) ?? false);

  return {
    currentDay,
    candidate,
    candidateItem: input.candidateItem,
    selectionResult: input.selectionResult,
    resolvedVariant: input.resolvedVariant,
    recentExposureRecords,
    activeDailyEventIds: input.activeDailyEventIds ?? [],
    recentFamilyIds,
    recentDistrictIds,
    recentDomainIds,
    recentVariantKinds,
    recentEchoSignatures,
    recentTitleCopySignatures,
    crisisRiskBand: input.crisisRiskBand ?? input.selectionResult?.context.crisisRiskBand ?? 'low',
    isTutorialDay: currentDay <= EVENT_FRESHNESS_TUTORIAL_MAX_DAY,
    isHeavyCandidate,
  };
}

export function calculateFamilyRepeatPenalty(context: CreviaEventFreshnessContext): number {
  const familyId = familyIdFromCandidate(context.candidate);
  if (!familyId) return 0;

  let penalty = 0;
  for (const record of exposureRecords(context)) {
    if (record.familyId !== familyId) continue;
    const daysSince = context.currentDay - record.day;
    if (daysSince <= 1) penalty = Math.max(penalty, EVENT_FRESHNESS_PENALTIES.familyRepeat1Day);
    else if (daysSince <= 3) penalty = Math.max(penalty, EVENT_FRESHNESS_PENALTIES.familyRepeat2To3Day);
  }

  if ((context.recentFamilyIds ?? []).includes(familyId)) {
    penalty = Math.max(penalty, EVENT_FRESHNESS_PENALTIES.familyRepeat1Day);
  }

  return penalty;
}

export function calculateDistrictRepeatPenalty(context: CreviaEventFreshnessContext): number {
  const districts = context.candidate?.districtIds ?? [];
  if (districts.length === 0) return 0;

  let penalty = 0;
  for (const districtId of districts) {
    const recentCount = (context.recentDistrictIds ?? []).filter((id) => id === districtId).length;
    if (recentCount >= 2) penalty += EVENT_FRESHNESS_PENALTIES.districtRepeatSoft;
  }
  return penalty;
}

export function calculateDomainRepeatPenalty(context: CreviaEventFreshnessContext): number {
  const domains = context.candidate?.domains ?? [];
  if (domains.length === 0) return 0;

  let penalty = 0;
  for (const domain of domains) {
    const recentCount = (context.recentDomainIds ?? []).filter((id) => id === domain).length;
    if (recentCount >= 3) penalty += EVENT_FRESHNESS_PENALTIES.domainRepeatMedium;
    else if (recentCount >= 2) penalty += EVENT_FRESHNESS_PENALTIES.domainRepeatSoft;
  }
  return penalty;
}

export function calculateVariantRepeatPenalty(context: CreviaEventFreshnessContext): number {
  const variantKind = resolveVariantKind(context);
  if (!variantKind) return 0;

  const recentCount = (context.recentVariantKinds ?? []).filter((kind) => kind === variantKind).length;
  if (recentCount === 0) return 0;

  const isStrong = EVENT_FRESHNESS_STRONG_VARIANT_KINDS.includes(variantKind);
  const base = isStrong
    ? EVENT_FRESHNESS_PENALTIES.variantRepeatStrong
    : EVENT_FRESHNESS_PENALTIES.variantRepeatNormal;

  if (context.resolvedVariant?.isContextOnly && variantKind === 'operation_era') {
    return Math.floor(base / 2);
  }

  return recentCount >= 2 ? base : Math.floor(base / 2);
}

export function calculateEchoRepeatPenalty(context: CreviaEventFreshnessContext): number {
  const item = context.candidateItem;
  const signatures = item
    ? buildCompositeFreshnessSignatureFromItem(item, resolveVariantKind(context))
    : buildCompositeFreshnessSignature({
        familyId: familyIdFromCandidate(context.candidate),
        districtIds: context.candidate?.districtIds,
        domains: context.candidate?.domains,
        variantKind: resolveVariantKind(context),
        title: context.candidate?.title,
      });

  const echoSig = signatures.echo;
  const sameDayEcho = exposureRecords(context).some(
    (record) => record.day === context.currentDay && signaturesEqual(record.echoSignature, echoSig),
  );
  if (sameDayEcho) return EVENT_FRESHNESS_PENALTIES.echoRepeatSameDay;

  if ((context.recentEchoSignatures ?? []).some((sig) => signaturesEqual(sig, echoSig))) {
    const echoCompleteness = item ? evaluateEchoCompleteness(item) : { status: 'pass' as const };
    const multiplier = echoCompleteness.status === 'warn' || echoCompleteness.status === 'fail' ? 1.2 : 1;
    return Math.round(EVENT_FRESHNESS_PENALTIES.echoRepeatSameDay * 0.6 * multiplier);
  }

  return 0;
}

export function calculateTitleCopySimilarityPenalty(context: CreviaEventFreshnessContext): number {
  const title = context.candidate?.title ?? context.candidateItem?.title;
  const copySummary =
    context.candidateItem?.copyBlocks.map((b) => b.text).join(' ') ?? title ?? '';

  let maxSimilarity = 0;
  for (const record of exposureRecords(context)) {
    const similarity = compareTitleCopySignatures(
      `${title ?? ''} ${copySummary}`,
      record.title ?? record.copySummary ?? record.titleCopySignature,
    );
    maxSimilarity = Math.max(maxSimilarity, similarity);
  }

  for (const sig of context.recentTitleCopySignatures ?? []) {
    maxSimilarity = Math.max(maxSimilarity, compareTitleCopySignatures(copySummary, sig));
  }

  if (maxSimilarity >= EVENT_FRESHNESS_THRESHOLDS.titleCopyHighSimilarity) {
    return EVENT_FRESHNESS_PENALTIES.titleCopyHighSimilarity;
  }
  if (maxSimilarity >= EVENT_FRESHNESS_THRESHOLDS.titleCopyMediumSimilarity) {
    return EVENT_FRESHNESS_PENALTIES.titleCopyMediumSimilarity;
  }
  return 0;
}

function calculateDuplicateGuardPenalty(context: CreviaEventFreshnessContext): number {
  const item = context.candidateItem;
  if (!item) return 0;

  let maxSimilarity = 0;
  for (const record of exposureRecords(context)) {
    if (!record.title) continue;
    const pseudoItem: CreviaContentPackItem = {
      ...item,
      title: record.title,
      copyBlocks: record.copySummary
        ? [{ id: 'tmp', surface: 'report_echo', text: record.copySummary, isPlayerFacing: true, language: 'tr' }]
        : item.copyBlocks,
    };
    maxSimilarity = Math.max(maxSimilarity, compareContentItemSimilarity(item, pseudoItem));
  }

  if (maxSimilarity >= EVENT_FRESHNESS_THRESHOLDS.duplicateGuardHigh) {
    return EVENT_FRESHNESS_PENALTIES.duplicateGuardHigh;
  }
  if (maxSimilarity >= EVENT_FRESHNESS_THRESHOLDS.duplicateGuardMedium) {
    return EVENT_FRESHNESS_PENALTIES.duplicateGuardMedium;
  }
  return 0;
}

function resolveHealthStatus(totalPenalty: number, isBlocked: boolean): CreviaEventFreshnessHealthStatus {
  if (isBlocked) return 'blocked';
  if (totalPenalty >= EVENT_FRESHNESS_THRESHOLDS.blockTotalPenalty) return 'strained';
  if (totalPenalty >= EVENT_FRESHNESS_THRESHOLDS.strongPenalty) return 'watch';
  return 'fresh';
}

function resolveDecision(
  context: CreviaEventFreshnessContext,
  penalties: CreviaEventFreshnessPenalty,
): CreviaEventFreshnessDecision {
  const critical = isCriticalContext(context);
  const echoBlock =
    penalties.echoRepeat >= EVENT_FRESHNESS_PENALTIES.echoRepeatSameDay &&
    (context.recentEchoSignatures?.length ?? 0) > 0;

  let status: CreviaEventFreshnessDecisionStatus = 'allow';
  let reasonLine = 'Tazelik guard izin verdi.';
  let isBlocked = false;

  if (echoBlock && !critical) {
    status = 'block_echo_repeat';
    reasonLine = 'Aynı echo imzası bugün tekrar ediyor.';
    isBlocked = true;
  } else if (
    penalties.titleCopySimilarity >= EVENT_FRESHNESS_PENALTIES.titleCopyHighSimilarity &&
    penalties.duplicateGuard >= EVENT_FRESHNESS_PENALTIES.duplicateGuardHigh &&
    !critical
  ) {
    status = 'block_duplicate';
    reasonLine = 'Başlık/copy duplicate riski yüksek.';
    isBlocked = true;
  } else if (context.isTutorialDay && context.isHeavyCandidate) {
    status = 'strong_penalty';
    reasonLine = 'Gün 1 tutorial heavy candidate freshness guard cezası.';
    isBlocked = penalties.total >= EVENT_FRESHNESS_THRESHOLDS.blockTotalPenalty;
  } else if (penalties.familyRepeat >= EVENT_FRESHNESS_PENALTIES.familyRepeat1Day) {
    status = critical ? 'warn_repeat' : 'strong_penalty';
    reasonLine = critical
      ? 'Aile tekrarı var; kriz bağlamında yumuşatılmış uyarı.'
      : 'Aynı event family kısa aralıkta tekrar ediyor.';
  } else if (penalties.variantRepeat >= EVENT_FRESHNESS_PENALTIES.variantRepeatStrong) {
    status = 'strong_penalty';
    reasonLine = 'Variant tonu üst üste tekrar ediyor.';
  } else if (penalties.total >= EVENT_FRESHNESS_THRESHOLDS.strongPenalty) {
    status = 'strong_penalty';
    reasonLine = 'Toplam freshness cezası yüksek.';
  } else if (penalties.titleCopySimilarity >= EVENT_FRESHNESS_PENALTIES.titleCopyMediumSimilarity) {
    status = 'warn_similarity';
    reasonLine = 'Benzer title/copy imzası tespit edildi.';
  } else if (penalties.total >= EVENT_FRESHNESS_THRESHOLDS.softPenalty) {
    status = 'soft_penalty';
    reasonLine = 'Hafif tekrar/freshness cezası uygulandı.';
  } else if (penalties.familyRepeat > 0 || penalties.districtRepeat > 0) {
    status = 'warn_repeat';
    reasonLine = 'Tekrar sinyali var; izlemeye alındı.';
  }

  if (critical && (status === 'block_duplicate' || status === 'block_echo_repeat')) {
    status = 'strong_penalty';
    reasonLine = 'Kritik bağlam: tam block yerine güçlü penalty.';
    isBlocked = false;
  }

  if (
    resolveVariantKind(context) === 'crisis_adjacent' &&
    (status === 'block_duplicate' || status === 'block_echo_repeat')
  ) {
    status = 'warn_repeat';
    reasonLine = 'Kriz eşiği tekrarı kontrollü uyarı ile yönetildi.';
    isBlocked = false;
  }

  return {
    status,
    reasonLine,
    isBlocked,
    allowsCriticalOverride: critical,
  };
}

export function evaluateEventFreshness(context: CreviaEventFreshnessContext): CreviaEventFreshnessGuardResult {
  const tutorialHeavy =
    context.isTutorialDay && context.isHeavyCandidate ? EVENT_FRESHNESS_PENALTIES.tutorialHeavy : 0;

  const penalties: CreviaEventFreshnessPenalty = {
    familyRepeat: calculateFamilyRepeatPenalty(context),
    districtRepeat: calculateDistrictRepeatPenalty(context),
    domainRepeat: calculateDomainRepeatPenalty(context),
    variantRepeat: calculateVariantRepeatPenalty(context),
    echoRepeat: calculateEchoRepeatPenalty(context),
    titleCopySimilarity: calculateTitleCopySimilarityPenalty(context),
    tutorialHeavy,
    duplicateGuard: calculateDuplicateGuardPenalty(context),
    total: 0,
  };

  penalties.total =
    penalties.familyRepeat +
    penalties.districtRepeat +
    penalties.domainRepeat +
    penalties.variantRepeat +
    penalties.echoRepeat +
    penalties.titleCopySimilarity +
    penalties.tutorialHeavy +
    penalties.duplicateGuard;

  const decision = resolveDecision(context, penalties);
  const baseScore = context.candidate?.score ?? 50;
  const adjustedScore = clampScore(baseScore - penalties.total);

  const item = context.candidateItem;
  const signatures = item
    ? buildCompositeFreshnessSignatureFromItem(item, resolveVariantKind(context))
    : buildCompositeFreshnessSignature({
        familyId: familyIdFromCandidate(context.candidate),
        districtIds: context.candidate?.districtIds,
        domains: context.candidate?.domains,
        variantKind: resolveVariantKind(context),
        title: context.candidate?.title,
      });

  return {
    context,
    signatures,
    penalties,
    score: {
      baseScore,
      freshnessPenalty: penalties.total,
      adjustedScore,
      healthStatus: resolveHealthStatus(penalties.total, decision.isBlocked),
    },
    decision,
  };
}

export function shouldBlockCandidateForFreshness(result: CreviaEventFreshnessGuardResult): boolean {
  return result.decision.isBlocked;
}

export function rankCandidatesByFreshness(
  candidates: readonly CreviaEventSelectionCandidate[],
  context: CreviaEventFreshnessContext,
): Array<CreviaEventSelectionCandidate & { freshnessPenalty: number; freshnessDecision: CreviaEventFreshnessDecisionStatus }> {
  return candidates
    .map((candidate) => {
      const guard = evaluateEventFreshness({ ...context, candidate });
      return {
        ...candidate,
        score: guard.score.adjustedScore,
        freshnessPenalty: guard.penalties.total,
        freshnessDecision: guard.decision.status,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function applyFreshnessToSelectionCandidates(
  result: CreviaEventSelectionResult,
  context: Partial<CreviaEventFreshnessContext> = {},
): CreviaEventFreshnessAwareSelectionResult {
  const freshnessContext = buildEventFreshnessContext({
    currentDay: result.context.day,
    selectionResult: result,
    recentFamilyIds: result.context.recentEventFamilyIds,
    recentDistrictIds: result.context.recentDistrictIds,
    recentDomainIds: result.context.recentDomainIds,
    recentVariantKinds: result.context.recentVariantKinds,
    crisisRiskBand: result.context.crisisRiskBand,
    ...context,
  });

  const guardedCandidates = rankCandidatesByFreshness(result.candidates, freshnessContext);
  const guardResults = result.candidates.map((candidate) =>
    evaluateEventFreshness({ ...freshnessContext, candidate }),
  );

  const primaryGuarded = guardedCandidates.filter(
    (c) => c.kind === 'event_family' && c.isSelectablePrimary && !c.isBlocked,
  );
  const selectablePrimary = primaryGuarded.filter(
    (c) =>
      !shouldBlockCandidateForFreshness(
        evaluateEventFreshness({ ...freshnessContext, candidate: c }),
      ),
  );

  const topBlocked = selectablePrimary.length === 0;

  const topGuard = guardResults.find((g) => g.context.candidate?.id === guardedCandidates[0]?.id);

  const topDecision: CreviaEventFreshnessDecision = topBlocked
    ? {
        status: 'fallback_needed',
        reasonLine: 'Tüm primary candidate freshness guard tarafından elendi.',
        isBlocked: true,
        allowsCriticalOverride: isCriticalContext(freshnessContext),
      }
    : topGuard?.decision ?? {
        status: 'allow',
        reasonLine: 'Freshness guard uygun candidate buldu.',
        isBlocked: false,
        allowsCriticalOverride: false,
      };

  return {
    original: result,
    guardedCandidates,
    rankedCandidates: guardedCandidates,
    guardResults,
    topDecision,
    fallbackNeeded: topDecision.status === 'fallback_needed',
  };
}

export function buildFreshnessAwareSelectionResult(
  result: CreviaEventSelectionResult,
  context: Partial<CreviaEventFreshnessContext> = {},
): CreviaEventFreshnessAwareSelectionResult {
  return applyFreshnessToSelectionCandidates(result, context);
}

export function applyFreshnessGuardToSelectionResult(
  result: CreviaEventSelectionResult,
  context: Partial<CreviaEventFreshnessContext> = {},
): CreviaEventFreshnessAwareSelectionResult {
  return applyFreshnessToSelectionCandidates(result, context);
}

export function buildFreshnessAwareCandidateRanking(
  candidates: readonly CreviaEventSelectionCandidate[],
  context: CreviaEventFreshnessContext,
): ReturnType<typeof rankCandidatesByFreshness> {
  return rankCandidatesByFreshness(candidates, context);
}

export function buildFreshnessGuardForDay(
  day: number,
  exposureRecords: CreviaEventExposureRecord[] = [],
  extras: Partial<CreviaEventFreshnessContext> = {},
): CreviaEventFreshnessGuardResult {
  return evaluateEventFreshness(
    buildEventFreshnessContext({
      currentDay: day,
      recentExposureRecords: exposureRecords,
      ...extras,
    }),
  );
}

export function buildFreshnessGuardForDistrict(
  districtId: string,
  day: number,
  exposureRecords: CreviaEventExposureRecord[] = [],
): CreviaEventFreshnessGuardResult {
  return evaluateEventFreshness(
    buildEventFreshnessContext({
      currentDay: day,
      recentExposureRecords: exposureRecords,
      recentDistrictIds: exposureRecords.flatMap((r) => r.districtIds ?? []).concat(districtId),
      candidate: {
        id: 'district_probe',
        kind: 'event_family',
        sourceItemId: 'probe',
        districtIds: [districtId],
        domains: [],
        title: 'District probe',
        tags: [],
        score: 50,
        weightBreakdown: {
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
          total: 50,
        },
        recommendedVariantKind: 'normal',
        isBlocked: false,
        isSelectablePrimary: true,
        isHeavyForTutorial: false,
      },
    }),
  );
}

export function buildFreshnessAwareEventRecommendation(
  selectionResult: CreviaEventSelectionResult,
  context: Partial<CreviaEventFreshnessContext> = {},
): CreviaEventFreshnessRecommendation {
  const guarded = applyFreshnessToSelectionCandidates(selectionResult, context);
  const top = guarded.guardedCandidates[0];
  return {
    summaryLine: top
      ? `Gün ${selectionResult.context.day ?? 1}: ${top.eventFamilyId ?? top.title} (freshness ${top.freshnessDecision}).`
      : 'Freshness guard uygun candidate bulamadı.',
    guardResult: guarded.guardResults[0],
    selectionResult: guarded,
    isRuntimeHintOnly: true,
  };
}
