import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

import { createDefaultPilotState } from '@/core/game/createDefaultPilotState';
import { INITIAL_DAILY_GOAL_RUNTIME } from '@/core/dailyGoals/dailyGoalIntegration';
import { createDailyGoalForDay } from '@/core/dailyGoals/dailyGoalEngine';
import type { DailyGoal } from '@/core/dailyGoals/types';
import {
  createEconomyStateFromLegacyBudget,
  createInitialEconomyState,
} from '@/core/economy/economyEngine';
import type { EconomyState } from '@/core/economy/types';
import { createInitialPersonnelState } from '@/core/personnel/personnelSeed';
import type { PersonnelState } from '@/core/personnel/personnelTypes';
import { createInitialPlayerProgress } from '@/core/xp/levelProgress';
import type { PlayerProgress } from '@/core/xp/types';
import type { GameState } from '@/core/models/GameState';
import type { PilotGameState } from '@/core/models/PilotGameState';

import type { GameStore } from './useGameStore';

// ---------------------------------------------------------------------------
// Save version & storage key
// ---------------------------------------------------------------------------

export const SAVE_VERSION = 2;
/** Anahtar değişmedi — v1 kayıtları aynı AsyncStorage girişinden okunur. */
export const GAME_STORAGE_KEY = 'crevia-game-state-v1';

const LEGACY_SAVE_VERSION = 1;

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
  | 'currentDailyGoal'
  | 'dailyGoalsByDay'
  | 'dailyGoalRuntime'
  | 'economyState'
  | 'personnelState'
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
    currentDailyGoal: state.currentDailyGoal,
    dailyGoalsByDay: state.dailyGoalsByDay,
    dailyGoalRuntime: state.dailyGoalRuntime,
    economyState: state.economyState,
    personnelState: state.personnelState,
    saveVersion: SAVE_VERSION,
    updatedAt: new Date().toISOString(),
  };
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
  if (typeof val.type !== 'string') return false;
  if (typeof val.title !== 'string') return false;
  if (typeof val.target !== 'number') return false;
  if (typeof val.progress !== 'number') return false;
  if (typeof val.completed !== 'boolean') return false;
  if (typeof val.xpReward !== 'number') return false;
  if (typeof val.xpClaimed !== 'boolean') return false;
  return true;
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
 * v1 kayıtları pilot alanı olmadan gelebilir; v2'ye yükseltir.
 * Geçersiz kayıtlar için null döner.
 */
export function normalizePersistedSave(
  raw: unknown,
): PersistedGameState | null {
  if (!isRecord(raw)) return null;

  const version = raw.saveVersion;
  if (version !== LEGACY_SAVE_VERSION && version !== SAVE_VERSION) {
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
  const personnelState: PersonnelState = {
    ...rawPersonnel,
    motivationUsedByTeamId: isRecord(rawPersonnel.motivationUsedByTeamId)
      ? (rawPersonnel.motivationUsedByTeamId as Record<string, number>)
      : {},
    equipmentSupportUsedDay:
      typeof rawPersonnel.equipmentSupportUsedDay === 'number'
        ? rawPersonnel.equipmentSupportUsedDay
        : null,
    teams: rawPersonnel.teams.map((team) => ({
      ...team,
      restMode:
        team.restMode === 'light_duty' || team.restMode === 'full_rest'
          ? team.restMode
          : null,
    })),
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
    currentDailyGoal: isValidDailyGoal(raw.currentDailyGoal)
      ? raw.currentDailyGoal
      : createDailyGoalForDay(gameState.city.day),
    dailyGoalsByDay: isRecord(raw.dailyGoalsByDay)
      ? (raw.dailyGoalsByDay as Record<number, DailyGoal>)
      : {},
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
        }
      : { ...INITIAL_DAILY_GOAL_RUNTIME },
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
