import { isFullMainOperationAccess } from '@/core/monetization/monetizationEngine';
import type { MonetizationState } from '@/core/monetization/monetizationTypes';
import type { GameState } from '@/core/models/GameState';
import type { AssignmentsState } from '@/core/assignments/assignmentTypes';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import type { MapDistrictId } from '@/features/map/data/mapDistrictConstants';
import { mapDistrictFromPilot } from '@/features/map/data/mapDistrictMapping';
import { getMapDistrictLabel } from '@/features/map/utils/mapDistrictLabels';

import {
  MAIN_OPERATION_FIRST_CITY_DAY,
  MAIN_OPERATION_GOAL_DOMAINS_TRACKED,
  MAX_FULL_MAIN_OPERATION_EVENTS,
  MAX_FULL_MAIN_OPERATION_EVENTS_DAY8,
  MAX_LIGHT_MAIN_OPERATION_EVENTS,
  FULL_MAIN_ANCHOR_COUNT,
  FULL_MAIN_SIDE_COUNT,
} from './mainOperationConstants';
import {
  createFullMainOperationSeasonState,
  createInitialMainOperationSeasonState,
  createLimitedMainOperationSeasonPreviewState,
  deriveAccessModeFromMonetization,
  getActiveMainOperationDistrictIds,
  getAgendaMainOperationDistrictIds,
  getMainOperationSeasonDay,
  getPreviewMainOperationDistrictIds,
  markMainOperationSeasonProcessed,
  normalizeMainOperationSeasonState,
  refreshMainOperationSeasonForDay,
  updateMainOperationDistrictScopesForDay,
} from './mainOperationState';
import type {
  MainOperationAccessMode,
  MainOperationDailyContext,
  MainOperationEngineInput,
  MainOperationSeasonGoal,
  MainOperationSeasonState,
} from './mainOperationTypes';

function clampProgress(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function deriveMainOperationAccessMode(
  gameState: GameState,
  monetization: MonetizationState,
): MainOperationAccessMode {
  if (gameState.pilot.status !== 'completed') {
    return 'none';
  }
  if (gameState.city.day < MAIN_OPERATION_FIRST_CITY_DAY) {
    return 'none';
  }
  if (isFullMainOperationAccess(gameState, monetization)) {
    return 'full';
  }
  if (deriveAccessModeFromMonetization(monetization) === 'limited') {
    return 'limited';
  }
  return 'none';
}

export function ensureMainOperationSeasonForGameState(
  input: MainOperationEngineInput,
): MainOperationSeasonState {
  const accessMode = deriveMainOperationAccessMode(
    input.gameState,
    input.monetization,
  );
  const day = input.gameState.city.day;
  const normalized = normalizeMainOperationSeasonState(
    input.mainOperationSeason,
    day,
    input.monetization,
  );
  return refreshMainOperationSeasonForDay(normalized, day, accessMode);
}

export function shouldUseFullMainOperationEvents(
  gameState: GameState,
  monetization: MonetizationState,
): boolean {
  const postPilot = gameState.pilot.postPilotOperation;
  if (postPilot?.phase !== 'main_operation_full') {
    return false;
  }
  return deriveMainOperationAccessMode(gameState, monetization) === 'full';
}

export function shouldUseLimitedMainOperationEvents(
  gameState: GameState,
  monetization: MonetizationState,
): boolean {
  const postPilot = gameState.pilot.postPilotOperation;
  if (postPilot?.phase !== 'main_operation_light') {
    return false;
  }
  const mode = deriveMainOperationAccessMode(gameState, monetization);
  return mode === 'limited' || mode === 'none';
}

export function getMainOperationEventDensity(
  gameState: GameState,
  monetization: MonetizationState,
): { maxDailyEvents: number; anchor: number; side: number } {
  if (shouldUseFullMainOperationEvents(gameState, monetization)) {
    const day = gameState.city.day;
    const maxDailyEvents =
      day <= MAIN_OPERATION_FIRST_CITY_DAY
        ? MAX_FULL_MAIN_OPERATION_EVENTS_DAY8
        : MAX_FULL_MAIN_OPERATION_EVENTS;
    return {
      maxDailyEvents,
      anchor: FULL_MAIN_ANCHOR_COUNT,
      side: Math.min(FULL_MAIN_SIDE_COUNT, maxDailyEvents - FULL_MAIN_ANCHOR_COUNT),
    };
  }
  return {
    maxDailyEvents: MAX_LIGHT_MAIN_OPERATION_EVENTS,
    anchor: 1,
    side: 1,
  };
}

export function buildMainOperationDailyContext(
  input: MainOperationEngineInput,
): MainOperationDailyContext {
  const season = ensureMainOperationSeasonForGameState(input);
  const accessMode = season.accessMode;
  const density = getMainOperationEventDensity(
    input.gameState,
    input.monetization,
  );

  const goalProgressLines =
    accessMode === 'full' && season.status === 'active'
      ? season.goals
          .filter((g) => g.status === 'active')
          .slice(0, 3)
          .map((g) => `${g.title} %${g.progress}`)
      : [];

  return {
    accessMode,
    currentSeasonDay: season.currentSeasonDay,
    activeDistrictIds: getActiveMainOperationDistrictIds(season),
    agendaDistrictIds: getAgendaMainOperationDistrictIds(season),
    previewDistrictIds: getPreviewMainOperationDistrictIds(season),
    maxDailyEvents: density.maxDailyEvents,
    anchorEventCount: density.anchor,
    sideEventCount: density.side,
    goalProgressLines,
  };
}

export function calculateDistrictScopePressure(
  gameState: GameState,
  districtId: string,
  operationSignals?: OperationSignalsState,
): number {
  const base = operationSignals?.districts.score ?? 50;
  const focusId =
    operationSignals?.priorityDistrictId ??
    mapDistrictFromPilot(gameState.pilot.selectedDistrictId);
  const normalizedId = districtId as MapDistrictId;
  if (focusId === normalizedId) {
    return clampProgress(base + 8);
  }
  const hash = normalizedId.charCodeAt(0) % 12;
  return clampProgress(base - 6 + hash);
}

export function calculateMainOperationGoalProgress(
  input: MainOperationEngineInput,
  season: MainOperationSeasonState,
): MainOperationSeasonGoal[] {
  if (season.accessMode !== 'full' || season.status !== 'active') {
    return season.goals;
  }

  const signals = input.operationSignals;
  const assignments = input.assignments;
  const activeCount = getActiveMainOperationDistrictIds(season).length;

  return season.goals.map((goal) => {
    if (goal.status !== 'active') {
      return goal;
    }

    let delta = 0;
    switch (goal.domain) {
      case 'city_balance': {
        const overall = signals?.overall;
        if (!overall) {
          delta = 4;
          break;
        }
        if (overall.status === 'stable' || overall.status === 'watch') {
          delta = 8;
        } else if (overall.status === 'strained') {
          delta = 3;
        } else {
          delta = 1;
        }
        break;
      }
      case 'districts': {
        const pressures = Object.values(season.districtScopes)
          .filter((s) => s.status === 'active')
          .map((s) => s.pressureScore);
        const avgPressure =
          pressures.length > 0
            ? pressures.reduce((a, b) => a + b, 0) / pressures.length
            : 60;
        delta = Math.min(12, activeCount * 2 + Math.round((100 - avgPressure) / 15));
        break;
      }
      case 'vehicles': {
        const vehicles = signals?.vehicles;
        if (vehicles?.status === 'critical') {
          delta = 0;
        } else if (vehicles?.status === 'strained') {
          delta = 4;
        } else {
          delta = 8;
        }
        break;
      }
      case 'assignments': {
        const strong = assignments?.dailyAssignmentSummary?.strongFitCount ?? 0;
        const weak = assignments?.dailyAssignmentSummary?.weakFitCount ?? 0;
        delta = Math.min(12, strong * 4 - weak * 2);
        if (delta < 0) delta = 0;
        break;
      }
      default:
        delta = 0;
    }

    if (!MAIN_OPERATION_GOAL_DOMAINS_TRACKED.includes(goal.domain)) {
      delta = 0;
    }

    const progress = clampProgress(goal.progress + delta);
    const status =
      progress >= goal.target ? ('completed' as const) : goal.status;
    return {
      ...goal,
      progress: status === 'completed' ? 100 : progress,
      status,
    };
  });
}

export function updateMainOperationGoalProgress(
  input: MainOperationEngineInput,
  season: MainOperationSeasonState,
): MainOperationSeasonState {
  if (season.accessMode !== 'full' || season.status !== 'active') {
    return season;
  }
  const goals = calculateMainOperationGoalProgress(input, season);
  const scopes = { ...season.districtScopes };
  for (const districtId of Object.keys(scopes)) {
    const scope = scopes[districtId]!;
    scopes[districtId] = {
      ...scope,
      pressureScore: calculateDistrictScopePressure(
        input.gameState,
        districtId,
        input.operationSignals,
      ),
    };
  }
  return { ...season, goals, districtScopes: scopes };
}

export function processMainOperationEndOfDay(
  input: MainOperationEngineInput,
  closingDay: number,
): MainOperationSeasonState {
  let season = ensureMainOperationSeasonForGameState(input);

  if (closingDay < MAIN_OPERATION_FIRST_CITY_DAY) {
    return season;
  }
  if (input.gameState.pilot.status !== 'completed') {
    return season;
  }
  if (season.lastProcessedDay === closingDay) {
    return season;
  }

  if (season.accessMode === 'full' && season.status === 'active') {
    season = updateMainOperationGoalProgress(input, season);
  }

  const nextCityDay = closingDay + 1;
  season = updateMainOperationDistrictScopesForDay(season, nextCityDay);
  season = markMainOperationSeasonProcessed(season, closingDay);
  season.lastSummaryDay = closingDay;

  return season;
}

export function syncMainOperationSeasonAfterFullUnlock(
  gameState: GameState,
  monetization: MonetizationState,
  existing?: MainOperationSeasonState,
): MainOperationSeasonState {
  const day = Math.max(
    MAIN_OPERATION_FIRST_CITY_DAY,
    gameState.city.day,
  );
  if (day < MAIN_OPERATION_FIRST_CITY_DAY) {
    return createInitialMainOperationSeasonState();
  }
  const base = existing
    ? normalizeMainOperationSeasonState(existing, day, monetization)
    : createFullMainOperationSeasonState(day);
  return refreshMainOperationSeasonForDay(base, day, 'full');
}

export function syncMainOperationSeasonAfterLimitedContinue(
  day: number,
  existing?: MainOperationSeasonState,
): MainOperationSeasonState {
  const preview = createLimitedMainOperationSeasonPreviewState(day);
  if (!existing) {
    return preview;
  }
  return {
    ...preview,
    lastProcessedDay: existing.lastProcessedDay,
    goals: existing.goals.map((g) => ({ ...g, progress: 0, status: 'active' })),
  };
}

export function pickMainOperationEventDistrict(
  season: MainOperationSeasonState,
  kind: 'anchor' | 'side',
  day: number,
): MapDistrictId {
  const active = getActiveMainOperationDistrictIds(season) as MapDistrictId[];
  const agenda = getAgendaMainOperationDistrictIds(season) as MapDistrictId[];

  if (kind === 'anchor' && active.length > 0) {
    return active[day % active.length]!;
  }
  if (kind === 'side') {
    if (agenda.length > 0 && day % 2 === 0) {
      return agenda[day % agenda.length]!;
    }
    if (active.length > 0) {
      return active[(day + 1) % active.length]!;
    }
  }
  return active[0] ?? 'merkez';
}

export function buildMainOperationEngineInput(
  params: MainOperationEngineInput,
): MainOperationEngineInput {
  return params;
}

export function buildMainOperationEventScope(
  districtId: MapDistrictId,
): {
  mapDistrictId: MapDistrictId;
  neighborhoodId: string;
  districtLabel: string;
} {
  return {
    mapDistrictId: districtId,
    neighborhoodId: districtId,
    districtLabel: getMapDistrictLabel(districtId),
  };
}
