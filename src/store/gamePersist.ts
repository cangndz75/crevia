import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

import { createDefaultPilotState } from '@/core/game/createDefaultPilotState';
import { INITIAL_DAILY_GOAL_RUNTIME } from '@/core/dailyGoals/dailyGoalIntegration';
import { createDailyGoalsForDay } from '@/core/dailyGoals/dailyGoalIntegration';
import type { DailyGoal, DailyGoalState } from '@/core/dailyGoals/dailyGoalTypes';
import {
  createEconomyStateFromLegacyBudget,
  createInitialEconomyState,
} from '@/core/economy/economyEngine';
import type { EconomyState } from '@/core/economy/types';
import { ensureTeamCompetencies } from '@/core/personnel/personnelCompetency';
import { normalizePersistedContainerState } from '@/core/containers/containerSeed';
import type { ContainerState } from '@/core/containers/containerTypes';
import { normalizePersistedSocialPulseState } from '@/core/social/socialSeed';
import type { SocialPulseState } from '@/core/social/socialTypes';
import { normalizePersistedVehicleState } from '@/core/vehicles/vehicleSeed';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';
import { createInitialPersonnelState } from '@/core/personnel/personnelSeed';
import type { PersonnelState, PersonnelTeam } from '@/core/personnel/personnelTypes';
import { createInitialPlayerProgress } from '@/core/xp/levelProgress';
import type { PlayerProgress } from '@/core/xp/types';
import type { GameState } from '@/core/models/GameState';
import type { PilotGameState } from '@/core/models/PilotGameState';

import {
  INITIAL_TUTORIAL_STATE,
  type TutorialState,
} from '@/features/tutorial/tutorialTypes';

import type { LeaderboardEntry } from '@/core/leaderboard/leaderboardTypes';
import { createNotSelectedPriorityState } from '@/core/dailyPriority/dailyPriorityEngine';
import type { DailyPriorityState } from '@/core/dailyPriority/dailyPriorityTypes';

import type { GameStore } from './useGameStore';

// ---------------------------------------------------------------------------
// Save version & storage key
// ---------------------------------------------------------------------------

export const SAVE_VERSION = 8;
const SAVE_VERSION_7 = 7;
const SAVE_VERSION_6 = 6;
const SAVE_VERSION_5 = 5;
/** Anahtar değişmedi — v1 kayıtları aynı AsyncStorage girişinden okunur. */
export const GAME_STORAGE_KEY = 'crevia-game-state-v1';

const LEGACY_SAVE_VERSION = 1;
const SAVE_VERSION_2 = 2;
const SAVE_VERSION_3 = 3;
const SAVE_VERSION_4 = 4;

// ---------------------------------------------------------------------------
// Persisted shape — only serialisable data, no actions / derived
// ---------------------------------------------------------------------------

export type PersistedGameState = Pick<
  GameStore,
  | 'gameState'
  | 'neighborhoods'
  | 'resources'
  | 'eventPool'
  | 'decisionHistory'
  | 'snapshots'
  | 'lastDailyReport'
  | 'lastClosedDay'
  | 'playerProgress'
  | 'dailyGoalState'
  | 'dailyGoalsByDay'
  | 'dailyPriorityState'
  | 'dailyPriorityByDay'
  | 'dailyGoalRuntime'
  | 'economyState'
  | 'personnelState'
  | 'containerState'
  | 'vehicleState'
  | 'socialPulseState'
  | 'tutorialState'
  | 'bestPilotScores'
  | 'lastPilotScore'
> & {
  saveVersion: number;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Partialise — select which fields to persist
// ---------------------------------------------------------------------------

export function partialiseGameState(
  state: GameStore,
): PersistedGameState {
  return {
    gameState: state.gameState,
    neighborhoods: state.neighborhoods,
    resources: state.resources,
    eventPool: state.eventPool,
    decisionHistory: state.decisionHistory,
    snapshots: state.snapshots.slice(-100),
    lastDailyReport: state.lastDailyReport,
    lastClosedDay: state.lastClosedDay,
    playerProgress: state.playerProgress,
    dailyGoalState: state.dailyGoalState,
    dailyGoalsByDay: state.dailyGoalsByDay,
    dailyPriorityState: state.dailyPriorityState,
    dailyPriorityByDay: state.dailyPriorityByDay,
    dailyGoalRuntime: state.dailyGoalRuntime,
    economyState: state.economyState,
    personnelState: state.personnelState,
    containerState: state.containerState,
    vehicleState: state.vehicleState,
    socialPulseState: state.socialPulseState,
    tutorialState: state.tutorialState,
    bestPilotScores: state.bestPilotScores,
    lastPilotScore: state.lastPilotScore,
    saveVersion: SAVE_VERSION,
    updatedAt: new Date().toISOString(),
  };
}

function isValidLeaderboardEntry(val: unknown): val is LeaderboardEntry {
  if (!isRecord(val)) return false;
  if (typeof val.id !== 'string') return false;
  if (typeof val.playerName !== 'string') return false;
  if (typeof val.neighborhoodId !== 'string') return false;
  if (typeof val.score !== 'number') return false;
  if (typeof val.baseScore !== 'number') return false;
  if (!isRecord(val.breakdown)) return false;
  return true;
}

function normalizeLeaderboardEntries(raw: unknown): LeaderboardEntry[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(isValidLeaderboardEntry);
}

function normalizeLastPilotScore(raw: unknown): LeaderboardEntry | undefined {
  if (raw == null) {
    return undefined;
  }
  return isValidLeaderboardEntry(raw) ? raw : undefined;
}

function isValidTutorialState(val: unknown): val is TutorialState {
  if (!isRecord(val)) return false;
  if (typeof val.day1Completed !== 'boolean') return false;
  if (val.activeStepId != null && typeof val.activeStepId !== 'string') {
    return false;
  }
  if (!Array.isArray(val.completedStepIds)) return false;
  if (typeof val.skipped !== 'boolean') return false;
  return true;
}

// ---------------------------------------------------------------------------
// Validation & migration
// ---------------------------------------------------------------------------

function isRecord(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

function isPilotStatus(val: unknown): val is PilotGameState['status'] {
  return (
    val === 'not_started' || val === 'active' || val === 'completed'
  );
}

function isValidPilotState(val: unknown): val is PilotGameState {
  if (!isRecord(val)) return false;
  if (typeof val.currentPilotDay !== 'number') return false;
  if (!isPilotStatus(val.status)) return false;
  if (!Array.isArray(val.completedEventIds)) return false;
  if (!Array.isArray(val.pendingConsequences)) return false;
  if (!isRecord(val.flags)) return false;
  return true;
}

function ensurePilotOnGameState(gameState: GameState): GameState {
  if (!isValidPilotState(gameState.pilot)) {
    return {
      ...gameState,
      pilot: createDefaultPilotState(),
    };
  }
  if (gameState.pilot.run === undefined) {
    return {
      ...gameState,
      pilot: { ...gameState.pilot, run: null },
    };
  }
  return gameState;
}

function isValidDailyGoal(val: unknown): val is DailyGoal {
  if (!isRecord(val)) return false;
  if (typeof val.id !== 'string') return false;
  if (typeof val.day !== 'number') return false;
  if (typeof val.title !== 'string') return false;
  if (typeof val.shortLabel !== 'string') return false;
  if (typeof val.progressPercent !== 'number') return false;
  if (typeof val.isCompleted !== 'boolean') return false;
  if (typeof val.isFailed !== 'boolean') return false;
  return true;
}

function isValidDailyGoalState(val: unknown): val is DailyGoalState {
  if (!isRecord(val)) return false;
  if (typeof val.day !== 'number') return false;
  if (!Array.isArray(val.goals)) return false;
  if (typeof val.lastEvaluatedAt !== 'number') return false;
  return val.goals.every(isValidDailyGoal);
}

function isValidDailyPriorityState(val: unknown): val is DailyPriorityState {
  if (!isRecord(val)) return false;
  if (typeof val.day !== 'number') return false;
  if (typeof val.status !== 'string') return false;
  if (typeof val.score !== 'number') return false;
  if (typeof val.progressPercent !== 'number') return false;
  if (!Array.isArray(val.impactLog)) return false;
  return true;
}

function normalizeDailyPriorityByDay(
  raw: unknown,
): Record<number, DailyPriorityState> {
  if (!isRecord(raw)) {
    return {};
  }
  const result: Record<number, DailyPriorityState> = {};
  for (const [key, value] of Object.entries(raw)) {
    const day = Number(key);
    if (!Number.isFinite(day) || !isValidDailyPriorityState(value)) {
      continue;
    }
    result[day] = value;
  }
  return result;
}

function normalizeDailyGoalsByDay(
  raw: unknown,
): Record<number, DailyGoalState> {
  if (!isRecord(raw)) {
    return {};
  }
  const result: Record<number, DailyGoalState> = {};
  for (const [key, value] of Object.entries(raw)) {
    const day = Number(key);
    if (!Number.isFinite(day) || !isValidDailyGoalState(value)) {
      continue;
    }
    result[day] = value;
  }
  return result;
}

function isValidPersonnelState(val: unknown): val is PersonnelState {
  if (!isRecord(val)) return false;
  if (!Array.isArray(val.teams)) return false;
  if (!Array.isArray(val.dayAssignments)) return false;
  if (typeof val.lastProcessedDay !== 'number') return false;
  return val.teams.every(
    (t) =>
      isRecord(t) &&
      typeof t.id === 'string' &&
      typeof t.fatigue === 'number' &&
      typeof t.morale === 'number',
  );
}

function isValidEconomyState(val: unknown): val is EconomyState {
  if (!isRecord(val)) return false;
  if (typeof val.currentSource !== 'number') return false;
  if (typeof val.startingSource !== 'number') return false;
  if (typeof val.totalEarned !== 'number') return false;
  if (typeof val.totalSpent !== 'number') return false;
  if (!Array.isArray(val.transactions)) return false;
  return true;
}

function resolveEconomyState(
  raw: Record<string, unknown>,
  gameState: GameState,
): EconomyState {
  if (isValidEconomyState(raw.economyState)) {
    return raw.economyState;
  }
  return createEconomyStateFromLegacyBudget(gameState.city.budget);
}

function isValidPlayerProgress(val: unknown): val is PlayerProgress {
  if (!isRecord(val)) return false;
  if (typeof val.totalXp !== 'number') return false;
  if (typeof val.currentLevel !== 'number') return false;
  if (!Array.isArray(val.xpHistory)) return false;
  if (!Array.isArray(val.unlockedAuthorities)) return false;
  return true;
}

function validatePersistedCore(raw: Record<string, unknown>): boolean {
  const gs = raw.gameState;
  if (!isRecord(gs)) return false;

  const city = gs.city;
  if (!isRecord(city)) return false;
  if (typeof city.day !== 'number') return false;

  const player = gs.player;
  if (!isRecord(player)) return false;
  if (typeof player.xp !== 'number') return false;
  if (typeof player.level !== 'number') return false;

  if (!Array.isArray(gs.events)) return false;
  if (!Array.isArray(raw.decisionHistory)) return false;

  return true;
}

/**
 * v1 kayıtları pilot alanı olmadan gelebilir; v2/v3 migration ile yükseltir.
 * Geçersiz kayıtlar için null döner.
 */
export function normalizePersistedSave(
  raw: unknown,
): PersistedGameState | null {
  if (!isRecord(raw)) return null;

  const version = raw.saveVersion;
  if (
    version !== LEGACY_SAVE_VERSION &&
    version !== SAVE_VERSION_2 &&
    version !== SAVE_VERSION_3 &&
    version !== SAVE_VERSION_4 &&
    version !== SAVE_VERSION_5 &&
    version !== SAVE_VERSION_6 &&
    version !== SAVE_VERSION_7 &&
    version !== SAVE_VERSION
  ) {
    return null;
  }

  if (!validatePersistedCore(raw)) return null;

  const gameState = ensurePilotOnGameState(
    raw.gameState as GameState,
  );
  const economyState = resolveEconomyState(raw, gameState);
  const rawPersonnel = isValidPersonnelState(raw.personnelState)
    ? raw.personnelState
    : createInitialPersonnelState();
  const currentDay = gameState.city.day;
  const containerState: ContainerState = normalizePersistedContainerState(
    raw.containerState,
    currentDay,
  );
  const vehicleState: VehicleState = normalizePersistedVehicleState(
    raw.vehicleState,
    currentDay,
  );
  const socialPulseState: SocialPulseState = normalizePersistedSocialPulseState(
    raw.socialPulseState,
    currentDay,
  );

  const personnelState: PersonnelState = {
    ...rawPersonnel,
    motivationUsedByTeamId: isRecord(rawPersonnel.motivationUsedByTeamId)
      ? (rawPersonnel.motivationUsedByTeamId as Record<string, number>)
      : {},
    equipmentSupportUsedDay:
      typeof rawPersonnel.equipmentSupportUsedDay === 'number'
        ? rawPersonnel.equipmentSupportUsedDay
        : null,
    teams: rawPersonnel.teams.map((team) =>
      ensureTeamCompetencies({
        ...team,
        restMode:
          team.restMode === 'light_duty' || team.restMode === 'full_rest'
            ? team.restMode
            : null,
      } as PersonnelTeam),
    ),
    dayIncidents: Array.isArray(rawPersonnel.dayIncidents)
      ? rawPersonnel.dayIncidents
      : [],
  };

  return {
    gameState: {
      ...gameState,
      city: { ...gameState.city, budget: economyState.currentSource },
    },
    economyState,
    personnelState,
    containerState,
    vehicleState,
    socialPulseState,
    neighborhoods: raw.neighborhoods as PersistedGameState['neighborhoods'],
    resources: raw.resources as PersistedGameState['resources'],
    eventPool: raw.eventPool as PersistedGameState['eventPool'],
    decisionHistory:
      raw.decisionHistory as PersistedGameState['decisionHistory'],
    snapshots: (raw.snapshots ?? []) as PersistedGameState['snapshots'],
    lastDailyReport:
      (raw.lastDailyReport as PersistedGameState['lastDailyReport']) ??
      null,
    lastClosedDay:
      (raw.lastClosedDay as PersistedGameState['lastClosedDay']) ?? null,
    playerProgress: isValidPlayerProgress(raw.playerProgress)
      ? raw.playerProgress
      : createInitialPlayerProgress(),
    dailyGoalState: (() => {
      const day = gameState.city.day;
      const seed = {
        day,
        gameState,
        neighborhoods: raw.neighborhoods as PersistedGameState['neighborhoods'],
        containerState,
        vehicleState,
        personnelState,
        socialPulseState,
        isDay1Tutorial: day === 1,
      };
      if (isValidDailyGoalState(raw.dailyGoalState)) {
        return raw.dailyGoalState;
      }
      if (isValidDailyGoal(raw.currentDailyGoal)) {
        return {
          day: raw.currentDailyGoal.day,
          goals: [raw.currentDailyGoal],
          lastEvaluatedAt: Date.now(),
        };
      }
      return createDailyGoalsForDay(seed);
    })(),
    dailyGoalsByDay: normalizeDailyGoalsByDay(raw.dailyGoalsByDay),
    dailyPriorityState: (() => {
      const day = gameState.city.day;
      if (isValidDailyPriorityState(raw.dailyPriorityState)) {
        return raw.dailyPriorityState;
      }
      const byDay = normalizeDailyPriorityByDay(raw.dailyPriorityByDay);
      if (byDay[day]) {
        return byDay[day]!;
      }
      return createNotSelectedPriorityState(day);
    })(),
    dailyPriorityByDay: normalizeDailyPriorityByDay(raw.dailyPriorityByDay),
    dailyGoalRuntime: isRecord(raw.dailyGoalRuntime)
      ? {
          staffFatiguePeak:
            typeof raw.dailyGoalRuntime.staffFatiguePeak === 'number'
              ? raw.dailyGoalRuntime.staffFatiguePeak
              : 0,
          budgetExceededToday:
            typeof raw.dailyGoalRuntime.budgetExceededToday === 'boolean'
              ? raw.dailyGoalRuntime.budgetExceededToday
              : false,
          primaryCompletedHint:
            typeof raw.dailyGoalRuntime.primaryCompletedHint === 'boolean'
              ? raw.dailyGoalRuntime.primaryCompletedHint
              : false,
        }
      : { ...INITIAL_DAILY_GOAL_RUNTIME },
    tutorialState: isValidTutorialState(raw.tutorialState)
      ? raw.tutorialState
      : { ...INITIAL_TUTORIAL_STATE },
    bestPilotScores: normalizeLeaderboardEntries(raw.bestPilotScores),
    lastPilotScore: normalizeLastPilotScore(raw.lastPilotScore),
    saveVersion: SAVE_VERSION,
    updatedAt:
      typeof raw.updatedAt === 'string'
        ? raw.updatedAt
        : new Date().toISOString(),
  };
}

export function isValidSave(raw: unknown): raw is PersistedGameState {
  const normalized = normalizePersistedSave(raw);
  if (!normalized) return false;
  return normalized.saveVersion === SAVE_VERSION;
}

// ---------------------------------------------------------------------------
// Snapshot limit — cap to last N entries
// ---------------------------------------------------------------------------

export const MAX_SNAPSHOTS = 100;

export function limitSnapshots<T>(snapshots: T[]): T[] {
  if (snapshots.length <= MAX_SNAPSHOTS) return snapshots;
  return snapshots.slice(-MAX_SNAPSHOTS);
}

// ---------------------------------------------------------------------------
// Zustand storage adapter (AsyncStorage → createJSONStorage)
// ---------------------------------------------------------------------------

const asyncStorageAdapter: StateStorage = {
  getItem: (name: string) => AsyncStorage.getItem(name),
  setItem: (name: string, value: string) => AsyncStorage.setItem(name, value),
  removeItem: (name: string) => AsyncStorage.removeItem(name),
};

export const gameJsonStorage = createJSONStorage<GameStore>(
  () => asyncStorageAdapter,
);

// ---------------------------------------------------------------------------
// Manual helpers (dev / debug)
// ---------------------------------------------------------------------------

export async function clearPersistedGame(): Promise<void> {
  await AsyncStorage.removeItem(GAME_STORAGE_KEY);
}

export async function exportGameSave(): Promise<string> {
  const raw = await AsyncStorage.getItem(GAME_STORAGE_KEY);
  return raw ?? '{}';
}

// TODO: İleride kayıtlı save varsa offline devam opsiyonu eklenebilir.
