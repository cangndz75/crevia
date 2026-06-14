import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { DominantStrategyDetectorResult } from '@/core/dominantStrategyDetector/dominantStrategyDetectorTypes';
import type { FollowUpExecutionCandidate } from '@/core/followUpExecution/followUpExecutionTypes';

import type {
  StrategyDecisionHistoryRecord,
  StrategyDominantSurface,
  StrategyDominantSurfacedRecord,
  StrategyFollowUpExecutionRecord,
  StrategyOperationChoiceRecord,
  StrategyPortfolioChoiceRecord,
} from './strategyHistoryTypes';

function sourceIds(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value?.trim()))));
}

function inferDecisionKind(record: DecisionRecord): string | undefined {
  const label = record.decisionLabel.toLowerCase();
  if (/hizli|acil|rapid|urgent/.test(label)) return 'rapid_response';
  if (/izle|bekle|onleyici|prevent|safe/.test(label)) return 'safe_watch';
  if (/kaynak|butce|tasarruf|resource/.test(label)) return 'resource_saving';
  if (/guven|iletisim|trust|social/.test(label)) return 'communication_first';
  if (/rota|arac|route|vehicle/.test(label)) return 'route_review';
  return undefined;
}

function inferTone(record: DecisionRecord): StrategyDecisionHistoryRecord['tone'] {
  const effects = record.appliedEffects;
  const positive =
    (effects.publicSatisfaction ?? 0) + (effects.staffMorale ?? 0) + (effects.cleanliness ?? 0) + (effects.trust ?? 0);
  const negative = Math.abs(Math.min(0, effects.budget ?? 0)) + Math.max(0, effects.risk ?? 0);
  if (positive > negative) return 'positive';
  if (negative > positive) return 'cautious';
  return 'neutral';
}

export function buildStrategyDecisionRecordFromDecisionRecord(
  record: DecisionRecord,
  options: { domainTags?: string[] } = {},
): StrategyDecisionHistoryRecord {
  return {
    id: `strategy-decision-${record.id}`,
    day: record.day,
    eventId: record.eventId,
    decisionId: record.decisionId,
    decisionLabel: record.decisionLabel,
    selectedDecisionKind: inferDecisionKind(record),
    districtId: record.neighborhoodId,
    districtName: record.neighborhoodName,
    domainTags: Array.from(new Set(options.domainTags ?? [])),
    tone: inferTone(record),
    sourceIds: sourceIds([record.id, record.eventId, record.decisionId]),
    createdAt: record.createdAt,
  };
}

export function buildStrategyOperationChoiceRecord(input: {
  day: number;
  operationId: string;
  choiceId: string;
  choiceLabel: string;
  districtId?: string;
  districtName?: string;
  domainTags?: string[];
  sourceIds?: string[];
  createdAt?: string;
}): StrategyOperationChoiceRecord {
  return {
    id: `strategy-operation-${input.operationId}-${input.choiceId}-${input.day}`,
    day: input.day,
    operationId: input.operationId,
    choiceId: input.choiceId,
    choiceLabel: input.choiceLabel,
    districtId: input.districtId,
    districtName: input.districtName,
    domainTags: Array.from(new Set(input.domainTags ?? [])),
    sourceIds: sourceIds(input.sourceIds ?? [input.operationId, input.choiceId]),
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

export function buildStrategyPortfolioChoiceRecord(input: {
  day: number;
  itemId: string;
  itemKind: string;
  decision: StrategyPortfolioChoiceRecord['decision'];
  districtId?: string;
  districtName?: string;
  domainTags?: string[];
  sourceIds?: string[];
  createdAt?: string;
}): StrategyPortfolioChoiceRecord {
  return {
    id: `strategy-portfolio-${input.itemId}-${input.decision}-${input.day}`,
    day: input.day,
    itemId: input.itemId,
    itemKind: input.itemKind,
    decision: input.decision,
    districtId: input.districtId,
    districtName: input.districtName,
    domainTags: Array.from(new Set(input.domainTags ?? [input.itemKind])),
    sourceIds: sourceIds(input.sourceIds ?? [input.itemId]),
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

export function buildStrategyFollowUpExecutionRecord(input: {
  day: number;
  candidate: FollowUpExecutionCandidate;
  status?: FollowUpExecutionCandidate['status'];
  createdAt?: string;
}): StrategyFollowUpExecutionRecord {
  return {
    id: `strategy-follow-up-${input.candidate.actionId}-${input.day}`,
    day: input.day,
    actionId: input.candidate.actionId,
    kind: input.candidate.kind,
    status: input.status ?? input.candidate.status,
    districtId: input.candidate.districtId,
    districtName: input.candidate.districtName,
    sourceIds: sourceIds(input.candidate.sourceIds),
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

export function buildStrategyDominantSurfacedRecord(
  result: DominantStrategyDetectorResult,
  surface: StrategyDominantSurface,
): StrategyDominantSurfacedRecord {
  return {
    id: `strategy-dominant-${surface}-${result.pattern}-${result.day}`,
    day: result.day,
    pattern: result.pattern,
    surface,
    sourceIds: sourceIds(result.sourceIds),
    createdAt: new Date().toISOString(),
  };
}
