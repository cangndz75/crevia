import type { CreviaEventSelectionResult } from '@/core/eventSelection/eventSelectionTypes';

import {
  EVENT_FRESHNESS_DECISION_LABELS,
  EVENT_FRESHNESS_HEALTH_LABELS,
} from './eventFreshnessConstants';
import { evaluateEventFreshness } from './eventFreshnessGuard';
import type {
  CreviaEventFreshnessAwareSelectionResult,
  CreviaEventFreshnessDecisionStatus,
  CreviaEventFreshnessGuardResult,
  CreviaEventFreshnessReportModel,
} from './eventFreshnessTypes';

export function buildFreshnessDecisionLabel(status: CreviaEventFreshnessDecisionStatus): string {
  return EVENT_FRESHNESS_DECISION_LABELS[status] ?? status;
}

export function buildFreshnessPenaltyRows(result: CreviaEventFreshnessGuardResult): string[] {
  const p = result.penalties;
  return [
    `family: -${p.familyRepeat}`,
    `district: -${p.districtRepeat}`,
    `domain: -${p.domainRepeat}`,
    `variant: -${p.variantRepeat}`,
    `echo: -${p.echoRepeat}`,
    `titleCopy: -${p.titleCopySimilarity}`,
    `tutorial: -${p.tutorialHeavy}`,
    `duplicate: -${p.duplicateGuard}`,
    `total: -${p.total}`,
  ];
}

export function buildFreshnessDebugSummary(result: CreviaEventFreshnessGuardResult): string {
  return `${buildFreshnessDecisionLabel(result.decision.status)} | penalty ${result.penalties.total} | skor ${result.score.adjustedScore}`;
}

export function buildFreshnessWarningLine(result: CreviaEventFreshnessGuardResult): string | undefined {
  if (result.decision.status === 'allow') return undefined;
  return result.decision.reasonLine;
}

export function buildFreshnessCandidateReasonLine(result: CreviaEventFreshnessGuardResult): string {
  const candidate = result.context.candidate;
  if (!candidate) return result.decision.reasonLine;
  return `${candidate.title}: ${result.decision.reasonLine}`;
}

export function buildFreshnessReportModel(result: CreviaEventFreshnessGuardResult): CreviaEventFreshnessReportModel {
  const warning = buildFreshnessWarningLine(result);
  return {
    title: 'Event Freshness Guard',
    summaryLine: buildFreshnessDebugSummary(result),
    healthStatus: result.score.healthStatus,
    decisionLabel: buildFreshnessDecisionLabel(result.decision.status),
    penaltyRows: buildFreshnessPenaltyRows(result),
    candidateReasonLines: [buildFreshnessCandidateReasonLine(result)],
    warnings: warning ? [warning] : [],
  };
}

export function buildFreshnessDebugReportForSelection(
  guarded: CreviaEventFreshnessAwareSelectionResult,
): CreviaEventFreshnessReportModel {
  const topResult = guarded.guardResults[0];
  if (!topResult) {
    return {
      title: 'Event Freshness Guard',
      summaryLine: 'Exposure yok; allow.',
      healthStatus: 'fresh',
      decisionLabel: buildFreshnessDecisionLabel('allow'),
      penaltyRows: [],
      candidateReasonLines: [],
      warnings: [],
    };
  }

  const report = buildFreshnessReportModel(topResult);
  report.candidateReasonLines = guarded.guardResults.slice(0, 5).map(buildFreshnessCandidateReasonLine);
  if (guarded.fallbackNeeded) {
    report.warnings.push('Fallback gerekli: tüm adaylar freshness guard tarafından elendi veya düşürüldü.');
  }
  return report;
}

export function buildFreshnessHealthLabel(
  status: CreviaEventFreshnessGuardResult['score']['healthStatus'],
): string {
  return EVENT_FRESHNESS_HEALTH_LABELS[status];
}

export function buildFreshnessSelectionSummaryLine(
  result: CreviaEventSelectionResult,
  guarded: CreviaEventFreshnessAwareSelectionResult,
): string {
  const top = guarded.rankedCandidates[0];
  return `Gün ${result.context.day ?? 1}: freshness ${guarded.topDecision.status}, top ${top?.eventFamilyId ?? 'none'}.`;
}
