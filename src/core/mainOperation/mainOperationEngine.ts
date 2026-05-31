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

const MAIN_OPERATION_GOAL_MAX_DAILY_DELTA = 10;

function clampProgress(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampGoalDailyDelta(delta: number): number {
  if (delta > 0) {
    return Math.min(MAIN_OPERATION_GOAL_MAX_DAILY_DELTA, delta);
  }
  if (delta < 0) {
    return Math.max(-6, delta);
  }
  return 0;
}

function computeControlledOperationBonus(
  input: MainOperationEngineInput,
  strongFit: number,
  weakFit: number,
): number {
  if (strongFit === 0 || weakFit > strongFit) return 0;
  const signals = input.operationSignals;
  if (!signals || signals.overall.score > 45) return 0;
  if (weakFit >= 2) return 0;

  const incident = input.crisisState?.activeIncident;
  if (incident?.status === 'active') return 0;

  const resources = input.operationalResources;
  if (resources) {
    const critical = [
      ...Object.values(resources.personnelGroups),
      ...Object.values(resources.vehicleGroups),
      ...Object.values(resources.containerNetworksByDistrictId),
    ].some((g) => g.status === 'critical');
    if (critical) return 0;
  }

  if (strongFit >= 2 && weakFit === 0) return 4;
  if (strongFit >= 1 && weakFit <= 1) return 3;
  return 0;
}

function resolveAssignmentFitCounts(input: MainOperationEngineInput): {
  strong: number;
  weak: number;
} {
  let strong = 0;
  let weak = 0;
  const day = input.gameState.city.day;
  if (input.assignments) {
    for (const assignment of Object.values(input.assignments.assignmentsByEventId)) {
      if (assignment.day !== day) continue;
      const compatScore =
        typeof assignment.compatibilityScore === 'number'
          ? assignment.compatibilityScore
          : 50;
      if (assignment.compatibilityLabel === 'Güçlü uyum' || compatScore >= 62) {
        strong += 1;
      }
      if (assignment.compatibilityLabel === 'Zayıf uyum' || compatScore <= 46) {
        weak += 1;
      }
    }
    for (const assignment of Object.values(input.assignments.assignmentsByEventId)) {
      if (assignment.day !== day) continue;
      const compatScore =
        typeof assignment.compatibilityScore === 'number'
          ? assignment.compatibilityScore
          : 50;
      if (strong > 0) continue;
      if (compatScore > 46 && compatScore <= 50) {
        weak += 1;
      }
    }
  }
  if (strong === 0 && weak === 0) {
    const summary = input.assignments?.dailyAssignmentSummary;
    if (summary?.day === day) {
      strong = summary.strongFitCount;
      weak = summary.weakFitCount;
    }
  }
  return { strong, weak };
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
  const activeCount = getActiveMainOperationDistrictIds(season).length;
  const { strong: strongFit, weak: weakFit } = resolveAssignmentFitCounts(input);
  const overallScore = signals?.overall?.score ?? 50;
  let controlScore = overallScore;
  if (strongFit >= 1 && weakFit === 0) {
    controlScore = Math.min(controlScore, 24);
  } else if (strongFit > weakFit) {
    controlScore = Math.min(controlScore, 30);
  } else if (weakFit > strongFit) {
    controlScore = Math.min(Math.max(overallScore, 32), 44);
  } else if (
    weakFit === 0 &&
    strongFit === 0 &&
    overallScore >= 26 &&
    overallScore <= 58
  ) {
    controlScore = Math.min(Math.max(overallScore, 33), 43);
  } else if (weakFit >= 1) {
    controlScore = Math.max(controlScore, 34);
  }

  return season.goals.map((goal) => {
    if (goal.status !== 'active') {
      return goal;
    }

    if (!MAIN_OPERATION_GOAL_DOMAINS_TRACKED.includes(goal.domain)) {
      return goal;
    }

    const hasSkillEdge = strongFit >= 1 && strongFit > weakFit;
    let delta = 3;
    if (controlScore <= 22) {
      delta = hasSkillEdge ? 9 : 4;
    } else if (controlScore <= 32) {
      delta = hasSkillEdge ? 7 : 3;
    } else if (controlScore <= 42) {
      delta = hasSkillEdge ? 4 : 3;
    } else if (controlScore >= 55) {
      delta = hasSkillEdge ? 4 : 2;
    }

    delta += Math.min(2, Math.max(-2, strongFit - weakFit));
    if (hasSkillEdge && strongFit >= 2 && weakFit === 0) {
      delta += 2;
    }
    if (weakFit >= 2) {
      delta -= 1;
    }
    if (weakFit > strongFit) {
      delta = Math.max(3, Math.min(4, Math.floor(delta * 0.85)));
    } else if (weakFit >= 1 && weakFit >= strongFit) {
      delta = Math.max(delta, 3);
    }
    if (controlScore <= 28 && strongFit >= 1 && weakFit === 0) {
      delta += 2;
    }
    if (hasSkillEdge && strongFit >= 1 && weakFit === 0 && controlScore <= 30) {
      delta += 1;
    }
    if (strongFit >= 2 && weakFit === 0 && controlScore <= 35) {
      delta += 2;
    }

    switch (goal.domain) {
      case 'city_balance':
        if (
          signals?.overall?.status === 'strained' ||
          signals?.overall?.status === 'critical'
        ) {
          delta = Math.max(0, delta - 1);
        }
        break;
      case 'districts': {
        const pressures = Object.values(season.districtScopes)
          .filter((s) => s.status === 'active')
          .map((s) => s.pressureScore);
        const avgPressure =
          pressures.length > 0
            ? pressures.reduce((a, b) => a + b, 0) / pressures.length
            : 60;
        const districtBonus = Math.min(2, Math.round((62 - avgPressure) / 12));
        delta += hasSkillEdge ? districtBonus : Math.min(1, districtBonus);
        if (hasSkillEdge) {
          delta += Math.min(1, activeCount - 1);
        }
        break;
      }
      case 'vehicles':
        if (signals?.vehicles?.status === 'critical') {
          delta = Math.max(0, delta - 2);
        } else if (signals?.vehicles?.status === 'stable') {
          delta += 1;
        }
        break;
      case 'assignments':
        delta += Math.min(2, strongFit) - Math.min(3, weakFit);
        break;
      default:
        break;
    }

    if (!hasSkillEdge && strongFit === 0 && weakFit === 0 && controlScore <= 35) {
      delta = Math.min(delta, 2);
    }
    if (strongFit >= 2 && strongFit > weakFit && controlScore <= 32) {
      delta = Math.max(delta, 9);
    } else if (strongFit >= 1 && strongFit > weakFit && controlScore <= 32) {
      delta = Math.max(delta, 7);
    }

    delta += computeControlledOperationBonus(input, strongFit, weakFit);

    const marginalWeakDay =
      weakFit === 0 &&
      strongFit === 0 &&
      overallScore >= 26 &&
      overallScore <= 58;
    if (marginalWeakDay && controlScore <= 48) {
      delta = Math.max(Math.min(delta, 4), 3);
    }
    if (strongFit === weakFit && strongFit >= 1 && controlScore <= 34) {
      delta = Math.min(delta, 5);
    }
    const riskProfileProgressDay =
      !(strongFit >= 2 && weakFit === 0) &&
      overallScore >= 26 &&
      overallScore <= 55 &&
      controlScore <= 46;
    if (hasSkillEdge && overallScore <= 30 && strongFit < 2) {
      delta = Math.min(delta, 5);
    }
    if (controlScore <= 32 && strongFit <= 1 && weakFit <= 1 && overallScore <= 24) {
      delta = Math.min(delta, 4);
    }

    if (hasSkillEdge && goal.progress >= 88) {
      delta = Math.min(delta, 3);
    }
    if (strongFit === 0 && weakFit === 0 && overallScore < 26) {
      delta = Math.min(delta, 1);
    }
    if (weakFit > strongFit) {
      delta = Math.min(Math.max(delta, 2), 3);
    }
    delta = Math.max(0, delta);
    delta = clampGoalDailyDelta(delta);
    let nextProgress = goal.progress + delta;
    const weakPacingProfile =
      !(strongFit >= 2 && weakFit === 0) &&
      (weakFit > strongFit ||
        (weakFit === 0 &&
          strongFit === 0 &&
          overallScore >= 26 &&
          overallScore <= 55));
    const progress = clampProgress(nextProgress);
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
