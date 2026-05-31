import { getMainOperationAccess } from '@/core/monetization/monetizationState';
import type { MonetizationState } from '@/core/monetization/monetizationTypes';
import type { GameState } from '@/core/models/GameState';
import { getMapDistrictLabel } from '@/features/map/utils/mapDistrictLabels';
import type { MapDistrictId } from '@/features/map/data/mapDistrictConstants';

import {
  MAIN_OPERATION_DISTRICT_IDS,
  MAIN_OPERATION_FIRST_CITY_DAY,
  MAIN_OPERATION_SEASON_ID,
  MAIN_OPERATION_SEASON_LENGTH_DAYS,
  createInitialSeasonGoals,
  getMainOperationDistrictSummary,
  resolveDistrictStatusForSeasonDay,
} from './mainOperationConstants';
import type {
  MainOperationAccessMode,
  MainOperationDistrictScope,
  MainOperationSeasonGoal,
  MainOperationSeasonState,
  MainOperationSeasonStatus,
} from './mainOperationTypes';

function clamp0to100(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function isMapDistrictId(value: string): value is MapDistrictId {
  return (MAIN_OPERATION_DISTRICT_IDS as readonly string[]).includes(value);
}

export function getMainOperationSeasonDay(
  state: MainOperationSeasonState,
  cityDay: number,
): number {
  if (cityDay < MAIN_OPERATION_FIRST_CITY_DAY) {
    return 0;
  }
  if (state.startedAtDay != null && cityDay >= state.startedAtDay) {
    return Math.max(1, cityDay - state.startedAtDay + 1);
  }
  return Math.max(1, cityDay - MAIN_OPERATION_FIRST_CITY_DAY + 1);
}

function buildDistrictScopesForAccess(
  seasonDay: number,
  accessMode: 'limited' | 'full',
  cityDay: number,
): Record<string, MainOperationDistrictScope> {
  const scopes: Record<string, MainOperationDistrictScope> = {};
  for (const districtId of MAIN_OPERATION_DISTRICT_IDS) {
    const status = resolveDistrictStatusForSeasonDay(
      districtId,
      seasonDay,
      accessMode,
    );
    scopes[districtId] = {
      districtId,
      status,
      activatedDay:
        status === 'active' ? cityDay : undefined,
      title: getMapDistrictLabel(districtId),
      summary: getMainOperationDistrictSummary(districtId),
      pressureScore:
        status === 'active' ? 42 : status === 'agenda' ? 58 : status === 'preview' ? 72 : 80,
    };
  }
  return scopes;
}

export function createInitialMainOperationSeasonState(): MainOperationSeasonState {
  return {
    seasonId: MAIN_OPERATION_SEASON_ID,
    status: 'inactive',
    accessMode: 'none',
    currentSeasonDay: 0,
    seasonLengthDays: MAIN_OPERATION_SEASON_LENGTH_DAYS,
    districtScopes: {},
    goals: createInitialSeasonGoals().map((g) => ({ ...g, status: 'active' })),
  };
}

export function createFullMainOperationSeasonState(
  startDay: number,
): MainOperationSeasonState {
  const safeDay = Math.max(MAIN_OPERATION_FIRST_CITY_DAY, Math.round(startDay));
  const seasonDay = getMainOperationSeasonDay(
    {
      ...createInitialMainOperationSeasonState(),
      startedAtDay: safeDay,
    },
    safeDay,
  );
  return {
    seasonId: MAIN_OPERATION_SEASON_ID,
    status: 'active',
    accessMode: 'full',
    startedAtDay: safeDay,
    currentSeasonDay: seasonDay,
    seasonLengthDays: MAIN_OPERATION_SEASON_LENGTH_DAYS,
    districtScopes: buildDistrictScopesForAccess(seasonDay, 'full', safeDay),
    goals: createInitialSeasonGoals(),
    lastRefreshedDay: safeDay,
  };
}

export function createLimitedMainOperationSeasonPreviewState(
  day: number,
): MainOperationSeasonState {
  const safeDay = Math.max(MAIN_OPERATION_FIRST_CITY_DAY, Math.round(day));
  const seasonDay = Math.max(1, safeDay - MAIN_OPERATION_FIRST_CITY_DAY + 1);
  return {
    seasonId: MAIN_OPERATION_SEASON_ID,
    status: 'available',
    accessMode: 'limited',
    startedAtDay: undefined,
    currentSeasonDay: seasonDay,
    seasonLengthDays: MAIN_OPERATION_SEASON_LENGTH_DAYS,
    districtScopes: buildDistrictScopesForAccess(seasonDay, 'limited', safeDay),
    goals: createInitialSeasonGoals().map((g) => ({
      ...g,
      progress: 0,
      status: 'active' as const,
    })),
    lastRefreshedDay: safeDay,
  };
}

function normalizeGoal(goal: unknown): MainOperationSeasonGoal | null {
  if (!goal || typeof goal !== 'object') return null;
  const g = goal as Record<string, unknown>;
  if (typeof g.id !== 'string' || typeof g.domain !== 'string') return null;
  const status =
    g.status === 'completed' || g.status === 'failed' ? g.status : 'active';
  return {
    id: g.id,
    domain: g.domain as MainOperationSeasonGoal['domain'],
    title: typeof g.title === 'string' ? g.title : 'Sezon hedefi',
    description:
      typeof g.description === 'string' ? g.description : '',
    progress: clamp0to100(
      typeof g.progress === 'number' ? g.progress : 0,
    ),
    target: clamp0to100(typeof g.target === 'number' ? g.target : 100),
    status,
    sourceTags: Array.isArray(g.sourceTags)
      ? g.sourceTags.filter((t): t is string => typeof t === 'string')
      : [],
  };
}

function normalizeDistrictScope(
  scope: unknown,
  districtId: MapDistrictId,
): MainOperationDistrictScope {
  if (!scope || typeof scope !== 'object') {
    return {
      districtId,
      status: 'inactive',
      title: getMapDistrictLabel(districtId),
      summary: getMainOperationDistrictSummary(districtId),
      pressureScore: 50,
    };
  }
  const s = scope as Record<string, unknown>;
  const status =
    s.status === 'active' ||
    s.status === 'agenda' ||
    s.status === 'preview' ||
    s.status === 'inactive'
      ? s.status
      : 'inactive';
  return {
    districtId,
    status,
    activatedDay:
      typeof s.activatedDay === 'number' ? Math.round(s.activatedDay) : undefined,
    title:
      typeof s.title === 'string' ? s.title : getMapDistrictLabel(districtId),
    summary:
      typeof s.summary === 'string'
        ? s.summary
        : getMainOperationDistrictSummary(districtId),
    pressureScore: clamp0to100(
      typeof s.pressureScore === 'number' ? s.pressureScore : 50,
    ),
  };
}

export function normalizeMainOperationSeasonState(
  input: unknown,
  day: number,
  monetization?: MonetizationState,
): MainOperationSeasonState {
  const accessFromMonetization = monetization
    ? deriveAccessModeFromMonetization(monetization)
    : 'none';

  if (!input || typeof input !== 'object') {
    if (accessFromMonetization === 'full' && day >= MAIN_OPERATION_FIRST_CITY_DAY) {
      return createFullMainOperationSeasonState(day);
    }
    if (accessFromMonetization === 'limited' && day >= MAIN_OPERATION_FIRST_CITY_DAY) {
      return createLimitedMainOperationSeasonPreviewState(day);
    }
    return createInitialMainOperationSeasonState();
  }

  const raw = input as Record<string, unknown>;
  const seasonId =
    raw.seasonId === MAIN_OPERATION_SEASON_ID
      ? MAIN_OPERATION_SEASON_ID
      : MAIN_OPERATION_SEASON_ID;

  let accessMode: MainOperationAccessMode =
    raw.accessMode === 'full' ||
    raw.accessMode === 'limited' ||
    raw.accessMode === 'none'
      ? raw.accessMode
      : 'none';

  if (accessFromMonetization === 'full') {
    accessMode = 'full';
  } else if (accessFromMonetization === 'limited') {
    accessMode = 'limited';
  }

  let status: MainOperationSeasonStatus =
    raw.status === 'active' ||
    raw.status === 'available' ||
    raw.status === 'completed' ||
    raw.status === 'inactive'
      ? raw.status
      : 'inactive';

  if (accessMode === 'full' && day >= MAIN_OPERATION_FIRST_CITY_DAY) {
    status = 'active';
  } else if (accessMode === 'limited' && day >= MAIN_OPERATION_FIRST_CITY_DAY) {
    status = status === 'active' ? 'available' : status;
  } else if (day < MAIN_OPERATION_FIRST_CITY_DAY) {
    status = 'inactive';
    accessMode = 'none';
  }

  const startedAtDay =
    typeof raw.startedAtDay === 'number'
      ? Math.round(raw.startedAtDay)
      : accessMode === 'full' && day >= MAIN_OPERATION_FIRST_CITY_DAY
        ? MAIN_OPERATION_FIRST_CITY_DAY
        : undefined;

  const base: MainOperationSeasonState = {
    seasonId,
    status,
    accessMode,
    startedAtDay,
    currentSeasonDay:
      typeof raw.currentSeasonDay === 'number'
        ? Math.max(0, Math.round(raw.currentSeasonDay))
        : 0,
    seasonLengthDays:
      typeof raw.seasonLengthDays === 'number'
        ? Math.max(1, Math.round(raw.seasonLengthDays))
        : MAIN_OPERATION_SEASON_LENGTH_DAYS,
    districtScopes: {},
    goals: [],
    lastProcessedDay:
      typeof raw.lastProcessedDay === 'number'
        ? Math.round(raw.lastProcessedDay)
        : undefined,
    lastRefreshedDay:
      typeof raw.lastRefreshedDay === 'number'
        ? Math.round(raw.lastRefreshedDay)
        : undefined,
    lastSummaryDay:
      typeof raw.lastSummaryDay === 'number'
        ? Math.round(raw.lastSummaryDay)
        : undefined,
  };

  base.currentSeasonDay = getMainOperationSeasonDay(base, day);

  const rawScopes = isRecord(raw.districtScopes) ? raw.districtScopes : {};
  for (const districtId of MAIN_OPERATION_DISTRICT_IDS) {
    base.districtScopes[districtId] = normalizeDistrictScope(
      rawScopes[districtId],
      districtId,
    );
  }

  const rawGoals = Array.isArray(raw.goals) ? raw.goals : [];
  const normalizedGoals = rawGoals
    .map((g) => normalizeGoal(g))
    .filter((g): g is MainOperationSeasonGoal => g != null);
  base.goals =
    normalizedGoals.length > 0 ? normalizedGoals : createInitialSeasonGoals();

  if (
    Object.values(base.districtScopes).every((s) => s.status === 'inactive')
  ) {
    const mode = accessMode === 'full' ? 'full' : 'limited';
    if (accessMode !== 'none' && day >= MAIN_OPERATION_FIRST_CITY_DAY) {
      base.districtScopes = buildDistrictScopesForAccess(
        base.currentSeasonDay,
        mode,
        day,
      );
    }
  }

  return base;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export function deriveAccessModeFromMonetization(
  monetization: MonetizationState,
): MainOperationAccessMode {
  const access = getMainOperationAccess(monetization);
  if (access === 'full') return 'full';
  if (access === 'limited') return 'limited';
  return 'none';
}

export function getActiveMainOperationDistrictIds(
  state: MainOperationSeasonState,
): string[] {
  return Object.values(state.districtScopes)
    .filter((s) => s.status === 'active')
    .map((s) => s.districtId);
}

export function getAgendaMainOperationDistrictIds(
  state: MainOperationSeasonState,
): string[] {
  return Object.values(state.districtScopes)
    .filter((s) => s.status === 'agenda')
    .map((s) => s.districtId);
}

export function getPreviewMainOperationDistrictIds(
  state: MainOperationSeasonState,
): string[] {
  return Object.values(state.districtScopes)
    .filter((s) => s.status === 'preview')
    .map((s) => s.districtId);
}

export function updateMainOperationDistrictScopesForDay(
  state: MainOperationSeasonState,
  cityDay: number,
): MainOperationSeasonState {
  if (state.accessMode === 'none' || cityDay < MAIN_OPERATION_FIRST_CITY_DAY) {
    return state;
  }
  const seasonDay = getMainOperationSeasonDay(state, cityDay);
  const mode = state.accessMode === 'full' ? 'full' : 'limited';
  const nextScopes = buildDistrictScopesForAccess(seasonDay, mode, cityDay);
  const merged: Record<string, MainOperationDistrictScope> = {};
  for (const districtId of MAIN_OPERATION_DISTRICT_IDS) {
    const next = nextScopes[districtId]!;
    const prev = state.districtScopes[districtId];
    merged[districtId] = {
      ...next,
      pressureScore: prev
        ? clamp0to100((prev.pressureScore + next.pressureScore) / 2)
        : next.pressureScore,
      activatedDay:
        next.status === 'active'
          ? prev?.activatedDay ?? cityDay
          : prev?.activatedDay,
    };
  }
  return {
    ...state,
    currentSeasonDay: seasonDay,
    districtScopes: merged,
    lastRefreshedDay: cityDay,
  };
}

export function markMainOperationSeasonProcessed(
  state: MainOperationSeasonState,
  day: number,
): MainOperationSeasonState {
  return { ...state, lastProcessedDay: day };
}

export function refreshMainOperationSeasonForDay(
  state: MainOperationSeasonState,
  day: number,
  accessMode: MainOperationAccessMode,
): MainOperationSeasonState {
  let next = normalizeMainOperationSeasonState(state, day);
  next = { ...next, accessMode };

  if (day < MAIN_OPERATION_FIRST_CITY_DAY) {
    return {
      ...createInitialMainOperationSeasonState(),
      lastRefreshedDay: day,
    };
  }

  if (accessMode === 'full') {
    if (next.status !== 'active') {
      next = {
        ...createFullMainOperationSeasonState(
          next.startedAtDay ?? MAIN_OPERATION_FIRST_CITY_DAY,
        ),
        goals: next.goals,
        lastProcessedDay: next.lastProcessedDay,
      };
    }
    next = updateMainOperationDistrictScopesForDay(next, day);
    next.currentSeasonDay = getMainOperationSeasonDay(next, day);
    if (next.currentSeasonDay >= next.seasonLengthDays) {
      next = { ...next, status: 'completed' };
    }
    return { ...next, lastRefreshedDay: day };
  }

  if (accessMode === 'limited') {
    const preview = createLimitedMainOperationSeasonPreviewState(day);
    return {
      ...preview,
      goals: next.goals.map((g) => ({ ...g, progress: 0, status: 'active' })),
      lastProcessedDay: next.lastProcessedDay,
      lastRefreshedDay: day,
    };
  }

  return createInitialMainOperationSeasonState();
}
