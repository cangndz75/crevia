import {
  ADVISOR_RELATIONSHIP_COPY_LIMITS,
  ADVISOR_RELATIONSHIP_FORBIDDEN_TERMS,
  ADVISOR_RELATIONSHIP_TRUST_UNDERMINING_TERMS,
} from './advisorRelationshipConstants';
import type { AdvisorOperationalRelationshipModel } from './advisorRelationshipTypes';

export function normalizeAdvisorRelationshipText(text: string): string {
  return text.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

export function advisorRelationshipCopyContainsForbiddenTerms(text: string): boolean {
  const normalized = normalizeAdvisorRelationshipText(text);
  return ADVISOR_RELATIONSHIP_FORBIDDEN_TERMS.some((term) => normalized.includes(term));
}

export function advisorRelationshipCopyUnderminesTrust(text: string): boolean {
  const normalized = normalizeAdvisorRelationshipText(text);
  return ADVISOR_RELATIONSHIP_TRUST_UNDERMINING_TERMS.some((term) =>
    normalized.includes(term),
  );
}

export function clampAdvisorRelationshipCopy(text: string, max: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

export function sanitizeAdvisorRelationshipCopy(
  text: string | undefined,
  surface: keyof typeof ADVISOR_RELATIONSHIP_COPY_LIMITS,
): string | undefined {
  if (!text?.trim()) return undefined;
  const clamped = clampAdvisorRelationshipCopy(text, ADVISOR_RELATIONSHIP_COPY_LIMITS[surface]);
  if (advisorRelationshipCopyContainsForbiddenTerms(clamped)) return undefined;
  if (advisorRelationshipCopyUnderminesTrust(clamped)) return undefined;
  return clamped;
}

export function makeAdvisorRelationshipDuplicateKey(input: {
  day: number;
  styleKind?: string;
  districtId?: string;
  domain?: string;
  sourceKind?: string;
  previousDecisionId?: string;
}): string {
  return [
    String(input.day),
    input.styleKind ?? 'unknown',
    input.districtId ?? 'city',
    input.domain ?? 'operation',
    input.sourceKind ?? 'fallback',
    input.previousDecisionId ?? 'none',
  ].join(':');
}

export function isDuplicateAdvisorRelationshipLine(
  line: string | undefined,
  existing: string[] = [],
): boolean {
  if (!line?.trim()) return true;
  const normalized = normalizeAdvisorRelationshipText(line);
  return existing.some((existingLine) => {
    const other = normalizeAdvisorRelationshipText(existingLine);
    if (!other) return false;
    if (other === normalized) return true;
    if (normalized.length >= 24 && other.includes(normalized.slice(0, 24))) return true;
    if (other.length >= 24 && normalized.includes(other.slice(0, 24))) return true;
    return false;
  });
}

export function buildAdvisorRelationshipHubLine(
  model: AdvisorOperationalRelationshipModel | null | undefined,
  existingLines: string[] = [],
): string | undefined {
  if (!model) return undefined;
  const line = model.hubLine ?? model.mainAdvisorLine;
  if (!line || isDuplicateAdvisorRelationshipLine(line, existingLines)) return undefined;
  return line;
}

export function buildAdvisorRelationshipReportLine(
  model: AdvisorOperationalRelationshipModel | null | undefined,
  existingLines: string[] = [],
): string | undefined {
  if (!model) return undefined;
  if (!model.reportLine || isDuplicateAdvisorRelationshipLine(model.reportLine, existingLines)) {
    return undefined;
  }
  return model.reportLine;
}

export function buildAdvisorRelationshipResultLine(
  model: AdvisorOperationalRelationshipModel | null | undefined,
  existingLines: string[] = [],
): string | undefined {
  if (!model) return undefined;
  if (!model.resultLine || isDuplicateAdvisorRelationshipLine(model.resultLine, existingLines)) {
    return undefined;
  }
  return model.resultLine;
}

export function getPlayerStyleLabelHelper(
  model: AdvisorOperationalRelationshipModel,
): string | undefined {
  return model.playerStyleSignal?.label;
}
