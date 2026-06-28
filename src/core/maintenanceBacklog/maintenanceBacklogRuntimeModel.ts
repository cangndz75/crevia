import { buildOperationReadinessSnapshot } from '@/core/operationReadiness/operationReadinessModel';

import { buildMaintenanceBacklogSnapshot } from './maintenanceBacklogModel';
import type { MaintenanceBacklogItem, MaintenanceBacklogSeverity } from './maintenanceBacklogTypes';
import {
  MAINTENANCE_RUNTIME_ATTENTION_PROMOTE_STREAK,
  MAINTENANCE_RUNTIME_ESCALATE_ATTENTION_DAYS,
  MAINTENANCE_RUNTIME_ESCALATE_STRAINED_DAYS,
  MAINTENANCE_RUNTIME_MAX_ACTIVE,
  MAINTENANCE_RUNTIME_MAX_TOTAL,
  MAINTENANCE_RUNTIME_RESOLVED_RETENTION_DAYS,
} from './maintenanceBacklogRuntimeConstants';
import type {
  MaintenanceBacklogDayCloseInput,
  MaintenanceBacklogRuntimeState,
  MaintenanceRuntimeDomain,
  MaintenanceRuntimeItem,
  MaintenanceRuntimeSeverity,
  MaintenanceRuntimeStatus,
} from './maintenanceBacklogRuntimeTypes';

const VALID_DOMAINS = new Set<MaintenanceRuntimeDomain>([
  'personnel',
  'vehicle',
  'equipment',
  'facility',
  'route',
  'budget',
  'operation',
]);

const VALID_SEVERITIES = new Set<MaintenanceRuntimeSeverity>([
  'attention',
  'strained',
  'critical',
]);

const VALID_STATUSES = new Set<MaintenanceRuntimeStatus>([
  'open',
  'watching',
  'carried',
  'resolved',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function mapDerivedSeverityToRuntime(
  severity: MaintenanceBacklogSeverity,
): MaintenanceRuntimeSeverity | null {
  if (severity === 'critical') return 'critical';
  if (severity === 'strained') return 'strained';
  if (severity === 'attention' || severity === 'watch') return 'attention';
  return null;
}

function escalateSeverity(
  severity: MaintenanceRuntimeSeverity,
  carryOverDays: number,
): MaintenanceRuntimeSeverity {
  if (carryOverDays >= MAINTENANCE_RUNTIME_ESCALATE_STRAINED_DAYS && severity === 'strained') {
    return 'critical';
  }
  if (carryOverDays >= MAINTENANCE_RUNTIME_ESCALATE_ATTENTION_DAYS && severity === 'attention') {
    return 'strained';
  }
  return severity;
}

function compareSeverity(a: MaintenanceRuntimeSeverity, b: MaintenanceRuntimeSeverity): number {
  const rank: Record<MaintenanceRuntimeSeverity, number> = {
    attention: 1,
    strained: 2,
    critical: 3,
  };
  return rank[a] - rank[b];
}

function maxSeverity(
  a: MaintenanceRuntimeSeverity,
  b: MaintenanceRuntimeSeverity,
): MaintenanceRuntimeSeverity {
  return compareSeverity(a, b) >= 0 ? a : b;
}

function readinessDomainForRuntime(
  domain: MaintenanceRuntimeDomain,
): import('@/core/operationReadiness/operationReadinessTypes').ReadinessDomain {
  return domain;
}

export function createEmptyMaintenanceBacklogRuntimeState(): MaintenanceBacklogRuntimeState {
  return { items: [], attentionStreaks: {} };
}

export function sanitizeMaintenanceRuntimeItem(raw: unknown): MaintenanceRuntimeItem | null {
  if (!isRecord(raw)) return null;
  const id = asString(raw.id);
  const domain = asString(raw.domain) as MaintenanceRuntimeDomain | undefined;
  const severity = asString(raw.severity) as MaintenanceRuntimeSeverity | undefined;
  const status = asString(raw.status) as MaintenanceRuntimeStatus | undefined;
  const sourceDedupeKey = asString(raw.sourceDedupeKey);
  const createdDay = asNumber(raw.createdDay);
  const updatedDay = asNumber(raw.updatedDay);
  const carryOverDays = asNumber(raw.carryOverDays) ?? 0;

  if (!id || !domain || !VALID_DOMAINS.has(domain)) return null;
  if (!severity || !VALID_SEVERITIES.has(severity)) return null;
  if (!status || !VALID_STATUSES.has(status)) return null;
  if (!sourceDedupeKey || createdDay == null || updatedDay == null) return null;

  const lastReasonLabels = Array.isArray(raw.lastReasonLabels)
    ? raw.lastReasonLabels
        .map((label) => asString(label))
        .filter((label): label is string => Boolean(label))
        .slice(0, 4)
    : [];

  return {
    id,
    domain,
    severity,
    status,
    createdDay,
    updatedDay,
    carryOverDays: Math.max(0, carryOverDays),
    sourceReadinessId: asString(raw.sourceReadinessId),
    sourceDedupeKey,
    lastReasonLabels,
    districtId: asString(raw.districtId),
    districtName: asString(raw.districtName),
    relatedEventId: asString(raw.relatedEventId),
  };
}

export function migrateMaintenanceBacklogRuntime(
  raw: unknown,
  currentDay: number,
): MaintenanceBacklogRuntimeState {
  if (!isRecord(raw)) return createEmptyMaintenanceBacklogRuntimeState();

  const items = Array.isArray(raw.items)
    ? raw.items
        .map(sanitizeMaintenanceRuntimeItem)
        .filter((item): item is MaintenanceRuntimeItem => item !== null)
    : [];

  const attentionStreaks: Record<string, number> = {};
  if (isRecord(raw.attentionStreaks)) {
    for (const [key, value] of Object.entries(raw.attentionStreaks)) {
      const streak = asNumber(value);
      if (streak != null && streak > 0) attentionStreaks[key] = Math.min(streak, 7);
    }
  }

  const lastProcessedDay = asNumber(raw.lastProcessedDay);

  return cleanupMaintenanceBacklog(
    {
      items,
      attentionStreaks,
      lastProcessedDay,
    },
    currentDay,
  );
}

function countActiveItems(items: MaintenanceRuntimeItem[]): number {
  return items.filter((item) => item.status !== 'resolved').length;
}

function findMatchingItem(
  items: MaintenanceRuntimeItem[],
  candidate: MaintenanceBacklogItem,
  input: MaintenanceBacklogDayCloseInput,
): MaintenanceRuntimeItem | undefined {
  return items.find((item) => {
    if (item.status === 'resolved') return false;
    if (item.sourceDedupeKey === candidate.dedupeKey) return true;
    if (item.domain === candidate.domain && !input.districtId && !item.districtId) return true;
    if (
      item.domain === candidate.domain &&
      input.districtId &&
      item.districtId === input.districtId
    ) {
      return true;
    }
    if (
      item.domain === candidate.domain &&
      input.relatedEventId &&
      item.relatedEventId === input.relatedEventId
    ) {
      return true;
    }
    return false;
  });
}

function buildRuntimeItemId(
  domain: MaintenanceRuntimeDomain,
  dedupeKey: string,
  districtId?: string,
): string {
  const districtPart = districtId ? `_${districtId}` : '';
  return `mbl_${domain}${districtPart}_${dedupeKey.replace(/[^a-z0-9]+/gi, '_').slice(0, 24)}`;
}

function createRuntimeItem(
  candidate: MaintenanceBacklogItem,
  severity: MaintenanceRuntimeSeverity,
  day: number,
  input: MaintenanceBacklogDayCloseInput,
  reasonLabels: string[],
): MaintenanceRuntimeItem {
  return {
    id: buildRuntimeItemId(candidate.domain, candidate.dedupeKey, input.districtId),
    domain: candidate.domain,
    severity,
    status: severity === 'attention' ? 'watching' : 'open',
    createdDay: day,
    updatedDay: day,
    carryOverDays: 0,
    sourceReadinessId: candidate.sourceReadinessId,
    sourceDedupeKey: candidate.dedupeKey,
    lastReasonLabels: reasonLabels,
    districtId: input.districtId,
    districtName: input.districtName,
    relatedEventId: input.relatedEventId,
  };
}

function mergeRuntimeItem(
  existing: MaintenanceRuntimeItem,
  candidate: MaintenanceBacklogItem,
  severity: MaintenanceRuntimeSeverity,
  day: number,
  reasonLabels: string[],
): MaintenanceRuntimeItem {
  return {
    ...existing,
    severity: maxSeverity(existing.severity, severity),
    status: existing.status === 'resolved' ? 'open' : existing.status,
    updatedDay: day,
    sourceReadinessId: candidate.sourceReadinessId ?? existing.sourceReadinessId,
    lastReasonLabels: [...new Set([...reasonLabels, ...existing.lastReasonLabels])].slice(0, 4),
  };
}

function buildDayCloseReadinessInput(input: MaintenanceBacklogDayCloseInput) {
  let moraleDelta = 0;
  if (input.staffMorale != null) {
    if (input.staffMorale < 45) moraleDelta = -4;
    else if (input.staffMorale < 50) moraleDelta = -3;
    else if (input.staffMorale < 55) moraleDelta = -2;
    else if (input.staffMorale < 58) moraleDelta = -1;
  }
  const budgetDelta =
    input.budget != null && input.budget < 65000 ? -3 : undefined;
  const publicSatisfactionPreview =
    input.publicSatisfaction != null ? input.publicSatisfaction - 60 : 0;
  const eventRiskLevel =
    (input.warningsCount ?? 0) > 2
      ? 'high'
      : (input.warningsCount ?? 0) > 0
        ? 'medium'
        : 'low';

  const vehiclesStatus = input.operationSignals?.vehicles?.status;
  const personnelStatus = input.operationSignals?.personnel?.status;

  let resolvedMoraleDelta = moraleDelta;
  if (personnelStatus === 'critical') resolvedMoraleDelta = -4;
  else if (personnelStatus === 'strained') resolvedMoraleDelta = -3;
  else if (personnelStatus === 'watch') resolvedMoraleDelta = Math.min(resolvedMoraleDelta, -2);

  return {
    phase: 'result' as const,
    day: input.day,
    moraleDelta: resolvedMoraleDelta,
    budgetDelta:
      vehiclesStatus === 'critical' || vehiclesStatus === 'strained' ? -3 : budgetDelta,
    publicSatisfactionPreview,
    eventRiskLevel,
    hasVehicle: vehiclesStatus !== 'critical',
  };
}

function incrementAttentionStreak(
  state: MaintenanceBacklogRuntimeState,
  dedupeKey: string,
): number {
  const next = (state.attentionStreaks[dedupeKey] ?? 0) + 1;
  state.attentionStreaks[dedupeKey] = next;
  return next;
}

function resetAttentionStreak(state: MaintenanceBacklogRuntimeState, dedupeKey: string) {
  delete state.attentionStreaks[dedupeKey];
}

export function cleanupMaintenanceBacklog(
  state: MaintenanceBacklogRuntimeState,
  currentDay: number,
): MaintenanceBacklogRuntimeState {
  let items = state.items.filter((item) => {
    if (item.status !== 'resolved') return true;
    return currentDay - item.updatedDay <= MAINTENANCE_RUNTIME_RESOLVED_RETENTION_DAYS;
  });

  const active = items
    .filter((item) => item.status !== 'resolved')
    .sort((a, b) => {
      const severityDiff = compareSeverity(b.severity, a.severity);
      if (severityDiff !== 0) return severityDiff;
      return b.updatedDay - a.updatedDay;
    });

  const activeIds = new Set(
    active.slice(0, MAINTENANCE_RUNTIME_MAX_ACTIVE).map((item) => item.id),
  );
  const resolved = items.filter((item) => item.status === 'resolved');
  const trimmedActive = active.filter((item) => activeIds.has(item.id));
  items = [...trimmedActive, ...resolved].slice(-MAINTENANCE_RUNTIME_MAX_TOTAL);

  return { ...state, items };
}

export function updateMaintenanceBacklogForDay(
  state: MaintenanceBacklogRuntimeState,
  input: MaintenanceBacklogDayCloseInput,
): MaintenanceBacklogRuntimeState {
  if (state.lastProcessedDay === input.day) return state;

  const readinessSnapshot = buildOperationReadinessSnapshot(
    buildDayCloseReadinessInput(input),
  );
  const derived = buildMaintenanceBacklogSnapshot({ readinessSnapshot });
  const candidates = [...derived.items].sort((a, b) => b.priority - a.priority);

  const socialSignal = readinessSnapshot.signals.find((s) => s.domain === 'social');
  const socialLabel =
    socialSignal &&
    (socialSignal.status === 'limited' ||
      socialSignal.status === 'strained' ||
      socialSignal.status === 'blocked')
      ? 'Sosyal tepki yüksek'
      : undefined;

  let items = [...state.items];
  const attentionStreaks = { ...state.attentionStreaks };

  items = items.map((item) => {
    if (item.status === 'resolved') return item;
    const signal = readinessSnapshot.signals.find(
      (s) => readinessDomainForRuntime(item.domain) === s.domain,
    );
    if (signal?.status === 'ready') {
      return { ...item, status: 'resolved' as const, updatedDay: input.day };
    }
    return item;
  });

  items = items.map((item) => {
    if (item.status === 'resolved') return item;
    const carryOverDays = item.carryOverDays + 1;
    const severity = escalateSeverity(item.severity, carryOverDays);
    const status: MaintenanceRuntimeStatus =
      item.status === 'open' || item.status === 'watching' ? 'carried' : item.status;
    return {
      ...item,
      carryOverDays,
      severity,
      status,
      updatedDay: input.day,
    };
  });

  const workingState: MaintenanceBacklogRuntimeState = {
    items,
    attentionStreaks,
    lastProcessedDay: state.lastProcessedDay,
  };

  const todayAttentionKeys = new Set<string>();

  for (const candidate of candidates) {
    const runtimeSeverity = mapDerivedSeverityToRuntime(candidate.severity);
    if (!runtimeSeverity) continue;

    const reasonLabels = [
      ...(socialLabel ? [socialLabel] : []),
      ...candidate.reasonChips.map((chip) => chip.label),
    ].slice(0, 4);

    let shouldPromote = false;
    if (runtimeSeverity === 'critical' || runtimeSeverity === 'strained') {
      shouldPromote = true;
    } else if (runtimeSeverity === 'attention') {
      todayAttentionKeys.add(candidate.dedupeKey);
      const streak = incrementAttentionStreak(workingState, candidate.dedupeKey);
      shouldPromote = streak >= MAINTENANCE_RUNTIME_ATTENTION_PROMOTE_STREAK;
    }

    if (!shouldPromote) continue;

    resetAttentionStreak(workingState, candidate.dedupeKey);

    const existing = findMatchingItem(workingState.items, candidate, input);
    if (existing) {
      workingState.items = workingState.items.map((item) =>
        item.id === existing.id
          ? mergeRuntimeItem(item, candidate, runtimeSeverity, input.day, reasonLabels)
          : item,
      );
    } else if (countActiveItems(workingState.items) < MAINTENANCE_RUNTIME_MAX_ACTIVE) {
      workingState.items.push(
        createRuntimeItem(candidate, runtimeSeverity, input.day, input, reasonLabels),
      );
    }
  }

  for (const key of Object.keys(workingState.attentionStreaks)) {
    if (!todayAttentionKeys.has(key)) {
      delete workingState.attentionStreaks[key];
    }
  }

  return cleanupMaintenanceBacklog(
    {
      ...workingState,
      lastProcessedDay: input.day,
    },
    input.day,
  );
}

export function selectActiveMaintenanceRuntimeItems(
  state: MaintenanceBacklogRuntimeState,
  limit = MAINTENANCE_RUNTIME_MAX_ACTIVE,
): MaintenanceRuntimeItem[] {
  return state.items
    .filter((item) => item.status !== 'resolved')
    .sort((a, b) => {
      const severityDiff = compareSeverity(b.severity, a.severity);
      if (severityDiff !== 0) return severityDiff;
      return b.updatedDay - a.updatedDay;
    })
    .slice(0, limit);
}
