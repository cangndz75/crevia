import type {
  DominantStrategyDetectorInput,
  DominantStrategyPattern,
} from '@/core/dominantStrategyDetector/dominantStrategyDetectorTypes';
import type {
  FollowUpExecutionKind,
  FollowUpExecutionStatus,
} from '@/core/followUpExecution/followUpExecutionTypes';

import type {
  StrategyDecisionHistoryRecord,
  StrategyDominantSurface,
  StrategyDominantSurfacedRecord,
  StrategyFollowUpExecutionRecord,
  StrategyHistoryStateV1,
  StrategyOperationChoiceRecord,
  StrategyPortfolioChoiceRecord,
} from './strategyHistoryTypes';

export const STRATEGY_HISTORY_MAX_AGE_DAYS = 21;
export const STRATEGY_DECISION_HISTORY_MAX = 40;
export const STRATEGY_OPERATION_CHOICE_HISTORY_MAX = 40;
export const STRATEGY_PORTFOLIO_CHOICE_HISTORY_MAX = 60;
export const STRATEGY_FOLLOW_UP_EXECUTION_HISTORY_MAX = 30;
export const STRATEGY_DOMINANT_SURFACED_HISTORY_MAX = 30;
export const STRATEGY_DOMINANT_SURFACE_COOLDOWN_DAYS = 2;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function uniqueStrings(values: unknown[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values.flat()) {
    const text = asString(value);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
  }
  return result;
}

function createdAt(value: unknown): string {
  return asString(value) ?? new Date().toISOString();
}

function withinAge(day: number, currentDay?: number): boolean {
  if (currentDay == null || !Number.isFinite(currentDay)) return true;
  return day >= currentDay - STRATEGY_HISTORY_MAX_AGE_DAYS;
}

function replaceById<T extends { id: string; day: number }>(
  records: T[],
  record: T,
  max: number,
  currentDay?: number,
): T[] {
  const next = [...records.filter((item) => item.id !== record.id), record]
    .filter((item) => withinAge(item.day, currentDay))
    .sort((a, b) => a.day - b.day);
  return next.slice(-max);
}

function normalizeDecisionRecord(raw: unknown): StrategyDecisionHistoryRecord | null {
  if (!isRecord(raw)) return null;
  const id = asString(raw.id);
  const day = asNumber(raw.day);
  const eventId = asString(raw.eventId);
  const decisionId = asString(raw.decisionId);
  const decisionLabel = asString(raw.decisionLabel);
  if (!id || !day || !eventId || !decisionId || !decisionLabel) return null;
  return {
    id,
    day,
    eventId,
    decisionId,
    decisionLabel,
    selectedDecisionKind: asString(raw.selectedDecisionKind),
    districtId: asString(raw.districtId),
    districtName: asString(raw.districtName),
    domainTags: uniqueStrings(asArray(raw.domainTags)),
    tone:
      raw.tone === 'positive' || raw.tone === 'negative' || raw.tone === 'cautious'
        ? raw.tone
        : 'neutral',
    sourceIds: uniqueStrings(asArray(raw.sourceIds).length > 0 ? asArray(raw.sourceIds) : [id]),
    createdAt: createdAt(raw.createdAt),
  };
}

function normalizeOperationRecord(raw: unknown): StrategyOperationChoiceRecord | null {
  if (!isRecord(raw)) return null;
  const id = asString(raw.id);
  const day = asNumber(raw.day);
  const operationId = asString(raw.operationId);
  const choiceId = asString(raw.choiceId);
  const choiceLabel = asString(raw.choiceLabel);
  if (!id || !day || !operationId || !choiceId || !choiceLabel) return null;
  return {
    id,
    day,
    operationId,
    choiceId,
    choiceLabel,
    districtId: asString(raw.districtId),
    districtName: asString(raw.districtName),
    domainTags: uniqueStrings(asArray(raw.domainTags)),
    sourceIds: uniqueStrings(asArray(raw.sourceIds).length > 0 ? asArray(raw.sourceIds) : [id]),
    createdAt: createdAt(raw.createdAt),
  };
}

function normalizePortfolioRecord(raw: unknown): StrategyPortfolioChoiceRecord | null {
  if (!isRecord(raw)) return null;
  const id = asString(raw.id);
  const day = asNumber(raw.day);
  const itemId = asString(raw.itemId);
  const itemKind = asString(raw.itemKind);
  const decision = raw.decision === 'defer' || raw.decision === 'ignore' ? raw.decision : 'select';
  if (!id || !day || !itemId || !itemKind) return null;
  return {
    id,
    day,
    itemId,
    itemKind,
    decision,
    districtId: asString(raw.districtId),
    districtName: asString(raw.districtName),
    domainTags: uniqueStrings(asArray(raw.domainTags)),
    sourceIds: uniqueStrings(asArray(raw.sourceIds).length > 0 ? asArray(raw.sourceIds) : [id]),
    createdAt: createdAt(raw.createdAt),
  };
}

function normalizeFollowUpRecord(raw: unknown): StrategyFollowUpExecutionRecord | null {
  if (!isRecord(raw)) return null;
  const id = asString(raw.id);
  const day = asNumber(raw.day);
  const actionId = asString(raw.actionId);
  const kind = asString(raw.kind) as FollowUpExecutionKind | undefined;
  const status = asString(raw.status) as FollowUpExecutionStatus | undefined;
  if (!id || !day || !actionId || !kind || !status) return null;
  return {
    id,
    day,
    actionId,
    kind,
    status,
    districtId: asString(raw.districtId),
    districtName: asString(raw.districtName),
    sourceIds: uniqueStrings(asArray(raw.sourceIds).length > 0 ? asArray(raw.sourceIds) : [id]),
    createdAt: createdAt(raw.createdAt),
  };
}

function normalizeSurfacedRecord(raw: unknown): StrategyDominantSurfacedRecord | null {
  if (!isRecord(raw)) return null;
  const id = asString(raw.id);
  const day = asNumber(raw.day);
  const pattern = asString(raw.pattern) as DominantStrategyPattern | undefined;
  const surface = asString(raw.surface) as StrategyDominantSurface | undefined;
  if (!id || !day || !pattern || !surface) return null;
  return {
    id,
    day,
    pattern,
    surface,
    sourceIds: uniqueStrings(asArray(raw.sourceIds).length > 0 ? asArray(raw.sourceIds) : [id]),
    createdAt: createdAt(raw.createdAt),
  };
}

export function createEmptyStrategyHistoryState(): StrategyHistoryStateV1 {
  return {
    decisionHistory: [],
    operationChoiceHistory: [],
    portfolioChoiceHistory: [],
    followUpExecutionHistory: [],
    dominantStrategySurfacedHistory: [],
    lastPrunedDay: null,
  };
}

export function pruneStrategyHistory(
  state: StrategyHistoryStateV1,
  currentDay?: number,
): StrategyHistoryStateV1 {
  const day = currentDay ?? state.lastPrunedDay ?? null;
  return {
    decisionHistory: state.decisionHistory
      .filter((item) => withinAge(item.day, day ?? undefined))
      .slice(-STRATEGY_DECISION_HISTORY_MAX),
    operationChoiceHistory: state.operationChoiceHistory
      .filter((item) => withinAge(item.day, day ?? undefined))
      .slice(-STRATEGY_OPERATION_CHOICE_HISTORY_MAX),
    portfolioChoiceHistory: state.portfolioChoiceHistory
      .filter((item) => withinAge(item.day, day ?? undefined))
      .slice(-STRATEGY_PORTFOLIO_CHOICE_HISTORY_MAX),
    followUpExecutionHistory: state.followUpExecutionHistory
      .filter((item) => withinAge(item.day, day ?? undefined))
      .slice(-STRATEGY_FOLLOW_UP_EXECUTION_HISTORY_MAX),
    dominantStrategySurfacedHistory: state.dominantStrategySurfacedHistory
      .filter((item) => withinAge(item.day, day ?? undefined))
      .slice(-STRATEGY_DOMINANT_SURFACED_HISTORY_MAX),
    lastPrunedDay: day,
  };
}

export function migrateStrategyHistoryState(
  raw: unknown,
  currentDay?: number,
): StrategyHistoryStateV1 {
  if (!isRecord(raw)) {
    return createEmptyStrategyHistoryState();
  }
  return pruneStrategyHistory(
    {
      decisionHistory: asArray(raw.decisionHistory)
        .map(normalizeDecisionRecord)
        .filter((item): item is StrategyDecisionHistoryRecord => Boolean(item)),
      operationChoiceHistory: asArray(raw.operationChoiceHistory)
        .map(normalizeOperationRecord)
        .filter((item): item is StrategyOperationChoiceRecord => Boolean(item)),
      portfolioChoiceHistory: asArray(raw.portfolioChoiceHistory)
        .map(normalizePortfolioRecord)
        .filter((item): item is StrategyPortfolioChoiceRecord => Boolean(item)),
      followUpExecutionHistory: asArray(raw.followUpExecutionHistory)
        .map(normalizeFollowUpRecord)
        .filter((item): item is StrategyFollowUpExecutionRecord => Boolean(item)),
      dominantStrategySurfacedHistory: asArray(raw.dominantStrategySurfacedHistory)
        .map(normalizeSurfacedRecord)
        .filter((item): item is StrategyDominantSurfacedRecord => Boolean(item)),
      lastPrunedDay: asNumber(raw.lastPrunedDay) ?? null,
    },
    currentDay,
  );
}

export function appendStrategyDecisionRecord(
  state: StrategyHistoryStateV1,
  record: StrategyDecisionHistoryRecord,
): StrategyHistoryStateV1 {
  return pruneStrategyHistory({
    ...state,
    decisionHistory: replaceById(state.decisionHistory, record, STRATEGY_DECISION_HISTORY_MAX, record.day),
  }, record.day);
}

export function appendStrategyOperationChoiceRecord(
  state: StrategyHistoryStateV1,
  record: StrategyOperationChoiceRecord,
): StrategyHistoryStateV1 {
  return pruneStrategyHistory({
    ...state,
    operationChoiceHistory: replaceById(
      state.operationChoiceHistory,
      record,
      STRATEGY_OPERATION_CHOICE_HISTORY_MAX,
      record.day,
    ),
  }, record.day);
}

export function appendStrategyPortfolioChoiceRecord(
  state: StrategyHistoryStateV1,
  record: StrategyPortfolioChoiceRecord,
): StrategyHistoryStateV1 {
  return pruneStrategyHistory({
    ...state,
    portfolioChoiceHistory: replaceById(
      state.portfolioChoiceHistory,
      record,
      STRATEGY_PORTFOLIO_CHOICE_HISTORY_MAX,
      record.day,
    ),
  }, record.day);
}

export function appendStrategyFollowUpExecutionRecord(
  state: StrategyHistoryStateV1,
  record: StrategyFollowUpExecutionRecord,
): StrategyHistoryStateV1 {
  return pruneStrategyHistory({
    ...state,
    followUpExecutionHistory: replaceById(
      state.followUpExecutionHistory,
      record,
      STRATEGY_FOLLOW_UP_EXECUTION_HISTORY_MAX,
      record.day,
    ),
  }, record.day);
}

export function appendStrategyDominantSurfacedRecord(
  state: StrategyHistoryStateV1,
  record: StrategyDominantSurfacedRecord,
): StrategyHistoryStateV1 {
  return pruneStrategyHistory({
    ...state,
    dominantStrategySurfacedHistory: replaceById(
      state.dominantStrategySurfacedHistory,
      record,
      STRATEGY_DOMINANT_SURFACED_HISTORY_MAX,
      record.day,
    ),
  }, record.day);
}

export function buildExecutedFollowUpActionIdsForDay(
  state: StrategyHistoryStateV1,
  day: number,
): string[] {
  return uniqueStrings(
    state.followUpExecutionHistory
      .filter((record) => record.day === day && record.status === 'executed')
      .map((record) => record.actionId),
  );
}

export function hasExecutedFollowUpActionToday(
  state: StrategyHistoryStateV1,
  day: number,
  actionId: string,
): boolean {
  return buildExecutedFollowUpActionIdsForDay(state, day).includes(actionId);
}

export function hasSurfacedDominantStrategyRecently(
  state: StrategyHistoryStateV1,
  day: number,
  pattern: DominantStrategyPattern,
  surface: StrategyDominantSurface,
): boolean {
  return state.dominantStrategySurfacedHistory.some(
    (record) =>
      record.pattern === pattern &&
      record.surface === surface &&
      record.day <= day &&
      day - record.day <= STRATEGY_DOMINANT_SURFACE_COOLDOWN_DAYS,
  );
}

export function buildDominantStrategyInputFromPersistedHistory(
  state: StrategyHistoryStateV1,
  day: number,
): DominantStrategyDetectorInput {
  const strategyHistory = pruneStrategyHistory(state, day);
  return {
    day,
    decisionRecords: strategyHistory.decisionHistory,
    portfolioHistory: strategyHistory.portfolioChoiceHistory,
    operationFeedChoiceHistory: strategyHistory.operationChoiceHistory,
    followUpExecutionHistory: strategyHistory.followUpExecutionHistory,
    recentDistrictIds: uniqueStrings([
      ...strategyHistory.decisionHistory.map((record) => record.districtId),
      ...strategyHistory.operationChoiceHistory.map((record) => record.districtId),
      ...strategyHistory.portfolioChoiceHistory.map((record) => record.districtId),
    ]),
    recentDomainTags: uniqueStrings([
      ...strategyHistory.decisionHistory.flatMap((record) => record.domainTags),
      ...strategyHistory.operationChoiceHistory.flatMap((record) => record.domainTags),
      ...strategyHistory.portfolioChoiceHistory.flatMap((record) => record.domainTags),
    ]),
  };
}
