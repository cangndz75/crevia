import {
  FOLLOW_UP_EXECUTION_COPY,
  FOLLOW_UP_EXECUTION_ACTION_LINES,
  FOLLOW_UP_EXECUTION_RESULT_LINES,
  FOLLOW_UP_EXECUTION_MAX_CANDIDATES,
  FOLLOW_UP_EXECUTION_MIN_DAY,
} from './followUpExecutionConstants';
import { pickSurfaceCopy } from '@/core/contentVarietyQuality';
import type {
  ExecuteFollowUpActionLiteCommand,
  FollowUpExecutionCandidate,
  FollowUpExecutionInput,
  FollowUpExecutionKind,
  FollowUpExecutionResult,
  FollowUpExecutionSourceKind,
  FollowUpExecutionTone,
} from './followUpExecutionTypes';

const KIND_BY_FOLLOW_UP_ACTION: Record<string, FollowUpExecutionKind> = {
  recheck_district: 'recheck_district',
  monitor_signal: 'monitor_signal',
  send_small_team: 'send_small_team',
  rebalance_resource: 'rebalance_resource',
  review_route: 'review_route',
  check_container_line: 'check_container_line',
  calm_social_pulse: 'calm_social_pulse',
  reinforce_trust: 'reinforce_trust',
  capture_memory_trace: 'capture_memory_trace',
  support_recovery: 'support_recovery',
  prepare_tomorrow: 'safe_watch',
  safe_watch: 'safe_watch',
};

const KIND_BY_FEED_BIAS: Record<string, FollowUpExecutionKind> = {
  district_neglect_bias: 'recheck_district',
  district_recovery_bias: 'support_recovery',
  positive_comeback_bias: 'support_recovery',
  follow_up_bias: 'monitor_signal',
  memory_trace_bias: 'capture_memory_trace',
  resource_pressure_bias: 'rebalance_resource',
  route_pressure_bias: 'review_route',
  container_pressure_bias: 'check_container_line',
  social_trust_bias: 'reinforce_trust',
  defer_risk_bias: 'safe_watch',
  city_rhythm_bias: 'monitor_signal',
  safe_watch_bias: 'safe_watch',
};

const KIND_BY_POSITIVE_COMEBACK: Record<string, FollowUpExecutionKind> = {
  trust_recovery: 'reinforce_trust',
  resource_relief: 'rebalance_resource',
  social_support: 'calm_social_pulse',
  district_recovery: 'support_recovery',
  container_improvement: 'check_container_line',
  route_relief: 'review_route',
  follow_up_success: 'support_recovery',
  memory_positive_trace: 'capture_memory_trace',
  opportunity_window: 'support_recovery',
  safe_momentum: 'safe_watch',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function uniqueStrings(values: unknown[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const text = asString(value);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
  }
  return result;
}

function collectSourceIds(...values: unknown[]): string[] {
  return uniqueStrings(values.flatMap((value) => (Array.isArray(value) ? value : [value])));
}

function resolveTone(kind: FollowUpExecutionKind): FollowUpExecutionTone {
  if (kind === 'support_recovery' || kind === 'reinforce_trust') return 'positive';
  if (kind === 'rebalance_resource' || kind === 'review_route' || kind === 'check_container_line') {
    return 'cautious';
  }
  if (kind === 'capture_memory_trace') return 'strategic';
  return 'calm';
}

function pickActionLine(kind: FollowUpExecutionKind, seed: number): string {
  return pickSurfaceCopy(kind, 'follow_up_execution', FOLLOW_UP_EXECUTION_ACTION_LINES[kind], { seed });
}

function pickResultLine(kind: FollowUpExecutionKind, seed: number): string {
  return pickSurfaceCopy(kind, 'follow_up_execution', FOLLOW_UP_EXECUTION_RESULT_LINES[kind], {
    seed,
    duplicateKey: 'result',
  });
}

function makeCandidate(params: {
  actionId: string;
  kind: FollowUpExecutionKind;
  sourceKind: FollowUpExecutionSourceKind;
  sourceIds: string[];
  priority: number;
  title?: string;
  line?: string;
  resultLine?: string;
  districtId?: string;
  districtName?: string;
  status?: FollowUpExecutionCandidate['status'];
}): FollowUpExecutionCandidate {
  const copy = FOLLOW_UP_EXECUTION_COPY[params.kind];
  const title = params.title?.trim() || copy.title;
  const seed = params.priority + params.sourceIds.length;
  return {
    id: `follow-up-execution-${params.actionId}`,
    actionId: params.actionId,
    kind: params.kind,
    title,
    line: params.line?.trim() || pickActionLine(params.kind, seed),
    resultLine: params.resultLine?.trim() || pickResultLine(params.kind, seed),
    districtId: params.districtId,
    districtName: params.districtName,
    status: params.status ?? 'available',
    tone: resolveTone(params.kind),
    priority: clamp(params.priority, 0, 100),
    sourceIds: collectSourceIds(params.sourceIds, params.actionId),
    sourceKinds: [params.sourceKind],
    isPresentationOnly: true,
  };
}

function candidateFromRecord(
  record: Record<string, unknown>,
  sourceKind: FollowUpExecutionSourceKind,
  kindMap: Record<string, FollowUpExecutionKind>,
  fallbackKind: FollowUpExecutionKind,
  index: number,
): FollowUpExecutionCandidate | null {
  const rawKind =
    asString(record.kind) ??
    asString(record.biasKind) ??
    asString(record.traceKind) ??
    asString(record.bindingKind);
  const kind = rawKind ? kindMap[rawKind] ?? fallbackKind : fallbackKind;
  const id =
    asString(record.id) ??
    asString(record.actionId) ??
    asString(record.eventId) ??
    `${sourceKind}-${index}`;
  const sourceIds = collectSourceIds(record.sourceIds, record.appliedBiasIds, id);
  if (sourceIds.length === 0) return null;
  return makeCandidate({
    actionId: `${sourceKind}-${id}`,
    kind,
    sourceKind,
    sourceIds,
    priority: asNumber(record.priority, asNumber(record.scoreBoost, 50)),
    title: asString(record.title),
    line: asString(record.line) ?? asString(record.reasonLine) ?? asString(record.benefitLine),
    districtId: asString(record.districtId),
    districtName: asString(record.districtName),
  });
}

function collectFromFollowUpActions(value: unknown): FollowUpExecutionCandidate[] {
  const result = isRecord(value) ? value : {};
  return asArray(result.actions)
    .map((item, index) => {
      if (!isRecord(item) || item.isFallback === true) return null;
      return candidateFromRecord(item, 'follow_up_action', KIND_BY_FOLLOW_UP_ACTION, 'monitor_signal', index);
    })
    .filter((item): item is FollowUpExecutionCandidate => Boolean(item));
}

function collectFromDay8Binding(value: unknown): FollowUpExecutionCandidate[] {
  const result = isRecord(value) ? value : {};
  return [...asArray(result.biases), ...asArray(result.feedBindings)]
    .map((item, index) => {
      if (!isRecord(item) || item.isFallback === true) return null;
      return candidateFromRecord(item, 'day8_operation_feed_binding', KIND_BY_FEED_BIAS, 'safe_watch', index);
    })
    .filter((item): item is FollowUpExecutionCandidate => Boolean(item));
}

function collectFromPositiveComeback(value: unknown): FollowUpExecutionCandidate[] {
  const result = isRecord(value) ? value : {};
  return asArray(result.candidates)
    .map((item, index) => {
      if (!isRecord(item) || item.isFallback === true) return null;
      return candidateFromRecord(item, 'positive_comeback', KIND_BY_POSITIVE_COMEBACK, 'support_recovery', index);
    })
    .filter((item): item is FollowUpExecutionCandidate => Boolean(item));
}

function collectLooseResult(
  value: unknown,
  sourceKind: FollowUpExecutionSourceKind,
  kind: FollowUpExecutionKind,
): FollowUpExecutionCandidate[] {
  const result = isRecord(value) ? value : {};
  const items = [
    ...asArray(result.traces),
    ...asArray(result.candidates),
    ...asArray(result.cards),
    ...asArray(result.items),
    ...asArray(result.bindings),
    result.primaryTrace,
    result.primaryCandidate,
    result.primaryCard,
    result.primaryBinding,
  ].filter(Boolean);
  return items
    .map((item, index) => {
      if (!isRecord(item) || item.isFallback === true) return null;
      return candidateFromRecord(item, sourceKind, {}, kind, index);
    })
    .filter((item): item is FollowUpExecutionCandidate => Boolean(item));
}

function mergeDuplicateCandidates(candidates: FollowUpExecutionCandidate[]): FollowUpExecutionCandidate[] {
  const byKey = new Map<string, FollowUpExecutionCandidate>();
  for (const candidate of candidates) {
    const key = `${candidate.kind}:${candidate.sourceIds[0] ?? candidate.actionId}`;
    const previous = byKey.get(key);
    if (!previous || candidate.priority > previous.priority) {
      byKey.set(key, previous ? {
        ...candidate,
        sourceIds: collectSourceIds(previous.sourceIds, candidate.sourceIds),
        sourceKinds: Array.from(new Set([...previous.sourceKinds, ...candidate.sourceKinds])),
      } : candidate);
    }
  }
  return [...byKey.values()].sort((a, b) => b.priority - a.priority);
}

function partitionCandidates(
  candidates: FollowUpExecutionCandidate[],
  executedIds: Set<string>,
  expiredIds: Set<string>,
): FollowUpExecutionCandidate[] {
  return candidates.map((candidate) => {
    if (expiredIds.has(candidate.actionId)) return { ...candidate, status: 'expired' };
    if (executedIds.has(candidate.actionId)) return { ...candidate, status: 'executed' };
    return { ...candidate, status: 'available' };
  });
}

export function buildFollowUpExecution(input: FollowUpExecutionInput): FollowUpExecutionResult {
  const day = Math.max(1, input.day);
  if (day < FOLLOW_UP_EXECUTION_MIN_DAY) {
    return {
      day,
      isActive: false,
      availableCandidates: [],
      executedCandidates: [],
      sourceIds: [],
    };
  }

  const executedIds = new Set(input.executedActionIdsToday ?? []);
  const expiredIds = new Set(input.expiredActionIds ?? []);
  const suppressed = new Set(input.suppressSourceIds ?? []);
  const collected = [
    ...collectFromFollowUpActions(input.followUpActionResult),
    ...collectFromDay8Binding(input.day8OperationFeedBindingResult),
    ...collectFromPositiveComeback(input.positiveComebackResult),
    ...collectLooseResult(input.cityMemoryVisibilityResult, 'city_memory_visibility', 'capture_memory_trace'),
    ...collectLooseResult(input.districtNeglectRecoveryResult, 'district_neglect_recovery', 'recheck_district'),
    ...collectLooseResult(input.dailyCapacityPortfolioResult, 'daily_capacity_portfolio', 'rebalance_resource'),
    ...collectLooseResult(input.portfolioDeferRiskResult, 'portfolio_defer_risk', 'safe_watch'),
    ...collectLooseResult(input.oneMoreDayRetentionResult, 'one_more_day_retention', 'safe_watch'),
    ...collectLooseResult(input.cityRhythmDirectorResult, 'city_rhythm_director', 'monitor_signal'),
  ].filter((candidate) => !candidate.sourceIds.some((id) => suppressed.has(id)));

  const candidates = partitionCandidates(mergeDuplicateCandidates(collected), executedIds, expiredIds);
  const availableCandidates = candidates
    .filter((candidate) => candidate.status === 'available')
    .slice(0, FOLLOW_UP_EXECUTION_MAX_CANDIDATES);
  const executedCandidates = candidates
    .filter((candidate) => candidate.status === 'executed')
    .slice(0, FOLLOW_UP_EXECUTION_MAX_CANDIDATES);
  const primaryCandidate = executedCandidates[0] ?? availableCandidates[0];
  const sourceIds = collectSourceIds(candidates.flatMap((candidate) => candidate.sourceIds));

  return {
    day,
    isActive: availableCandidates.length > 0 || executedCandidates.length > 0,
    availableCandidates,
    executedCandidates,
    primaryCandidate,
    reportCandidate: executedCandidates[0] ?? availableCandidates[0],
    hubCandidate: executedCandidates[0] ?? availableCandidates[0],
    eceCandidate: executedCandidates[0] ?? availableCandidates[0],
    sourceIds,
  };
}

export function executeFollowUpActionLite(
  input: FollowUpExecutionInput,
  command: ExecuteFollowUpActionLiteCommand,
): FollowUpExecutionResult {
  const base = buildFollowUpExecution({
    ...input,
    day: command.day,
    executedActionIdsToday: (input.executedActionIdsToday ?? []).filter((id) => id !== command.actionId),
  });
  const alreadyExecuted = new Set(input.executedActionIdsToday ?? []).has(command.actionId);
  const target = [...base.availableCandidates, ...base.executedCandidates].find(
    (candidate) => candidate.actionId === command.actionId,
  );

  if (command.day < FOLLOW_UP_EXECUTION_MIN_DAY || !target || alreadyExecuted) {
    const blocked =
      target ??
      makeCandidate({
        actionId: command.actionId || 'blocked',
        kind: 'safe_watch',
        sourceKind: 'follow_up_action',
        sourceIds: [command.actionId || 'blocked'],
        priority: 0,
        status: 'blocked',
        title: 'Takip engellendi',
        line: 'Bu takip bugun calistirilamaz.',
        resultLine: alreadyExecuted
          ? 'Bu takip bugun zaten isaretlendi; tekrar calistirilmayacak.'
          : 'Bu takip icin guvenli bir kaynak bulunamadi.',
      });
    const primaryCandidate = { ...blocked, status: 'blocked' as const };
    return {
      ...base,
      isActive: base.isActive || Boolean(command.actionId),
      primaryCandidate,
      reportCandidate: primaryCandidate,
      hubCandidate: primaryCandidate,
      eceCandidate: primaryCandidate,
    };
  }

  return buildFollowUpExecution({
    ...input,
    day: command.day,
    executedActionIdsToday: [...(input.executedActionIdsToday ?? []), command.actionId],
  });
}

export function collectFollowUpExecutionLines(
  result: FollowUpExecutionResult | null | undefined,
): string[] {
  if (!result) return [];
  return [
    ...result.executedCandidates.map((candidate) => candidate.resultLine),
    ...result.availableCandidates.map((candidate) => candidate.line),
  ].filter(Boolean);
}
