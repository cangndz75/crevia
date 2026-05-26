import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import { createDay1Seed } from '@/core/content/day1Seed';
import { applyDecision as runApplyDecision } from '@/core/game/applyDecision';
import { applyPilotDecisionMetadata } from '@/core/game/applyPilotDecisionMetadata';
import {
  calculatePilotFinalResult,
  canCompletePilot,
} from '@/core/game/calculatePilotFinalResult';
import { advancePilotDayForGameState } from '@/core/game/advancePilotDayForGameState';
import { applyDistrictStartingMetrics } from '@/core/game/applyDistrictStartingMetrics';
import { createDefaultPilotState } from '@/core/game/createDefaultPilotState';
import {
  clearActiveEventsForGameState,
  shouldClearPilotActiveEvents,
} from '@/core/game/clearActiveEventsForGameState';
import { refreshPilotEventsFromGameState } from '@/core/game/refreshPilotEventsFromGameState';
import { syncCityDayWithPilotDay } from '@/core/game/syncCityDayWithPilotDay';
import { syncInitialSnapshotWithGameState } from '@/core/game/syncInitialSnapshotWithGameState';
import { endDay, type EndDayState } from '@/core/game/endDay';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { DailyReport } from '@/core/models/DailyReport';
import type { DaySnapshot } from '@/core/models/DaySnapshot';
import type { GameMetrics } from '@/core/models/GameMetrics';
import type { GameState } from '@/core/models/GameState';
import type { EventCard } from '@/core/models/EventCard';
import type {
  PendingConsequence,
  PilotFinalResult,
  PilotGameState,
} from '@/core/models/PilotGameState';
import type { GameResources } from '@/core/models/GameResources';
import type { Neighborhood } from '@/core/models/Neighborhood';
import type { CityPulseMetric } from '@/core/models/CityPulseMetric';
import type { CityState } from '@/core/models/CityState';
import { colors } from '@/ui/theme/colors';

import {
  clearPersistedGame,
  GAME_STORAGE_KEY,
  gameJsonStorage,
  limitSnapshots,
  normalizePersistedSave,
  partialiseGameState,
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
  setSelectedPilotDistrict: (districtId: PilotDistrictId) => void;
  startPilotDistrict: (districtId: PilotDistrictId) => void;
  setPilotFlag: (key: string, value: string | number | boolean) => void;
  addCompletedPilotEvent: (eventId: string) => void;
  addPendingConsequence: (consequence: PendingConsequence) => void;
  clearResolvedPendingConsequences: (ids: string[]) => void;
  advancePilotDay: () => void;
  completePilot: (finalResult: PilotFinalResult) => void;
  completePilotFromCurrentState: () => void;
  resetPilotState: () => void;
  refreshPilotEventsForCurrentDay: () => void;
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

function withPilot(
  gameState: GameState,
  updater: (pilot: PilotGameState) => PilotGameState,
): GameState {
  return withSyncedPulse({
    ...gameState,
    pilot: updater(gameState.pilot),
  });
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
        const event =
          current.gameState.events.find((e) => e.id === eventId) ??
          current.eventPool.find((e) => e.id === eventId);
        const decision = event?.decisions.find((d) => d.id === decisionId);

        const result = runApplyDecision({
          state: toEngineState(current),
          eventId,
          decisionId,
        });

        let nextGameState = withSyncedPulse(result.nextState);
        if (event && decision) {
          nextGameState = applyPilotDecisionMetadata({
            gameState: nextGameState,
            event,
            decision,
          });
        }

        const shouldClearEvents = shouldClearPilotActiveEvents(nextGameState);
        if (shouldClearEvents) {
          nextGameState = clearActiveEventsForGameState(nextGameState);
        }

        set({
          gameState: nextGameState,
          neighborhoods:
            result.nextState.neighborhoods ?? current.neighborhoods,
          resources: result.nextState.resources ?? current.resources,
          eventPool: shouldClearEvents ? [] : current.eventPool,
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

        const skipGenericEventSelection =
          current.gameState.pilot.status === 'active' ||
          current.gameState.pilot.status === 'completed';

        const result = endDay(toEngineState(current), {
          skipEventSelection: skipGenericEventSelection,
        });

        let nextGameState = withSyncedPulse(result.nextState);
        let nextEventPool = current.eventPool;

        if (nextGameState.pilot.status === 'active') {
          const advancedGameState = syncCityDayWithPilotDay(
            advancePilotDayForGameState(nextGameState),
          );
          const pilotRefresh = refreshPilotEventsFromGameState(
            advancedGameState,
            current.eventPool,
          );
          nextGameState = withSyncedPulse(pilotRefresh.gameState);
          nextEventPool = pilotRefresh.eventPool;
        }

        set({
          gameState: nextGameState,
          neighborhoods:
            result.nextState.neighborhoods ?? current.neighborhoods,
          resources: result.nextState.resources ?? current.resources,
          eventPool: nextEventPool,
          decisionHistory: current.decisionHistory,
          snapshots: limitSnapshots(
            result.nextState.snapshots ?? current.snapshots,
          ),
          lastDailyReport: result.dailyReport,
          lastClosedDay: closingDay,
        });
      },

      setSelectedPilotDistrict: (districtId) => {
        const { gameState } = get();
        set({
          gameState: withPilot(gameState, (pilot) => ({
            ...pilot,
            selectedDistrictId: districtId,
            status: pilot.status === 'active' ? pilot.status : 'active',
            currentPilotDay: 1,
          })),
        });
      },

      startPilotDistrict: (districtId) => {
        const { gameState, snapshots, eventPool } = get();
        const withPilotReset: GameState = {
          ...gameState,
          pilot: {
            ...createDefaultPilotState(),
            selectedDistrictId: districtId,
            status: 'active',
            currentPilotDay: 1,
          },
        };
        const withMetrics = applyDistrictStartingMetrics(
          withPilotReset,
          districtId,
        );
        const alignedGameState = syncCityDayWithPilotDay(withMetrics);
        const nextGameState = withSyncedPulse(alignedGameState);
        const pilotRefresh = refreshPilotEventsFromGameState(
          nextGameState,
          eventPool,
        );
        const syncedGameState = withSyncedPulse(pilotRefresh.gameState);
        set({
          gameState: syncedGameState,
          snapshots: syncInitialSnapshotWithGameState(
            snapshots,
            syncedGameState,
          ),
          eventPool: pilotRefresh.eventPool,
        });
      },

      refreshPilotEventsForCurrentDay: () => {
        const { gameState, eventPool } = get();
        const pilotRefresh = refreshPilotEventsFromGameState(
          gameState,
          eventPool,
        );
        if (!pilotRefresh.refreshed) {
          return;
        }
        set({
          gameState: withSyncedPulse(pilotRefresh.gameState),
          eventPool: pilotRefresh.eventPool,
        });
      },

      setPilotFlag: (key, value) => {
        const { gameState } = get();
        set({
          gameState: withPilot(gameState, (pilot) => ({
            ...pilot,
            flags: { ...pilot.flags, [key]: value },
          })),
        });
      },

      addCompletedPilotEvent: (eventId) => {
        const { gameState } = get();
        if (gameState.pilot.completedEventIds.includes(eventId)) {
          return;
        }
        set({
          gameState: withPilot(gameState, (pilot) => ({
            ...pilot,
            completedEventIds: [...pilot.completedEventIds, eventId],
          })),
        });
      },

      addPendingConsequence: (consequence) => {
        const { gameState } = get();
        set({
          gameState: withPilot(gameState, (pilot) => ({
            ...pilot,
            pendingConsequences: [
              ...pilot.pendingConsequences,
              consequence,
            ],
          })),
        });
      },

      clearResolvedPendingConsequences: (ids) => {
        const { gameState } = get();
        const idSet = new Set(ids);
        set({
          gameState: withPilot(gameState, (pilot) => ({
            ...pilot,
            pendingConsequences: pilot.pendingConsequences.filter(
              (c) => !idSet.has(c.id),
            ),
          })),
        });
      },

      advancePilotDay: () => {
        const { gameState } = get();
        const { currentPilotDay } = gameState.pilot;
        if (currentPilotDay >= 7) {
          return;
        }
        set({
          gameState: withPilot(gameState, (pilot) => ({
            ...pilot,
            currentPilotDay: currentPilotDay + 1,
          })),
        });
      },

      completePilot: (finalResult) => {
        const { gameState } = get();
        const withCompleted = withPilot(gameState, (pilot) => ({
          ...pilot,
          status: 'completed' as const,
          finalResult,
        }));
        set({
          gameState: withSyncedPulse(
            clearActiveEventsForGameState(withCompleted),
          ),
          eventPool: [],
        });
      },

      completePilotFromCurrentState: () => {
        const { gameState, snapshots } = get();
        if (!canCompletePilot(gameState)) {
          return;
        }
        const finalResult = calculatePilotFinalResult({
          gameState,
          snapshots,
        });
        get().completePilot(finalResult);
      },

      resetPilotState: () => {
        const { gameState } = get();
        set({
          gameState: withSyncedPulse({
            ...gameState,
            pilot: createDefaultPilotState(),
          }),
        });
      },
    }),
    {
      name: GAME_STORAGE_KEY,
      storage: gameJsonStorage,

      partialize: (state) =>
        partialiseGameState(state) as unknown as GameStore,

      merge: (persisted, currentState) => {
        const saved = normalizePersistedSave(persisted);
        if (!saved) {
          return { ...currentState, _hasHydrated: true };
        }
        return {
          ...currentState,
          gameState: withSyncedPulse(
            syncCityDayWithPilotDay(saved.gameState),
          ),
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
export const selectPilotState = (s: GameStore) => s.gameState.pilot;
export const selectSelectedPilotDistrictId = (s: GameStore) =>
  s.gameState.pilot.selectedDistrictId;
export const selectCurrentPilotDay = (s: GameStore) =>
  s.gameState.pilot.currentPilotDay;
export const selectPilotStatus = (s: GameStore) => s.gameState.pilot.status;

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
