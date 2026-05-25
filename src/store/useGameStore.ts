import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { createDay1Seed } from '@/core/content/day1Seed';
import { applyDecision as runApplyDecision } from '@/core/game/applyDecision';
import { endDay, type EndDayState } from '@/core/game/endDay';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { DailyReport } from '@/core/models/DailyReport';
import type { DaySnapshot } from '@/core/models/DaySnapshot';
import type { GameMetrics } from '@/core/models/GameMetrics';
import type { GameState } from '@/core/models/GameState';
import type { EventCard } from '@/core/models/EventCard';
import type { GameResources } from '@/core/models/GameResources';
import type { Neighborhood } from '@/core/models/Neighborhood';
import type { CityPulseMetric } from '@/core/models/CityPulseMetric';
import type { CityState } from '@/core/models/CityState';
import { colors } from '@/ui/theme/colors';

import {
  clearPersistedGame,
  GAME_STORAGE_KEY,
  gameJsonStorage,
  isValidSave,
  limitSnapshots,
  partialiseGameState,
  type PersistedGameState,
} from './gamePersist';

// ---------------------------------------------------------------------------
// State & action types
// ---------------------------------------------------------------------------

type GameStoreState = {
  gameState: GameState;
  neighborhoods: Neighborhood[];
  resources: GameResources;
  eventPool: EventCard[];
  decisionHistory: DecisionRecord[];
  snapshots: DaySnapshot[];
  lastDailyReport: DailyReport | null;
  /** Son başarıyla kapatılan gün — aynı günde tekrar endDay engeli */
  lastClosedDay: number | null;
  /** AsyncStorage'dan hydration tamamlandı mı? */
  _hasHydrated: boolean;
};

type GameStoreActions = {
  initializeDay1: () => void;
  applyDecision: (eventId: string, decisionId: string) => void;
  endCurrentDay: () => void;
  resetGame: () => void;
  clearSaveAndReset: () => Promise<void>;
  _setHasHydrated: (v: boolean) => void;
};

export type GameStore = GameStoreState & GameStoreActions;

// ---------------------------------------------------------------------------
// City pulse builder (derived — persist edilmez, rehydrate sonrası yeniden
// hesaplanır)
// ---------------------------------------------------------------------------

function buildCityPulse(city: CityState): CityPulseMetric[] {
  return [
    {
      id: 'satisfaction',
      label: 'Halk Memnuniyeti',
      value: `${city.publicSatisfaction}%`,
      progress: city.publicSatisfaction / 100,
      color: colors.success,
      mutedColor: colors.successMuted,
      icon: 'happy',
      trendLabel: 'Memnuniyet',
      trendValue: `Gün ${city.day}`,
      trendTone: 'info',
      variant: 'ring',
    },
    {
      id: 'budget',
      label: 'Bütçe Durumu',
      value: `₺${city.budget.toLocaleString('tr-TR')}`,
      progress: Math.min(1, city.budget / 100_000),
      color: colors.secondary,
      mutedColor: colors.secondaryMuted,
      icon: 'cash',
      trendLabel: 'Bütçe',
      trendValue: `Gün ${city.day}`,
      trendTone: 'info',
      variant: 'icon',
    },
    {
      id: 'morale',
      label: 'Personel Morali',
      value: `${city.morale}%`,
      progress: city.morale / 100,
      color: colors.purple,
      mutedColor: colors.purpleMuted,
      icon: 'people',
      trendLabel: 'Moral',
      trendValue: `Gün ${city.day}`,
      trendTone: 'info',
      variant: 'icon',
    },
    {
      id: 'risk',
      label: 'Risk Skoru',
      value: `${city.riskScore}/${city.maxRiskScore}`,
      progress: city.riskScore / city.maxRiskScore,
      color: colors.warning,
      mutedColor: colors.warningMuted,
      icon: 'alert',
      trendLabel: 'Risk',
      trendValue: 'Canlı',
      trendTone: 'warning',
      variant: 'icon',
    },
  ];
}

function withSyncedPulse(gameState: GameState): GameState {
  return {
    ...gameState,
    cityPulse: buildCityPulse(gameState.city),
  };
}

function toEngineState(state: GameStoreState): EndDayState {
  return {
    ...state.gameState,
    neighborhoods: state.neighborhoods,
    resources: state.resources,
    eventPool: state.eventPool,
    decisionHistory: state.decisionHistory,
    snapshots: state.snapshots,
  };
}

function applySeedBundle(
  bundle: ReturnType<typeof createDay1Seed>,
): Pick<
  GameStoreState,
  | 'gameState'
  | 'neighborhoods'
  | 'resources'
  | 'eventPool'
  | 'decisionHistory'
  | 'snapshots'
  | 'lastDailyReport'
  | 'lastClosedDay'
> {
  return {
    gameState: withSyncedPulse(bundle.gameState),
    neighborhoods: bundle.neighborhoods,
    resources: bundle.resources,
    eventPool: bundle.eventPool,
    decisionHistory: bundle.decisionHistory,
    snapshots: bundle.snapshots,
    lastDailyReport: null,
    lastClosedDay: null,
  };
}

// ---------------------------------------------------------------------------
// Initial state (fresh game seed)
// ---------------------------------------------------------------------------

const initialBundle = createDay1Seed();

// ---------------------------------------------------------------------------
// Store with persist middleware
// ---------------------------------------------------------------------------

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...applySeedBundle(initialBundle),
      _hasHydrated: false,

      _setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),

      initializeDay1: () => {
        set(applySeedBundle(createDay1Seed()));
      },

      resetGame: () => {
        get().initializeDay1();
      },

      clearSaveAndReset: async () => {
        await clearPersistedGame();
        get().initializeDay1();
      },

      applyDecision: (eventId, decisionId) => {
        const current = get();
        const result = runApplyDecision({
          state: toEngineState(current),
          eventId,
          decisionId,
        });

        set({
          gameState: withSyncedPulse(result.nextState),
          neighborhoods:
            result.nextState.neighborhoods ?? current.neighborhoods,
          resources: result.nextState.resources ?? current.resources,
          decisionHistory: [
            ...current.decisionHistory,
            result.decisionRecord,
          ],
          snapshots: limitSnapshots([
            ...current.snapshots,
            result.beforeSnapshot,
            result.afterSnapshot,
          ]),
        });
      },

      endCurrentDay: () => {
        const current = get();
        const closingDay = current.gameState.city.day;

        if (current.lastClosedDay === closingDay) {
          return;
        }

        if (current.lastDailyReport?.day === closingDay) {
          return;
        }

        const reportDay = current.lastDailyReport?.day;
        const freshDayWithoutPlay =
          reportDay != null &&
          closingDay === reportDay + 1 &&
          !current.decisionHistory.some((r) => r.day === closingDay);

        if (freshDayWithoutPlay) {
          return;
        }

        const result = endDay(toEngineState(current));

        set({
          gameState: withSyncedPulse(result.nextState),
          neighborhoods:
            result.nextState.neighborhoods ?? current.neighborhoods,
          resources: result.nextState.resources ?? current.resources,
          eventPool: current.eventPool,
          decisionHistory: current.decisionHistory,
          snapshots: limitSnapshots(
            result.nextState.snapshots ?? current.snapshots,
          ),
          lastDailyReport: result.dailyReport,
          lastClosedDay: closingDay,
        });
      },
    }),
    {
      name: GAME_STORAGE_KEY,
      storage: gameJsonStorage,

      partialize: (state) =>
        partialiseGameState(state) as unknown as GameStore,

      merge: (persisted, currentState) => {
        if (!isValidSave(persisted)) {
          return { ...currentState, _hasHydrated: true };
        }
        const saved = persisted as PersistedGameState;
        return {
          ...currentState,
          gameState: withSyncedPulse(saved.gameState),
          neighborhoods: saved.neighborhoods,
          resources: saved.resources,
          eventPool: saved.eventPool,
          decisionHistory: saved.decisionHistory,
          snapshots: limitSnapshots(saved.snapshots),
          lastDailyReport: saved.lastDailyReport,
          lastClosedDay: saved.lastClosedDay,
          _hasHydrated: true,
        };
      },

      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true);
      },
    },
  ),
);

// ---------------------------------------------------------------------------
// Selectors — dışa aktarılan API değişmedi
// ---------------------------------------------------------------------------

/** Aktif olaylar veya havuzdan event döner. */
export function getEventById(eventId: string): EventCard | undefined {
  const { gameState, eventPool } = useGameStore.getState();
  return (
    gameState.events.find((e) => e.id === eventId) ??
    eventPool.find((e) => e.id === eventId)
  );
}

export const selectDay = (s: GameStore) => s.gameState.city.day;
export const selectRole = (s: GameStore) => s.gameState.player.role;
/** getState için; useGameStore ile doğrudan kullanmayın — useGameMetrics tercih edin. */
export const selectMetrics = (s: GameStore): GameMetrics => ({
  publicSatisfaction: s.gameState.city.publicSatisfaction,
  budget: s.gameState.city.budget,
  staffMorale: s.gameState.city.morale,
});

/** Metrikler — shallow compare ile sonsuz render döngüsünü önler. */
export function useGameMetrics(): GameMetrics {
  return useGameStore(
    useShallow((s) => ({
      publicSatisfaction: s.gameState.city.publicSatisfaction,
      budget: s.gameState.city.budget,
      staffMorale: s.gameState.city.morale,
    })),
  );
}
export const selectActiveEvents = (s: GameStore) => s.gameState.events;
export const selectResolvedEventIds = (s: GameStore) =>
  s.gameState.solvedEvents.map((e) => e.id);
export const selectXp = (s: GameStore) => s.gameState.player.xp;
export const selectLevel = (s: GameStore) => s.gameState.player.level;
export const selectLastDailyReport = (s: GameStore) => s.lastDailyReport;
export const selectDecisionHistory = (s: GameStore) => s.decisionHistory;
export const selectSnapshots = (s: GameStore) => s.snapshots;
export const selectGameState = (s: GameStore) => s.gameState;
export const selectCity = (s: GameStore) => s.gameState.city;
export const selectPlayer = (s: GameStore) => s.gameState.player;
export const selectFeaturedEventId = (s: GameStore) =>
  s.gameState.featuredEventId;
export const selectEventOpportunity = (s: GameStore) =>
  s.gameState.eventOpportunity;
export const selectHasHydrated = (s: GameStore) => s._hasHydrated;

export function getActiveEvent(eventId: string): EventCard | undefined {
  return useGameStore
    .getState()
    .gameState.events.find((e) => e.id === eventId);
}

export function isEventResolved(eventId: string): boolean {
  return useGameStore
    .getState()
    .gameState.solvedEvents.some((e) => e.id === eventId);
}
