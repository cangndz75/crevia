import {
  DECISION_IMPACT_EXPLANATION_MAIN_LINE_LIMIT,
  DECISION_IMPACT_EXPLANATION_TOMORROW_LINE_LIMIT,
  DECISION_IMPACT_FORBIDDEN_TERMS,
} from './decisionImpactExplanationConstants';
import type { DecisionImpactExplanation } from './decisionImpactExplanationTypes';

export function clampDecisionImpactCopy(text: string, limit: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit - 1).trimEnd()}…`;
}

export function decisionImpactCopyContainsForbiddenTerms(text: string): boolean {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return DECISION_IMPACT_FORBIDDEN_TERMS.some((term) => normalized.includes(term));
}

export function sanitizeDecisionImpactMainLine(text: string): string {
  const fallback =
    'Bugünkü karar kısa vadeli dengeyi etkiledi. Kalan baskı gün sonu raporunda izlenebilir.';
  const clamped = clampDecisionImpactCopy(text, DECISION_IMPACT_EXPLANATION_MAIN_LINE_LIMIT);
  return decisionImpactCopyContainsForbiddenTerms(clamped) ? fallback : clamped;
}

export function sanitizeDecisionImpactTomorrowLine(text?: string): string | undefined {
  if (!text?.trim()) return undefined;
  const clamped = clampDecisionImpactCopy(text, DECISION_IMPACT_EXPLANATION_TOMORROW_LINE_LIMIT);
  if (decisionImpactCopyContainsForbiddenTerms(clamped)) return undefined;
  return clamped;
}

export function buildDecisionImpactReportEcho(
  explanation: DecisionImpactExplanation | null | undefined,
): string | null {
  if (!explanation?.shouldEchoInReport) return null;
  const line = explanation.tomorrowLine
    ? `${explanation.mainLine} ${explanation.tomorrowLine}`
    : explanation.mainLine;
  return clampDecisionImpactCopy(line, 150);
}

export function buildDecisionImpactHubEcho(
  explanation: DecisionImpactExplanation | null | undefined,
): string | null {
  if (!explanation?.shouldEchoInHub) return null;
  const line = explanation.tomorrowLine ?? explanation.mainLine;
  return clampDecisionImpactCopy(line.replace(/^Bugünkü /, 'Dünkü '), 118);
}
