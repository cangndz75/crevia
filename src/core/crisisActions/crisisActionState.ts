import {
  CRISIS_ACTION_EXPIRE_AFTER_DAYS,
  CRISIS_ACTION_MAX_HISTORY,
} from './crisisActionConstants';
import type {
  CrisisActionDailySummary,
  CrisisActionEffect,
  CrisisActionStatus,
  CrisisActionType,
  CrisisActionState,
  CrisisResolutionAction,
} from './crisisActionTypes';

const VALID_TYPES = new Set<CrisisActionType>([
  'crisis_coordination',
  'public_briefing',
  'field_rebalance',
  'preventive_maintenance',
  'monitor_only',
]);

const VALID_STATUSES = new Set<CrisisActionStatus>([
  'available',
  'selected',
  'processed',
  'expired',
]);

export function createInitialCrisisActionState(): CrisisActionState {
  return {
    actionsById: {},
  };
}

function normalizeEffect(raw: unknown): CrisisActionEffect | undefined {
  if (raw == null || typeof raw !== 'object') return undefined;
  const e = raw as Record<string, unknown>;
  if (typeof e.domain !== 'string' || typeof e.delta !== 'number') return undefined;
  return {
    domain: e.domain as CrisisActionEffect['domain'],
    targetId: typeof e.targetId === 'string' ? e.targetId : undefined,
    delta: e.delta,
    reason: typeof e.reason === 'string' ? e.reason : '',
    sourceTags: Array.isArray(e.sourceTags)
      ? e.sourceTags.filter((t): t is string => typeof t === 'string')
      : [],
  };
}

export function normalizeCrisisResolutionAction(
  raw: unknown,
): CrisisResolutionAction | undefined {
  if (raw == null || typeof raw !== 'object') return undefined;
  const a = raw as Record<string, unknown>;
  if (typeof a.id !== 'string' || typeof a.day !== 'number') return undefined;
  if (typeof a.type !== 'string' || !VALID_TYPES.has(a.type as CrisisActionType)) {
    return undefined;
  }
  if (typeof a.status !== 'string' || !VALID_STATUSES.has(a.status as CrisisActionStatus)) {
    return undefined;
  }
  const effects = Array.isArray(a.effects)
    ? a.effects.map(normalizeEffect).filter((x): x is CrisisActionEffect => x != null)
    : [];
  return {
    id: a.id,
    day: Math.floor(a.day),
    type: a.type as CrisisActionType,
    status: a.status as CrisisActionStatus,
    title: typeof a.title === 'string' ? a.title : '',
    summary: typeof a.summary === 'string' ? a.summary : '',
    reasonLine: typeof a.reasonLine === 'string' ? a.reasonLine : '',
    tradeoffLine: typeof a.tradeoffLine === 'string' ? a.tradeoffLine : '',
    advisorLine: typeof a.advisorLine === 'string' ? a.advisorLine : undefined,
    relatedIncidentId:
      typeof a.relatedIncidentId === 'string' ? a.relatedIncidentId : undefined,
    affectedDistrictIds: Array.isArray(a.affectedDistrictIds)
      ? a.affectedDistrictIds.filter((d): d is string => typeof d === 'string').slice(0, 3)
      : [],
    effects,
    selectedAtDay: typeof a.selectedAtDay === 'number' ? a.selectedAtDay : undefined,
    processedAtDay: typeof a.processedAtDay === 'number' ? a.processedAtDay : undefined,
    expiresAtDay: typeof a.expiresAtDay === 'number' ? a.expiresAtDay : undefined,
    sourceTags: Array.isArray(a.sourceTags)
      ? a.sourceTags.filter((t): t is string => typeof t === 'string')
      : [],
  };
}

export function normalizeCrisisActionState(input: unknown): CrisisActionState {
  if (input == null || typeof input !== 'object') {
    return createInitialCrisisActionState();
  }
  const raw = input as Record<string, unknown>;
  const actionsById: Record<string, CrisisResolutionAction> = {};
  if (raw.actionsById != null && typeof raw.actionsById === 'object') {
    for (const [key, value] of Object.entries(raw.actionsById as Record<string, unknown>)) {
      const action = normalizeCrisisResolutionAction(value);
      if (action) actionsById[key] = action;
    }
  }
  let activeActionId =
    typeof raw.activeActionId === 'string' ? raw.activeActionId : undefined;
  if (activeActionId && !actionsById[activeActionId]) {
    activeActionId = undefined;
  }
  const active = activeActionId ? actionsById[activeActionId] : undefined;
  if (active && active.status !== 'available') {
    activeActionId = undefined;
  }

  return {
    actionsById,
    activeActionId,
    dailySummary:
      raw.dailySummary != null && typeof raw.dailySummary === 'object'
        ? (raw.dailySummary as CrisisActionDailySummary)
        : undefined,
    lastGeneratedDay:
      typeof raw.lastGeneratedDay === 'number' ? raw.lastGeneratedDay : undefined,
    lastProcessedDay:
      typeof raw.lastProcessedDay === 'number' ? raw.lastProcessedDay : undefined,
    lastPrunedDay: typeof raw.lastPrunedDay === 'number' ? raw.lastPrunedDay : undefined,
  };
}

export function getActiveCrisisAction(
  state: CrisisActionState,
): CrisisResolutionAction | undefined {
  if (!state.activeActionId) return undefined;
  return state.actionsById[state.activeActionId];
}

export function getSelectedCrisisActionForDay(
  state: CrisisActionState,
  day: number,
): CrisisResolutionAction | undefined {
  return Object.values(state.actionsById).find(
    (a) =>
      a.day === day &&
      (a.status === 'selected' || a.status === 'processed') &&
      a.selectedAtDay === day,
  );
}

export function hasSelectedCrisisActionForDay(
  state: CrisisActionState,
  day: number,
): boolean {
  return getSelectedCrisisActionForDay(state, day) != null;
}

export function addCrisisResolutionAction(
  state: CrisisActionState,
  action: CrisisResolutionAction,
): CrisisActionState {
  return {
    ...state,
    actionsById: { ...state.actionsById, [action.id]: action },
    activeActionId: action.status === 'available' ? action.id : state.activeActionId,
  };
}

export function selectCrisisResolutionAction(
  state: CrisisActionState,
  actionId: string,
  day: number,
): CrisisActionState {
  const action = state.actionsById[actionId];
  if (!action || action.status !== 'available') return state;
  if (hasSelectedCrisisActionForDay(state, day)) return state;
  const updated: CrisisResolutionAction = {
    ...action,
    status: 'selected',
    selectedAtDay: day,
  };
  return {
    ...state,
    actionsById: { ...state.actionsById, [actionId]: updated },
    activeActionId: undefined,
  };
}

export function upsertCrisisResolutionAction(
  state: CrisisActionState,
  action: CrisisResolutionAction,
): CrisisActionState {
  const next = { ...state.actionsById, [action.id]: action };
  return {
    ...state,
    actionsById: next,
    activeActionId: action.status === 'available' ? action.id : undefined,
  };
}

export function markCrisisActionProcessed(
  state: CrisisActionState,
  actionId: string,
  day: number,
): CrisisActionState {
  const action = state.actionsById[actionId];
  if (!action || action.status !== 'selected') return state;
  return {
    ...state,
    actionsById: {
      ...state.actionsById,
      [actionId]: { ...action, status: 'processed', processedAtDay: day },
    },
  };
}

export function expireOldCrisisActions(
  state: CrisisActionState,
  day: number,
): CrisisActionState {
  const actionsById = { ...state.actionsById };
  let activeActionId = state.activeActionId;
  for (const [id, action] of Object.entries(actionsById)) {
    const expireDay = action.expiresAtDay ?? action.day + CRISIS_ACTION_EXPIRE_AFTER_DAYS;
    if (action.status === 'available' && day > expireDay) {
      actionsById[id] = { ...action, status: 'expired' };
      if (activeActionId === id) activeActionId = undefined;
    }
  }
  return { ...state, actionsById, activeActionId };
}

export function pruneCrisisActionHistory(
  state: CrisisActionState,
  currentDay: number,
): CrisisActionState {
  const entries = Object.entries(state.actionsById).sort(
    ([, a], [, b]) => b.day - a.day || b.id.localeCompare(a.id),
  );
  if (entries.length <= CRISIS_ACTION_MAX_HISTORY) {
    return { ...state, lastPrunedDay: currentDay };
  }
  const keep = new Set(entries.slice(0, CRISIS_ACTION_MAX_HISTORY).map(([id]) => id));
  const actionsById: Record<string, CrisisResolutionAction> = {};
  for (const [id, action] of entries) {
    if (keep.has(id)) actionsById[id] = action;
  }
  const activeActionId =
    state.activeActionId && actionsById[state.activeActionId]
      ? state.activeActionId
      : undefined;
  return { ...state, actionsById, activeActionId, lastPrunedDay: currentDay };
}

export function buildCrisisActionDailySummary(
  state: CrisisActionState,
  day: number,
): CrisisActionDailySummary {
  const dayActions = Object.values(state.actionsById).filter((a) => a.day === day);
  const selected = dayActions.find(
    (a) => a.status === 'selected' || a.status === 'processed',
  );
  return {
    day,
    availableCount: dayActions.filter((a) => a.status === 'available').length,
    selectedCount: dayActions.filter(
      (a) => a.status === 'selected' || a.status === 'processed',
    ).length,
    processedCount: dayActions.filter((a) => a.status === 'processed').length,
    selectedActionType: selected?.type,
    reportLines: [],
  };
}
