import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

import type { GameStore } from './useGameStore';

// ---------------------------------------------------------------------------
// Save version & storage key
// ---------------------------------------------------------------------------

export const SAVE_VERSION = 1;
export const GAME_STORAGE_KEY = 'crevia-game-state-v1';

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
    saveVersion: SAVE_VERSION,
    updatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Validation — reject corrupt saves gracefully
// ---------------------------------------------------------------------------

function isRecord(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

export function isValidSave(raw: unknown): raw is PersistedGameState {
  if (!isRecord(raw)) return false;
  if ((raw as { saveVersion?: unknown }).saveVersion !== SAVE_VERSION) return false;

  const gs = raw.gameState;
  if (!isRecord(gs)) return false;

  const city = (gs as Record<string, unknown>).city;
  if (!isRecord(city)) return false;
  if (typeof city.day !== 'number') return false;

  const player = (gs as Record<string, unknown>).player;
  if (!isRecord(player)) return false;
  if (typeof player.xp !== 'number') return false;
  if (typeof player.level !== 'number') return false;

  if (!Array.isArray((gs as Record<string, unknown>).events)) return false;
  if (!Array.isArray(raw.decisionHistory)) return false;

  return true;
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
