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
import { clampMetric } from '@/core/game/clamp';
import type { DecisionAppliedEffects } from '@/core/models/DecisionRecord';
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
  appendPilotEventHistory,
  createPilotRun,
  ensurePilotRunOnPilot,
  finalizePilotRun,
  metricsFromCity,
  recordPilotDailySnapshot,
  syncPilotRunDay,
} from '@/core/game/pilotRun';

import {
  INITIAL_DAILY_GOAL_RUNTIME,
  createDailyGoalsForDay,
  ensureDailyGoalStateForStore,
  evaluateDailyGoalsForStore,
  processDecisionDailyGoal,
  processDayEndDailyGoal,
  processQuickActionDailyGoal,
  type DailyGoalRuntime,
  type DailyGoalStoreSlice,
} from '@/core/dailyGoals/dailyGoalIntegration';
import {
  buildDailyGoalReportResults,
  buildDecisionGoalImpactLine,
} from '@/core/dailyGoals/dailyGoalPresentation';
import type { DailyGoalClaimResult } from '@/core/dailyGoals/types';
import type { DailyGoalState } from '@/core/dailyGoals/dailyGoalTypes';
import { selectIsDay1TutorialEligible } from '@/features/tutorial/tutorialSelectors';
import type { ApplyDecisionXpResult } from '@/core/xp/applyDecisionXp';
import { createInitialPlayerProgress } from '@/core/xp/levelProgress';
import type { PlayerProgress } from '@/core/xp/types';
import {
  checkDecisionAffordability,
  type DecisionAffordabilityCheck,
} from '@/core/economy/economyAffordability';
import {
  applyEconomyTransactions,
  createEconomyTransaction,
  createInitialEconomyState,
  extractDecisionCostFromApplied,
} from '@/core/economy/economyEngine';
import type {
  ApplyDecisionEconomyResult,
  EconomyState,
} from '@/core/economy/types';
import { buildPersonnelDayReport } from '@/core/personnel/personnelEngine';
import {
  applyPersonnelRestAction,
  processPersonnelAfterDecision,
  processPersonnelEndOfDay,
} from '@/core/personnel/personnelIntegration';
import {
  canAffordRestAction,
  getRestActionCost,
} from '@/core/personnel/personnelRestActions';
import {
  processContainersAfterDecision,
  processContainersEndOfDay,
} from '@/core/containers/containerIntegration';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import type { ContainerState } from '@/core/containers/containerTypes';
import {
  processVehiclesAfterDecisionForStore,
  processVehiclesEndOfDayForStore,
} from '@/core/vehicles/vehicleIntegration';
import { applyVehicleFleetAction } from '@/core/vehicles/vehicleManualActions';
import { createInitialVehicleState } from '@/core/vehicles/vehicleSeed';
import type { VehicleFleetActionType } from '@/core/vehicles/vehicleTypes';
import {
  processSocialPulseAfterDecisionForStore,
  processSocialPulseEndOfDayForStore,
} from '@/core/social/socialIntegration';
import { applySocialQuickAction } from '@/core/social/socialQuickAction';
import type {
  ApplySocialQuickActionInput,
  ApplySocialQuickActionResult,
} from '@/core/social/socialTypes';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import type { SocialPulseState } from '@/core/social/socialTypes';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';
import { buildPilotLeaderboardPersistUpdate } from '@/core/leaderboard/leaderboardSelectors';
import type { LeaderboardEntry } from '@/core/leaderboard/leaderboardTypes';
import { createInitialPersonnelState } from '@/core/personnel/personnelSeed';
import type { PersonnelState, RestActionType } from '@/core/personnel/personnelTypes';
import type { DecisionResultSnapshot } from '@/features/events/types/decisionResultTypes';
import {
  buildDecisionResultCitySlice,
  buildDecisionResultSnapshot,
} from '@/features/events/utils/decisionResultModel';

export type ApplyDecisionInsufficientReason =
  | 'insufficient_source'
  | 'already_resolved';

export type ApplyDecisionStoreResult = ApplyDecisionXpResult & {
  dailyGoalClaim: DailyGoalClaimResult | null;
  economy?: ApplyDecisionEconomyResult;
  /** Verilmezse başarılı kabul edilir — geriye uyumluluk. */
  success?: boolean;
  reason?: ApplyDecisionInsufficientReason;
};

function buildBlockedApplyDecisionResult(
  playerProgress: PlayerProgress,
  reason: ApplyDecisionInsufficientReason,
  affordability?: DecisionAffordabilityCheck,
): ApplyDecisionStoreResult {
  return {
    playerProgress,
    xpBreakdown: { total: 0, items: [] },
    xpTransactions: [],
    leveledUp: false,
    previousLevel: playerProgress.currentLevel,
    newLevel: playerProgress.currentLevel,
    unlockedAuthorities: [...playerProgress.unlockedAuthorities],
    dailyGoalClaim: null,
    success: false,
    reason,
    economy: affordability
      ? {
          cost: affordability.cost,
          currentSource: affordability.currentSource,
          insufficientSource: true,
          missingSource: affordability.missingSource,
        }
      : undefined,
  };
}

import {
  advanceTutorialState,
  skipTutorialState,
  startTutorialState,
} from '@/features/tutorial/tutorialSelectors';
import {
  INITIAL_TUTORIAL_STATE,
  type TutorialState,
} from '@/features/tutorial/tutorialTypes';

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
  /** Son kararın net bütçe etkisi — persist edilmez, header'da gösterilir */
  lastBudgetDelta: number | null;
  /** Son başarılı karar sonucu — persist edilmez, karar sonuç ekranında gösterilir */
  lastDecisionResult: DecisionResultSnapshot | null;
  /**
   * Yeni XP / seviye modülü ilerlemesi.
   * gameState.player (mock header XP) ile ayrı tutulur — UI bu alanı henüz göstermiyor.
   */
  playerProgress: PlayerProgress;
  dailyGoalState: DailyGoalState | null;
  dailyGoalsByDay: Record<number, DailyGoalState>;
  dailyGoalRuntime: DailyGoalRuntime;
  economyState: EconomyState;
  personnelState: PersonnelState;
  containerState: ContainerState;
  vehicleState: VehicleState;
  socialPulseState: SocialPulseState;
  tutorialState: TutorialState;
  /** Pilot tamamlanınca kaydedilen yerel en iyi skorlar (leaderboard UI sonraki aşama). */
  bestPilotScores: LeaderboardEntry[];
  lastPilotScore?: LeaderboardEntry;
  /** AsyncStorage'dan hydration tamamlandı mı? */
  _hasHydrated: boolean;
};

type GameStoreActions = {
  initializeDay1: () => void;
  applyDecision: (eventId: string, decisionId: string) => ApplyDecisionStoreResult;
  setLastDecisionResult: (result: DecisionResultSnapshot | null) => void;
  clearLastDecisionResult: () => void;
  ensureDailyGoalsForDay: (day?: number) => void;
  clearDailyGoals: () => void;
  useQuickAction: (actionId: string) => void;
  endCurrentDay: () => void;
  resetGame: () => void;
  clearSaveAndReset: () => Promise<void>;
  addXp: (amount: number) => void;
  updateBudget: (amount: number) => void;
  setCurrentDay: (day: number) => void;
  updateMetrics: (effects: DecisionAppliedEffects) => void;
  applyDecisionEffects: (effects: DecisionAppliedEffects) => void;
  completeEvent: (eventId: string, decisionId: string) => void;
  hydrateGameState: () => Promise<void>;
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
  restPersonnelTeam: (
    teamId: string,
    restType: RestActionType,
  ) => { success: boolean; message: string };
  applyVehicleFleetActionFromHub: (
    actionType: VehicleFleetActionType,
    vehicleId: string,
  ) => { success: boolean; message: string };
  applySocialQuickAction: (
    input: ApplySocialQuickActionInput,
  ) => ApplySocialQuickActionResult;
  ensureDay1TutorialStarted: () => void;
  advanceTutorial: () => void;
  skipTutorial: () => void;
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
      label: 'Kaynak Durumu',
      value: `${Math.round(city.budget / 1000)}K Kaynak`,
      progress: Math.min(1, city.budget / 100_000),
      color: colors.secondary,
      mutedColor: colors.secondaryMuted,
      icon: 'cash',
      trendLabel: 'Kaynak',
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

function resolveEventForStore(
  state: GameStoreState,
  eventId: string,
): EventCard | undefined {
  return (
    state.gameState.events.find((e) => e.id === eventId) ??
    state.eventPool.find((e) => e.id === eventId)
  );
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

function applyMetricPatch(
  gameState: GameState,
  effects: DecisionAppliedEffects,
): GameState {
  const city = gameState.city;
  let nextCity = { ...city };

  if (effects.publicSatisfaction != null && effects.publicSatisfaction !== 0) {
    nextCity = {
      ...nextCity,
      publicSatisfaction: clampMetric(
        nextCity.publicSatisfaction + effects.publicSatisfaction,
      ),
    };
  }
  if (effects.staffMorale != null && effects.staffMorale !== 0) {
    nextCity = {
      ...nextCity,
      morale: clampMetric(nextCity.morale + effects.staffMorale),
    };
  }
  if (effects.budget != null && effects.budget !== 0) {
    nextCity = {
      ...nextCity,
      budget: Math.max(0, nextCity.budget + effects.budget),
    };
  }
  if (effects.risk != null && effects.risk !== 0) {
    nextCity = {
      ...nextCity,
      riskScore: clampMetric(nextCity.riskScore + effects.risk),
    };
  }

  return withSyncedPulse({
    ...gameState,
    city: nextCity,
  });
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
  | 'lastBudgetDelta'
  | 'lastDecisionResult'
  | 'playerProgress'
  | 'dailyGoalState'
  | 'dailyGoalsByDay'
  | 'dailyGoalRuntime'
  | 'economyState'
  | 'personnelState'
  | 'containerState'
  | 'vehicleState'
  | 'socialPulseState'
  | 'tutorialState'
  | 'bestPilotScores'
  | 'lastPilotScore'
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
    lastBudgetDelta: null,
    lastDecisionResult: null,
    playerProgress: createInitialPlayerProgress(),
    dailyGoalState: createDailyGoalsForDay({
      day: bundle.gameState.city.day,
      gameState: bundle.gameState,
      neighborhoods: bundle.neighborhoods,
      containerState: createInitialContainerState(bundle.gameState.city.day),
      vehicleState: createInitialVehicleState(bundle.gameState.city.day),
      personnelState: createInitialPersonnelState(),
      socialPulseState: createInitialSocialPulseState(bundle.gameState.city.day),
      isDay1Tutorial: true,
    }),
    dailyGoalsByDay: {},
    dailyGoalRuntime: { ...INITIAL_DAILY_GOAL_RUNTIME },
    economyState: createInitialEconomyState(),
    personnelState: createInitialPersonnelState(),
    containerState: createInitialContainerState(bundle.gameState.city.day),
    vehicleState: createInitialVehicleState(bundle.gameState.city.day),
    socialPulseState: createInitialSocialPulseState(bundle.gameState.city.day),
    tutorialState: { ...INITIAL_TUTORIAL_STATE },
    bestPilotScores: [],
    lastPilotScore: undefined,
  };
}

function buildDailyGoalStoreSlice(
  state: GameStoreState,
  day?: number,
): DailyGoalStoreSlice {
  const resolvedDay = day ?? state.gameState.city.day;
  return {
    day: resolvedDay,
    gameState: state.gameState,
    neighborhoods: state.neighborhoods,
    containerState: state.containerState,
    vehicleState: state.vehicleState,
    personnelState: state.personnelState,
    socialPulseState: state.socialPulseState,
    decisionHistory: state.decisionHistory,
    dailyGoalRuntime: state.dailyGoalRuntime,
    isDay1Tutorial: selectIsDay1TutorialEligible(state as GameStore),
    lastClosedDay: state.lastClosedDay,
  };
}

function bootstrapDailyGoalState(
  state: GameStoreState,
  day?: number,
): DailyGoalState {
  const slice = buildDailyGoalStoreSlice(state, day);
  let goalState = ensureDailyGoalStateForStore(slice, state.dailyGoalState);
  goalState = evaluateDailyGoalsForStore(goalState, slice, 'day_start');
  return goalState;
}

function syncCityBudgetWithEconomy(
  gameState: GameState,
  economyState: EconomyState,
): GameState {
  if (gameState.city.budget === economyState.currentSource) {
    return gameState;
  }
  return {
    ...gameState,
    city: { ...gameState.city, budget: economyState.currentSource },
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
      tutorialState: { ...INITIAL_TUTORIAL_STATE },
      bestPilotScores: [],
      lastPilotScore: undefined,
      lastBudgetDelta: null,
      lastDecisionResult: null,
      _hasHydrated: false,

      setLastDecisionResult: (result) => set({ lastDecisionResult: result }),
      clearLastDecisionResult: () => set({ lastDecisionResult: null }),

      ensureDailyGoalsForDay: (day) => {
        const current = get();
        const targetDay = day ?? current.gameState.city.day;
        if (
          current.dailyGoalState?.day === targetDay &&
          current.dailyGoalState.goals.length > 0
        ) {
          return;
        }
        const goalState = bootstrapDailyGoalState(current, targetDay);
        set({
          dailyGoalState: goalState,
          dailyGoalsByDay: {
            ...current.dailyGoalsByDay,
            [targetDay]: goalState,
          },
        });
      },

      clearDailyGoals: () => {
        set({ dailyGoalState: null, dailyGoalsByDay: {} });
      },

      _setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),

      hydrateGameState: async () => {
        await useGameStore.persist.rehydrate();
      },

      addXp: (amount) => {
        if (amount === 0) return;
        const { gameState } = get();
        let xp = gameState.player.xp + amount;
        let level = gameState.player.level;
        let xpToNextLevel = gameState.player.xpToNextLevel;

        while (xp >= xpToNextLevel && xpToNextLevel > 0) {
          xp -= xpToNextLevel;
          level += 1;
          xpToNextLevel = Math.round(xpToNextLevel * 1.25);
        }

        set({
          gameState: withSyncedPulse({
            ...gameState,
            player: { ...gameState.player, xp, level, xpToNextLevel },
          }),
        });
      },

      updateBudget: (amount) => {
        const { gameState, economyState } = get();
        if (amount === 0) return;

        const tx = createEconomyTransaction({
          day: gameState.city.day,
          amount,
          type: amount > 0 ? 'reward' : 'daily_adjustment',
          title: amount > 0 ? 'Kaynak artışı' : 'Kaynak düşüşü',
          sourceType: 'system',
        });
        const economyResult = applyEconomyTransactions(economyState, [tx]);
        const syncedGameState = syncCityBudgetWithEconomy(
          gameState,
          economyResult.economyState,
        );

        set({
          lastBudgetDelta: amount,
          economyState: economyResult.economyState,
          gameState: withSyncedPulse(syncedGameState),
        });
      },

      setCurrentDay: (day) => {
        const { gameState } = get();
        set({
          gameState: withSyncedPulse({
            ...gameState,
            city: { ...gameState.city, day: Math.max(1, day) },
          }),
        });
      },

      updateMetrics: (effects) => {
        const { gameState } = get();
        const budgetEffect = effects.budget ?? 0;
        set({
          lastBudgetDelta: budgetEffect !== 0 ? budgetEffect : get().lastBudgetDelta,
          gameState: applyMetricPatch(gameState, effects),
        });
      },

      applyDecisionEffects: (effects) => {
        get().updateMetrics(effects);
      },

      completeEvent: (eventId, decisionId) => {
        get().applyDecision(eventId, decisionId);
      },

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

        if (current.gameState.solvedEvents.some((e) => e.id === eventId)) {
          return buildBlockedApplyDecisionResult(
            current.playerProgress,
            'already_resolved',
          );
        }

        const event =
          current.gameState.events.find((e) => e.id === eventId) ??
          current.eventPool.find((e) => e.id === eventId);
        const decision = event?.decisions.find((d) => d.id === decisionId);

        if (decision) {
          const affordability = checkDecisionAffordability({
            economyState: current.economyState,
            decision,
          });
          if (!affordability.canAfford) {
            return buildBlockedApplyDecisionResult(
              current.playerProgress,
              'insufficient_source',
              affordability,
            );
          }
        }

        const gameStateBefore = buildDecisionResultCitySlice(current.gameState.city);
        const personnelStateBefore = current.personnelState;
        const containerStateBefore = current.containerState;
        const vehicleStateBefore = current.vehicleState;
        const socialPulseStateBefore = current.socialPulseState;

        const result = runApplyDecision({
          state: toEngineState(current),
          eventId,
          decisionId,
          playerProgress: current.playerProgress,
        });

        let nextGameState = withSyncedPulse(result.nextState);
        if (event && decision) {
          nextGameState = applyPilotDecisionMetadata({
            gameState: nextGameState,
            event,
            decision,
          });
        }

        if (
          nextGameState.pilot.status === 'active' &&
          nextGameState.pilot.run &&
          event &&
          decision
        ) {
          const pilotDay =
            nextGameState.pilot.currentPilotDay ?? nextGameState.city.day;
          nextGameState = withPilot(nextGameState, (pilot) => ({
            ...pilot,
            run: appendPilotEventHistory({
              run: pilot.run!,
              day: pilotDay,
              event,
              decisionId: decision.id,
              decisionLabel: decision.title,
              effects: result.decisionRecord.appliedEffects,
            }),
          }));
        }

        const shouldClearEvents = shouldClearPilotActiveEvents(nextGameState);
        if (shouldClearEvents) {
          nextGameState = clearActiveEventsForGameState(nextGameState);
        }

        const budgetEffect = result.decisionRecord.appliedEffects.budget ?? 0;

        const decisionCost = extractDecisionCostFromApplied(
          result.decisionRecord.appliedCosts,
          result.decisionRecord.appliedEffects,
          { decision },
        );

        let economyState = current.economyState;
        let decisionEconomy: ApplyDecisionEconomyResult | undefined;

        if (decisionCost > 0) {
          const economyTx = createEconomyTransaction({
            day: result.decisionRecord.day,
            amount: -decisionCost,
            type: 'decision_cost',
            title: 'Karar maliyeti',
            description: event?.title ?? decision?.title,
            sourceId: decision?.id,
            sourceType: 'decision',
          });
          const economyResult = applyEconomyTransactions(
            economyState,
            [economyTx],
          );
          economyState = economyResult.economyState;
          decisionEconomy = {
            cost: decisionCost,
            transaction: economyResult.appliedTransactions[0],
            currentSource: economyState.currentSource,
            insufficientSource: economyResult.insufficientSource,
          };
        } else {
          decisionEconomy = {
            cost: 0,
            currentSource: economyState.currentSource,
            insufficientSource: false,
          };
        }

        nextGameState = syncCityBudgetWithEconomy(nextGameState, economyState);

        let personnelState = current.personnelState;
        let personnelRuntime = current.dailyGoalRuntime;
        let containerState = current.containerState;
        let vehicleState = current.vehicleState;
        let socialPulseState = current.socialPulseState;
        let personnelAssigned = false;
        let personnelAssignment: ReturnType<
          typeof processPersonnelAfterDecision
        >['assignment'] = null;

        if (event && decision) {
          const personnelResult = processPersonnelAfterDecision(
            {
              personnelState,
              event,
              decision,
              day: result.decisionRecord.day,
              neighborhoods: current.neighborhoods,
              resources: result.nextState.resources ?? current.resources,
            },
            nextGameState.city.morale,
          );
          personnelState = personnelResult.personnelState;
          personnelAssignment = personnelResult.assignment;
          personnelAssigned = personnelAssignment != null;
          personnelRuntime = {
            ...personnelRuntime,
            staffFatiguePeak: Math.max(
              personnelRuntime.staffFatiguePeak,
              personnelResult.staffFatiguePeak,
            ),
          };

          const containerResult = processContainersAfterDecision({
            containerState,
            event: {
              id: event.id,
              neighborhoodId: event.neighborhoodId,
              eventType: event.eventType,
              title: event.title,
              category: event.category,
            },
            decision: {
              id: decision.id,
              title: decision.title,
              description: decision.description,
              decisionStyle: decision.decisionStyle,
              costs: decision.costs,
            },
            day: result.decisionRecord.day,
            personnelAssigned,
          });
          containerState = containerResult.state;

          vehicleState = processVehiclesAfterDecisionForStore({
            vehicleState,
            event: {
              id: event.id,
              eventType: event.eventType,
              title: event.title,
              description: event.description,
              category: event.category,
              neighborhoodId: event.neighborhoodId,
              districtIds: event.districtIds,
              tags: event.filterTags,
            },
            decision: {
              id: decision.id,
              title: decision.title,
              description: decision.description,
              style: decision.style,
              decisionStyle: decision.decisionStyle,
              costs: decision.costs,
            },
            day: result.decisionRecord.day,
          });

          socialPulseState = processSocialPulseAfterDecisionForStore(
            socialPulseState,
            {
              event: {
                id: event.id,
                title: event.title,
                description: event.description,
                category: event.category,
                neighborhoodId: event.neighborhoodId,
                districtIds: event.districtIds,
                eventType: event.eventType,
                tags: event.filterTags,
              },
              decision: {
                id: decision.id,
                title: decision.title,
                description: decision.description,
              },
              day: result.decisionRecord.day,
            },
          );

          if (
            personnelResult.metricEffects &&
            Object.keys(personnelResult.metricEffects).length > 0
          ) {
            nextGameState = applyMetricPatch(
              nextGameState,
              personnelResult.metricEffects,
            );
          }

          if (personnelResult.cityMorale != null) {
            nextGameState = withSyncedPulse({
              ...nextGameState,
              city: {
                ...nextGameState.city,
                morale: clampMetric(personnelResult.cityMorale),
              },
            });
          }
        }

        let playerProgress = result.xp.playerProgress;
        let dailyGoalRuntime = personnelRuntime;
        let dailyGoalClaim: DailyGoalClaimResult | null = null;
        let dailyGoalState = current.dailyGoalState;
        const goalStateBefore = dailyGoalState;

        if (event && decision) {
          const storeSlice = buildDailyGoalStoreSlice(
            { ...current, gameState: nextGameState, personnelState, containerState, vehicleState, socialPulseState },
            result.decisionRecord.day,
          );
          const dailyResult = processDecisionDailyGoal({
            day: result.decisionRecord.day,
            goal: null,
            playerProgress,
            event,
            decision,
            appliedEffects: result.decisionRecord.appliedEffects,
            appliedCosts: result.decisionRecord.appliedCosts,
            runtime: dailyGoalRuntime,
            storeSlice,
            dailyGoalState,
          });
          playerProgress = dailyResult.playerProgress;
          dailyGoalState = dailyResult.dailyGoalState;
          dailyGoalRuntime = dailyResult.runtime;
          dailyGoalClaim = dailyResult.processResult.claim;
        }

        const dailyGoalsByDay = {
          ...current.dailyGoalsByDay,
          ...(dailyGoalState ? { [dailyGoalState.day]: dailyGoalState } : {}),
        };

        let lastDecisionResult: DecisionResultSnapshot | null = null;
        if (event && decision) {
          const neighborhood =
            current.neighborhoods.find((n) => n.id === event.neighborhoodId) ??
            current.neighborhoods.find((n) => n.name === event.district);

          lastDecisionResult = buildDecisionResultSnapshot({
            day: result.decisionRecord.day,
            event,
            decision,
            neighborhoodName: neighborhood?.name ?? event.district,
            gameStateBefore,
            gameStateAfter: buildDecisionResultCitySlice(nextGameState.city),
            personnelStateBefore,
            personnelStateAfter: personnelState,
            containerStateBefore,
            containerStateAfter: containerState,
            vehicleStateBefore,
            vehicleStateAfter: vehicleState,
            socialPulseStateBefore,
            socialPulseStateAfter: socialPulseState,
            personnelAssignment,
          });

          const impactLine = buildDecisionGoalImpactLine(
            dailyGoalState,
            goalStateBefore,
          );
          if (impactLine) {
            lastDecisionResult = { ...lastDecisionResult, dailyGoalImpact: impactLine };
          }
        }

        set({
          gameState: withSyncedPulse(nextGameState),
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
          lastBudgetDelta: budgetEffect !== 0 ? budgetEffect : null,
          economyState,
          playerProgress,
          dailyGoalState,
          dailyGoalsByDay,
          dailyGoalRuntime,
          personnelState,
          containerState,
          vehicleState,
          socialPulseState,
          lastDecisionResult,
        });

        return {
          ...result.xp,
          dailyGoalClaim,
          economy: decisionEconomy,
          success: true,
        };
      },

      restPersonnelTeam: (teamId, restType) => {
        const current = get();
        const day = current.gameState.city.day;
        const cost = getRestActionCost(restType);

        if (cost > 0 && !canAffordRestAction(current.economyState, restType)) {
          return {
            success: false,
            message: `Bu destek için ${Math.round(cost / 1000)}K Kaynak gerekiyor.`,
          };
        }

        const restResult = applyPersonnelRestAction(
          current.personnelState,
          teamId,
          restType,
          day,
        );
        if (!restResult.success) {
          return { success: false, message: restResult.message };
        }

        let economyState = current.economyState;
        if (cost > 0) {
          const economyTx = createEconomyTransaction({
            day,
            amount: -cost,
            type: 'decision_cost',
            title:
              restType === 'motivation'
                ? 'Motivasyon desteği'
                : 'Ekipman desteği',
            sourceType: 'system',
          });
          const economyResult = applyEconomyTransactions(economyState, [
            economyTx,
          ]);
          economyState = economyResult.economyState;
        }

        const restedTeam = restResult.personnelState.teams.find(
          (t) => t.id === teamId,
        );
        let gameState = syncCityBudgetWithEconomy(current.gameState, economyState);
        if (restedTeam && (restType === 'motivation' || restType === 'full_rest')) {
          gameState = withSyncedPulse({
            ...gameState,
            city: {
              ...gameState.city,
              morale: clampMetric(
                Math.round(gameState.city.morale * 0.7 + restedTeam.morale * 0.3),
              ),
            },
          });
        }

        set({
          personnelState: restResult.personnelState,
          gameState,
          economyState,
        });
        return { success: true, message: restResult.message };
      },

      applyVehicleFleetActionFromHub: (actionType, vehicleId) => {
        const current = get();
        const day = current.gameState.city.day;
        const result = applyVehicleFleetAction(current.vehicleState, {
          type: actionType,
          vehicleId,
          day,
        });
        if (!result.applied) {
          return { success: false, message: result.message };
        }
        set({ vehicleState: result.state });
        return { success: true, message: result.message };
      },

      applySocialQuickAction: (input) => {
        const current = get();
        const day = input.day ?? current.gameState.city.day;
        const result = applySocialQuickAction(current.socialPulseState, {
          ...input,
          day,
        });
        if (!result.success) {
          return result;
        }

        const slice = buildDailyGoalStoreSlice({
          ...current,
          socialPulseState: result.state,
        });
        const quickGoal = processQuickActionDailyGoal({
          slice,
          dailyGoalState: current.dailyGoalState,
          playerProgress: current.playerProgress,
        });

        set({
          socialPulseState: result.state,
          dailyGoalState: quickGoal.dailyGoalState,
          dailyGoalsByDay: {
            ...current.dailyGoalsByDay,
            [quickGoal.dailyGoalState.day]: quickGoal.dailyGoalState,
          },
          playerProgress: quickGoal.playerProgress,
        });
        return result;
      },

      useQuickAction: (actionId) => {
        const current = get();
        const quickResult = processQuickActionDailyGoal({
          slice: buildDailyGoalStoreSlice(current),
          dailyGoalState: current.dailyGoalState,
          playerProgress: current.playerProgress,
        });

        set({
          playerProgress: quickResult.playerProgress,
          dailyGoalState: quickResult.dailyGoalState,
          dailyGoalsByDay: {
            ...current.dailyGoalsByDay,
            [quickResult.dailyGoalState.day]: quickResult.dailyGoalState,
          },
        });
      },

      endCurrentDay: () => {
        const current = get();
        const closingDay = current.gameState.city.day;
        const pilotActiveBeforeEnd =
          current.gameState.pilot.status === 'active';

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

        const districtNames = Object.fromEntries(
          current.neighborhoods.map((n) => [n.id, n.name]),
        );
        const personnelReport = buildPersonnelDayReport(
          current.personnelState,
          closingDay,
          districtNames,
        );

        const containerStateAfterNight = processContainersEndOfDay({
          containerState: current.containerState,
          day: closingDay,
        }).state;

        const vehicleStateAfterNight = processVehiclesEndOfDayForStore(
          current.vehicleState,
          closingDay,
        );

        const socialPulseStateBeforeNight = current.socialPulseState;

        const socialPulseStateAfterNight = processSocialPulseEndOfDayForStore(
          current.socialPulseState,
          closingDay,
        );

        const result = endDay(toEngineState(current), {
          skipEventSelection: skipGenericEventSelection,
          personnelReport,
          containerState: containerStateAfterNight,
          vehicleState: vehicleStateAfterNight,
          socialPulseState: socialPulseStateAfterNight,
          socialPulseStateBefore: socialPulseStateBeforeNight,
        });

        const personnelStateAfterNight = processPersonnelEndOfDay(
          current.personnelState,
          closingDay,
        );

        const dayEndSlice = buildDailyGoalStoreSlice(
          {
            ...current,
            containerState: containerStateAfterNight,
            vehicleState: vehicleStateAfterNight,
            socialPulseState: socialPulseStateAfterNight,
            personnelState: personnelStateAfterNight,
          },
          closingDay,
        );
        let closingGoalState = ensureDailyGoalStateForStore(
          dayEndSlice,
          current.dailyGoalState,
        );
        closingGoalState = evaluateDailyGoalsForStore(
          closingGoalState,
          dayEndSlice,
          'end_of_day',
        );

        let nextGameState = withSyncedPulse(result.nextState);
        let nextEventPool = current.eventPool;

        if (pilotActiveBeforeEnd && nextGameState.pilot.run) {
          const endMetrics = metricsFromCity(nextGameState.city);
          nextGameState = withPilot(nextGameState, (pilot) => ({
            ...pilot,
            run: recordPilotDailySnapshot({
              run: pilot.run!,
              day: closingDay,
              endMetrics,
              snapshots: limitSnapshots([
                ...current.snapshots,
                result.endDaySnapshot,
              ]),
              decisionHistory: current.decisionHistory,
              eventLookup: (id) => resolveEventForStore(current, id),
            }),
          }));
        }

        const dayEndGoalResult = processDayEndDailyGoal({
          slice: dayEndSlice,
          dailyGoalState: closingGoalState,
          playerProgress: current.playerProgress,
        });
        let playerProgress = dayEndGoalResult.playerProgress;
        closingGoalState = dayEndGoalResult.dailyGoalState;

        const dailyReport = {
          ...result.dailyReport,
          dailyGoalResults:
            result.dailyReport.dailyGoalResults ??
            buildDailyGoalReportResults(closingGoalState),
        };

        const dailyGoalsByDay = {
          ...current.dailyGoalsByDay,
          [closingDay]: closingGoalState,
        };

        if (nextGameState.pilot.status === 'active') {
          const advancedGameState = syncCityDayWithPilotDay(
            advancePilotDayForGameState(nextGameState),
          );
          const pilotRefresh = refreshPilotEventsFromGameState(
            advancedGameState,
            current.eventPool,
            {
              containerState: containerStateAfterNight,
              vehicleState: vehicleStateAfterNight,
            },
          );
          nextGameState = withSyncedPulse(pilotRefresh.gameState);
          nextEventPool = pilotRefresh.eventPool;

          if (nextGameState.pilot.run) {
            nextGameState = withPilot(nextGameState, (pilot) => ({
              ...pilot,
              run: syncPilotRunDay(
                pilot.run!,
                nextGameState.pilot.currentPilotDay,
              ),
            }));
          }
        }

        const nextDay = nextGameState.city.day;

        const syncedMoraleCity = {
          ...nextGameState.city,
          morale: clampMetric(
            Math.round(
              nextGameState.city.morale * 0.5 +
                (personnelStateAfterNight.teams.reduce((s, t) => s + t.morale, 0) /
                  Math.max(1, personnelStateAfterNight.teams.length)) *
                  0.5,
            ),
          ),
        };

        set({
          gameState: withSyncedPulse({
            ...nextGameState,
            city: syncedMoraleCity,
          }),
          neighborhoods:
            result.nextState.neighborhoods ?? current.neighborhoods,
          resources: result.nextState.resources ?? current.resources,
          eventPool: nextEventPool,
          decisionHistory: current.decisionHistory,
          snapshots: limitSnapshots(
            result.nextState.snapshots ?? current.snapshots,
          ),
          lastDailyReport: dailyReport,
          lastClosedDay: closingDay,
          playerProgress,
          dailyGoalsByDay,
          dailyGoalState: bootstrapDailyGoalState(
            {
              ...current,
              gameState: withSyncedPulse({
                ...nextGameState,
                city: syncedMoraleCity,
              }),
              containerState: containerStateAfterNight,
              vehicleState: vehicleStateAfterNight,
              socialPulseState: socialPulseStateAfterNight,
              personnelState: personnelStateAfterNight,
            },
            nextDay,
          ),
          dailyGoalRuntime: { ...INITIAL_DAILY_GOAL_RUNTIME },
          personnelState: personnelStateAfterNight,
          containerState: containerStateAfterNight,
          vehicleState: vehicleStateAfterNight,
          socialPulseState: socialPulseStateAfterNight,
        });
      },

      setSelectedPilotDistrict: (districtId) => {
        const { gameState, eventPool, containerState, vehicleState } = get();
        const withDistrict = withPilot(gameState, (pilot) => ({
          ...pilot,
          selectedDistrictId: districtId,
          status: pilot.status === 'active' ? pilot.status : 'active',
          currentPilotDay: 1,
          dailyEventSet: undefined,
        }));
        const pilotRefresh = refreshPilotEventsFromGameState(
          withDistrict,
          eventPool,
          { containerState, vehicleState },
        );
        set({
          gameState: withSyncedPulse(pilotRefresh.gameState),
          eventPool: pilotRefresh.eventPool,
        });
      },

      startPilotDistrict: (districtId) => {
        const { gameState, snapshots, eventPool, containerState, vehicleState } =
          get();
        const withPilotReset: GameState = {
          ...gameState,
          pilot: {
            ...createDefaultPilotState(),
            selectedDistrictId: districtId,
            status: 'active',
            currentPilotDay: 1,
            run: createPilotRun(districtId),
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
          { containerState, vehicleState },
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
        const { gameState, eventPool, containerState, vehicleState } = get();
        const pilotRefresh = refreshPilotEventsFromGameState(
          gameState,
          eventPool,
          { containerState, vehicleState },
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
        const current = get();
        const { gameState } = current;
        const finalMetrics = metricsFromCity(gameState.city);
        const closingDay = gameState.pilot.currentPilotDay;

        const withCompleted = withPilot(gameState, (pilot) => {
          let run = pilot.run;
          if (run) {
            run = recordPilotDailySnapshot({
              run,
              day: closingDay,
              endMetrics: finalMetrics,
              snapshots: current.snapshots,
              decisionHistory: current.decisionHistory,
              eventLookup: (id) => resolveEventForStore(current, id),
            });
            run = finalizePilotRun(run, finalMetrics, pilot.currentPilotDay);
          }
          return {
            ...pilot,
            status: 'completed' as const,
            finalResult,
            run,
          };
        });
        const leaderboardUpdate = buildPilotLeaderboardPersistUpdate({
          gameState: withSyncedPulse(
            clearActiveEventsForGameState(withCompleted),
          ),
          personnelState: current.personnelState,
          containerState: current.containerState,
          decisionHistory: current.decisionHistory,
          snapshots: current.snapshots,
          economyState: current.economyState,
          playerName: withCompleted.player.name,
          bestPilotScores: current.bestPilotScores,
          lastPilotScore: current.lastPilotScore,
        });

        set({
          gameState: withSyncedPulse(
            clearActiveEventsForGameState(withCompleted),
          ),
          eventPool: [],
          bestPilotScores: leaderboardUpdate.bestPilotScores,
          lastPilotScore: leaderboardUpdate.lastPilotScore,
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

      ensureDay1TutorialStarted: () => {
        const { tutorialState, gameState } = get();
        const day = gameState.pilot.currentPilotDay ?? gameState.city.day;
        if (day !== 1 || gameState.pilot.status !== 'active') return;
        if (tutorialState.day1Completed || tutorialState.skipped) return;
        const next = startTutorialState(tutorialState);
        if (next !== tutorialState) {
          set({ tutorialState: next });
        }
      },

      advanceTutorial: () => {
        const { tutorialState } = get();
        if (tutorialState.day1Completed || tutorialState.skipped) return;
        if (!tutorialState.activeStepId) return;
        set({ tutorialState: advanceTutorialState(tutorialState) });
      },

      skipTutorial: () => {
        set({ tutorialState: skipTutorialState(get().tutorialState) });
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
        const syncedGameState = withSyncedPulse(
          syncCityDayWithPilotDay(saved.gameState),
        );
        const withPilotRun = ensurePilotRunOnPilot(
          syncedGameState,
          limitSnapshots(saved.snapshots),
          saved.decisionHistory,
          (eventId) => {
            const fromEvents = syncedGameState.events.find(
              (e) => e.id === eventId,
            );
            if (fromEvents) return fromEvents;
            return saved.eventPool.find((e) => e.id === eventId);
          },
        );

        const pilotRefresh = refreshPilotEventsFromGameState(
          withPilotRun,
          saved.eventPool,
          {
            containerState: saved.containerState,
            vehicleState: saved.vehicleState,
          },
        );

        return {
          ...currentState,
          gameState: withSyncedPulse(pilotRefresh.gameState),
          neighborhoods: saved.neighborhoods,
          resources: saved.resources,
          eventPool: pilotRefresh.eventPool,
          decisionHistory: saved.decisionHistory,
          snapshots: limitSnapshots(saved.snapshots),
          lastDailyReport: saved.lastDailyReport,
          lastClosedDay: saved.lastClosedDay,
          playerProgress: saved.playerProgress,
          dailyGoalState:
            saved.dailyGoalState ??
            bootstrapDailyGoalState({
              ...currentState,
              gameState: withSyncedPulse(pilotRefresh.gameState),
              neighborhoods: saved.neighborhoods,
              containerState: saved.containerState,
              vehicleState: saved.vehicleState,
              personnelState: saved.personnelState,
              socialPulseState: saved.socialPulseState,
              decisionHistory: saved.decisionHistory,
              dailyGoalRuntime: saved.dailyGoalRuntime,
            }),
          dailyGoalsByDay: saved.dailyGoalsByDay ?? {},
          dailyGoalRuntime: saved.dailyGoalRuntime,
          economyState: saved.economyState,
          personnelState: saved.personnelState,
          containerState: saved.containerState,
          vehicleState: saved.vehicleState,
          socialPulseState: saved.socialPulseState,
          tutorialState: saved.tutorialState ?? { ...INITIAL_TUTORIAL_STATE },
          bestPilotScores: saved.bestPilotScores ?? [],
          lastPilotScore: saved.lastPilotScore,
          lastBudgetDelta: null,
          lastDecisionResult: null,
          _hasHydrated: true,
        };
      },

      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true);
        if (state && (!state.dailyGoalState || state.dailyGoalState.goals.length === 0)) {
          state.ensureDailyGoalsForDay();
        }
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
function resolveMetricsBudget(s: GameStore): number {
  return s.economyState?.currentSource ?? s.gameState.city.budget;
}

export const selectMetrics = (s: GameStore): GameMetrics => ({
  publicSatisfaction: s.gameState.city.publicSatisfaction,
  budget: resolveMetricsBudget(s),
  staffMorale: s.gameState.city.morale,
});

/** Metrikler — shallow compare ile sonsuz render döngüsünü önler. */
export function useGameMetrics(): GameMetrics {
  return useGameStore(
    useShallow((s) => ({
      publicSatisfaction: s.gameState.city.publicSatisfaction,
      budget: resolveMetricsBudget(s),
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
export const selectLastDecisionResult = (s: GameStore) => s.lastDecisionResult;
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
export const selectPilotRun = (s: GameStore) => s.gameState.pilot.run;
export const selectDailyEventSet = (s: GameStore) =>
  s.gameState.pilot.dailyEventSet ?? null;
export const selectPersonnelState = (s: GameStore) => s.personnelState;
export const selectContainerState = (s: GameStore) => s.containerState;
export const selectVehicleStateFromStore = (s: GameStore) => s.vehicleState;
export const selectSocialPulseStateFromStore = (s: GameStore) =>
  s.socialPulseState;

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
