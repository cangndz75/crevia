import {
  FOLLOW_UP_EXECUTION_ACCESSIBILITY_MAX,
  FOLLOW_UP_EXECUTION_BADGE_LABELS,
  FOLLOW_UP_EXECUTION_CTA_LABELS,
  FOLLOW_UP_EXECUTION_LINE_MAX,
  FOLLOW_UP_EXECUTION_MAX_CANDIDATES,
} from './followUpExecutionConstants';
import type {
  FollowUpExecutionCardModel,
  FollowUpExecutionCandidate,
  FollowUpExecutionResult,
  FollowUpExecutionSourceAdapter,
} from './followUpExecutionTypes';

const TECHNICAL_ENUM_PATTERN = /\b[a-z]+_[a-z_]+\b/;

function clampLine(value: string, max: number): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 3).trimEnd()}...`;
}

function buildCard(candidate: FollowUpExecutionCandidate): FollowUpExecutionCardModel | null {
  const line = candidate.status === 'executed' ? candidate.resultLine : candidate.line;
  if (TECHNICAL_ENUM_PATTERN.test(`${candidate.title} ${line}`)) return null;
  return {
    id: candidate.id,
    title: candidate.title,
    line: clampLine(line, FOLLOW_UP_EXECUTION_LINE_MAX),
    resultLine:
      candidate.status === 'executed'
        ? clampLine(candidate.resultLine, FOLLOW_UP_EXECUTION_LINE_MAX)
        : undefined,
    badgeLabel: FOLLOW_UP_EXECUTION_BADGE_LABELS[candidate.kind],
    ctaLabel: candidate.status === 'available' ? FOLLOW_UP_EXECUTION_CTA_LABELS[candidate.kind] : undefined,
    districtName: candidate.districtName,
    status: candidate.status,
    tone: candidate.tone,
    accessibilityLabel: clampLine(
      `${candidate.title}. ${line}. ${FOLLOW_UP_EXECUTION_BADGE_LABELS[candidate.kind]}.`,
      FOLLOW_UP_EXECUTION_ACCESSIBILITY_MAX,
    ),
  };
}

export function buildFollowUpExecutionCardModels(
  result: FollowUpExecutionResult | null | undefined,
): FollowUpExecutionCardModel[] {
  if (!result?.isActive) return [];
  return [...result.executedCandidates, ...result.availableCandidates]
    .slice(0, FOLLOW_UP_EXECUTION_MAX_CANDIDATES)
    .map(buildCard)
    .filter((card): card is FollowUpExecutionCardModel => Boolean(card));
}

export function buildPrimaryFollowUpExecutionCard(
  result: FollowUpExecutionResult | null | undefined,
): FollowUpExecutionCardModel | null {
  const candidate = result?.primaryCandidate;
  return candidate ? buildCard(candidate) : null;
}

export function buildHubFollowUpExecutionHint(
  result: FollowUpExecutionResult | null | undefined,
): string | undefined {
  const candidate = result?.hubCandidate;
  if (!candidate || candidate.status === 'blocked') return undefined;
  const line = candidate.status === 'executed' ? candidate.resultLine : candidate.line;
  if (TECHNICAL_ENUM_PATTERN.test(line)) return undefined;
  return clampLine(line, FOLLOW_UP_EXECUTION_LINE_MAX);
}

export function buildReportFollowUpExecutionNote(
  result: FollowUpExecutionResult | null | undefined,
  avoidLines: string[] = [],
): string | undefined {
  const candidate = result?.reportCandidate;
  if (!candidate || candidate.status !== 'executed') return undefined;
  const line = clampLine(candidate.resultLine, FOLLOW_UP_EXECUTION_LINE_MAX);
  if (TECHNICAL_ENUM_PATTERN.test(line)) return undefined;
  const normalized = line.toLowerCase();
  if (avoidLines.some((avoid) => normalized === avoid.trim().toLowerCase())) return undefined;
  return line;
}

export function buildEceFollowUpExecutionLine(
  result: FollowUpExecutionResult | null | undefined,
): string | undefined {
  const candidate = result?.eceCandidate;
  if (!candidate || candidate.status === 'blocked') return undefined;
  const district = candidate.districtName ? `${candidate.districtName}: ` : '';
  const line = `${district}${candidate.status === 'executed' ? candidate.resultLine : candidate.line}`;
  if (TECHNICAL_ENUM_PATTERN.test(line)) return undefined;
  return clampLine(line, FOLLOW_UP_EXECUTION_LINE_MAX);
}

export function buildCityMemorySourceFromFollowUpExecution(
  result: FollowUpExecutionResult | null | undefined,
): FollowUpExecutionSourceAdapter | null {
  const candidate = result?.executedCandidates[0];
  if (!candidate) return null;
  return {
    id: `follow-up-execution-memory-${candidate.actionId}`,
    title: candidate.title,
    line: candidate.resultLine,
    sourceIds: ['follow-up-execution', ...candidate.sourceIds],
    sourceKinds: ['follow_up_execution', ...candidate.sourceKinds],
    kind: candidate.kind,
  };
}

export function buildPositiveComebackSourceFromFollowUpExecution(
  result: FollowUpExecutionResult | null | undefined,
): FollowUpExecutionSourceAdapter | null {
  const candidate = result?.executedCandidates[0];
  if (!candidate) return null;
  return {
    id: `follow-up-execution-comeback-${candidate.actionId}`,
    title: candidate.title,
    line: candidate.resultLine,
    sourceIds: ['follow-up-execution', ...candidate.sourceIds],
    sourceKinds: ['follow_up_execution', ...candidate.sourceKinds],
    kind: candidate.kind,
  };
}
