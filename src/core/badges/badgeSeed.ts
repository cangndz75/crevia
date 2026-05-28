import { ALL_BADGE_IDS, BADGE_BY_ID } from './badgeConstants';
import type {
  BadgeHistoryEntry,
  BadgeId,
  BadgeProgressState,
  BadgeState,
} from './badgeTypes';

function isRecord(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

function isBadgeId(val: unknown): val is BadgeId {
  return typeof val === 'string' && val in BADGE_BY_ID;
}

function uniqueBadgeIds(ids: unknown): BadgeId[] {
  if (!Array.isArray(ids)) return [];
  const seen = new Set<BadgeId>();
  const result: BadgeId[] = [];
  for (const item of ids) {
    if (isBadgeId(item) && !seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }
  return result;
}

function normalizeProgressState(
  badgeId: BadgeId,
  raw: unknown,
  day: number,
): BadgeProgressState {
  const target = BADGE_BY_ID[badgeId].target;
  if (!isRecord(raw)) {
    return { badgeId, current: 0, target, completed: false, updatedDay: day };
  }
  const currentRaw = typeof raw.current === 'number' ? raw.current : 0;
  const current = Math.max(0, Math.min(target, Math.round(currentRaw)));
  const completed =
    typeof raw.completed === 'boolean' ? raw.completed : current >= target;
  return {
    badgeId,
    current: completed ? target : current,
    target,
    completed,
    updatedDay:
      typeof raw.updatedDay === 'number' ? raw.updatedDay : day,
  };
}

function createDefaultProgressMap(day: number): Record<BadgeId, BadgeProgressState> {
  const map = {} as Record<BadgeId, BadgeProgressState>;
  for (const badgeId of ALL_BADGE_IDS) {
    map[badgeId] = normalizeProgressState(badgeId, null, day);
  }
  return map;
}

function normalizeHistory(raw: unknown): BadgeHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const result: BadgeHistoryEntry[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    if (!isBadgeId(item.badgeId)) continue;
    if (typeof item.earnedDay !== 'number') continue;
    const source = item.source;
    if (
      source !== 'daily_report' &&
      source !== 'pilot_completion' &&
      source !== 'authority_evaluation'
    ) {
      continue;
    }
    result.push({
      badgeId: item.badgeId,
      earnedDay: item.earnedDay,
      source,
      pilotRunId:
        typeof item.pilotRunId === 'string' ? item.pilotRunId : undefined,
    });
  }
  return result;
}

export function createInitialBadgeState(day: number): BadgeState {
  const safeDay = Math.max(1, day);
  return {
    earnedBadgeIds: [],
    badgeProgress: createDefaultProgressMap(safeDay),
    recentlyEarnedBadgeIds: [],
    history: [],
    lastEvaluatedDay: 0,
    lastEvaluatedPilotRunId: undefined,
  };
}

export function normalizeBadgeState(input: unknown, day: number): BadgeState {
  if (!isRecord(input)) {
    return createInitialBadgeState(day);
  }

  const safeDay = Math.max(1, day);
  const earnedBadgeIds = uniqueBadgeIds(input.earnedBadgeIds);
  const recentlyEarnedBadgeIds = uniqueBadgeIds(input.recentlyEarnedBadgeIds);
  const defaults = createDefaultProgressMap(safeDay);
  const badgeProgress = { ...defaults };

  if (isRecord(input.badgeProgress)) {
    for (const badgeId of ALL_BADGE_IDS) {
      badgeProgress[badgeId] = normalizeProgressState(
        badgeId,
        input.badgeProgress[badgeId],
        safeDay,
      );
    }
  }

  for (const badgeId of earnedBadgeIds) {
    badgeProgress[badgeId] = {
      badgeId,
      current: BADGE_BY_ID[badgeId].target,
      target: BADGE_BY_ID[badgeId].target,
      completed: true,
      updatedDay: badgeProgress[badgeId]?.updatedDay ?? safeDay,
    };
  }

  return {
    earnedBadgeIds,
    badgeProgress,
    recentlyEarnedBadgeIds,
    history: normalizeHistory(input.history),
    lastEvaluatedDay:
      typeof input.lastEvaluatedDay === 'number'
        ? Math.max(0, input.lastEvaluatedDay)
        : 0,
    lastEvaluatedPilotRunId:
      typeof input.lastEvaluatedPilotRunId === 'string'
        ? input.lastEvaluatedPilotRunId
        : undefined,
  };
}

export function normalizePersistedBadgeState(
  input: unknown,
  day: number,
): BadgeState {
  return normalizeBadgeState(input, day);
}
