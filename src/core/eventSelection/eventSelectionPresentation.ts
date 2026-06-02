import {
  EVENT_SELECTION_DEBUG_MIN_CANDIDATES,
  EVENT_SELECTION_VARIANT_KINDS,
} from './eventSelectionConstants';
import type {
  CreviaEventSelectionCandidate,
  CreviaEventSelectionDebugReport,
  CreviaEventSelectionRecommendedVariantKind,
  CreviaEventSelectionResult,
  CreviaEventSelectionWeightBreakdown,
} from './eventSelectionTypes';

const VARIANT_LABELS: Record<CreviaEventSelectionRecommendedVariantKind, string> = {
  normal: 'Normal',
  improved: 'İyileşmiş',
  worsened: 'Zorlaşmış',
  carry_over: 'Devam Eden',
  reward: 'Ödül',
  comeback: 'Toparlanma',
  resource_fatigue: 'Kaynak Yorgunluğu',
  district_trust: 'Mahalle Güveni',
  crisis_adjacent: 'Kriz Eşiği',
  operation_era: 'Operasyon Dönemi',
};

export function buildRecommendedVariantLabel(
  kind: CreviaEventSelectionRecommendedVariantKind,
): string {
  return VARIANT_LABELS[kind] ?? kind;
}

export function buildEventSelectionSummaryLine(result: CreviaEventSelectionResult): string {
  const selected = result.decision.selectedEventFamilyId;
  const variant = result.decision.recommendedVariantKind;
  if (!selected) {
    return `Gün ${result.signalSnapshot.day}: seçilebilir event family yok (${result.healthStatus}).`;
  }
  const variantLabel = variant ? buildRecommendedVariantLabel(variant) : 'Normal';
  return `Gün ${result.signalSnapshot.day}: ${selected} önerildi (${variantLabel}, skor ${result.primaryCandidates[0]?.score ?? 0}).`;
}

export function buildEventSelectionWeightBreakdownRows(
  breakdown: CreviaEventSelectionWeightBreakdown,
): string[] {
  return [
    `district: +${breakdown.districtRelevance}`,
    `domain: +${breakdown.domainRelevance}`,
    `phase: +${breakdown.operationPhaseRelevance}`,
    `rank: +${breakdown.rankUnlockRelevance}`,
    `era: +${breakdown.operationEraRelevance}`,
    `resource: +${breakdown.resourcePressureRelevance}`,
    `trust: +${breakdown.districtTrustRelevance}`,
    `crisis: +${breakdown.crisisRelevance}`,
    `style: +${breakdown.playerStyleRelevance}`,
    `echo: +${breakdown.echoCompletenessBonus}`,
    `quality: +${breakdown.contentQualityBonus}`,
    `mobile: +${breakdown.mobileReadinessBonus}`,
    `freshness: -${breakdown.freshnessPenalty}`,
    `duplicate: -${breakdown.duplicatePenalty}`,
    `total: ${breakdown.total}`,
  ];
}

export function buildEventSelectionDebugRows(
  candidates: readonly CreviaEventSelectionCandidate[],
  max = EVENT_SELECTION_DEBUG_MIN_CANDIDATES,
): string[] {
  return candidates.slice(0, max).map((candidate) => {
    const blocked = candidate.isBlocked ? ' [BLOCKED]' : '';
    const variant = buildRecommendedVariantLabel(candidate.recommendedVariantKind);
    return `${candidate.kind} | ${candidate.title} | skor ${candidate.score} | ${variant}${blocked}`;
  });
}

export function buildEventSelectionFreshnessWarning(
  candidate: CreviaEventSelectionCandidate,
): string | undefined {
  const { freshnessPenalty, duplicatePenalty } = candidate.weightBreakdown;
  if (freshnessPenalty === 0 && duplicatePenalty === 0) return undefined;
  const parts: string[] = [];
  if (freshnessPenalty > 0) parts.push(`tekrar cezası -${freshnessPenalty}`);
  if (duplicatePenalty > 0) parts.push(`duplicate risk -${duplicatePenalty}`);
  return `${candidate.title}: ${parts.join(', ')}`;
}

export function buildEventSelectionDebugReport(
  result: CreviaEventSelectionResult,
): CreviaEventSelectionDebugReport {
  const top = result.rankedCandidates[0];
  const weightRows = top ? buildEventSelectionWeightBreakdownRows(top.weightBreakdown) : [];
  const freshnessWarnings = result.rankedCandidates
    .map(buildEventSelectionFreshnessWarning)
    .filter((line): line is string => !!line);

  return {
    title: 'Event Family Selection Debug',
    summaryLine: buildEventSelectionSummaryLine(result),
    candidateCount: result.candidates.length,
    rows: buildEventSelectionDebugRows(result.rankedCandidates),
    weightRows,
    freshnessWarnings,
  };
}

export function buildEventSelectionVariantKindOptions(): readonly CreviaEventSelectionRecommendedVariantKind[] {
  return EVENT_SELECTION_VARIANT_KINDS;
}
