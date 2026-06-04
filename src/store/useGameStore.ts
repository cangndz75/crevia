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
import {
  createDefaultButterflyHookState,
  expireOldButterflyHooks,
  markHookResolvedByEvent,
  normalizeButterflyHookState,
  tryRegisterButterflyHookAfterDecision,
} from '@/core/events/butterflyHookEngine';
import { buildButterflyReportLines } from '@/core/events/butterflyHookPresentation';
import { buildCarryOverSignalsForDay } from '@/core/carryOver/carryOverEngine';
import { buildCarryOverReportLines } from '@/core/carryOver/carryOverPresentation';
import { buildCarryOverEvaluationInput } from '@/core/carryOver/carryOverSelectors';
import type { CarryOverEvaluationInput } from '@/core/carryOver/carryOverTypes';
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
  applyDerivedScopesToPostPilotState,
  createInitialPostPilotOperationState,
  normalizePostPilotOperationState,
} from '@/core/postPilot';

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
import {
  buildMetricSnapshot,
  ensureDailyPriorityForDay,
  evaluateDecisionImpactOnPriority,
  evaluateSocialQuickActionOnPriority,
  finalizeDailyPriority,
  selectDailyPriority as selectDailyPriorityEngine,
} from '@/core/dailyPriority/dailyPriorityEngine';
import { buildDailyPriorityReportResult } from '@/core/dailyPriority/dailyPriorityPresentation';
import type {
  DailyPriorityByDay,
  DailyPriorityKey,
  DailyPriorityState,
} from '@/core/dailyPriority/dailyPriorityTypes';
import { normalizeNeighborhoodId } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
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
import {
  createInitialHubQuickActionState,
  normalizePersistedHubQuickActionState,
  processHubQuickActionForStore,
} from '@/core/hubQuickActions';
import { HUB_QUICK_ACTION_DEFINITIONS } from '@/core/hubQuickActions/hubQuickActionConstants';
import type {
  HubQuickActionId,
  HubQuickActionResult,
  HubQuickActionState,
} from '@/core/hubQuickActions';
import {
  ADVISOR_END_OF_DAY_EXPERIENCE,
} from '@/core/advisors/advisorConstants';
import {
  buildAdvisorContextFromStore,
  buildAssignmentAdvisorInsights,
  buildDailyAdvisorInsights,
  buildEventAdvisorInsights,
} from '@/core/advisors/advisorEngine';
import type { AdvisorInsight, AdvisorState } from '@/core/advisors/advisorTypes';
import {
  applyDailyPlanEffectsToOperationSignals,
  processDailyPlanEndOfDay,
} from '@/core/dailyPlanning/dailyPlanningEngine';
import {
  buildDailyPlanningEngineInputFromStore,
} from '@/core/dailyPlanning/dailyPlanningPresentation';
import {
  confirmDailyOperationsPlan,
  createDefaultSuggestedPlan,
  createInitialDailyOperationsPlan,
  normalizeDailyOperationsPlan,
  refreshDailyOperationsPlanForDay,
  updateDailyOperationsPlanFocus,
} from '@/core/dailyPlanning/dailyPlanningState';
import type { DailyOperationsPlanState } from '@/core/dailyPlanning/dailyPlanningTypes';
import {
  applyAssignmentEffectsToOperationSignals,
  buildDefaultAssignmentForEvent,
  calculateAssignmentCompatibility,
  getAssignmentAdvisorComment,
  processAssignmentsEndOfDay,
} from '@/core/assignments/assignmentEngine';
import { buildAssignmentEngineInputFromGameStore } from '@/core/assignments/assignmentPresentation';
import {
  confirmEventAssignment as confirmEventAssignmentState,
  createInitialAssignmentsState,
  getEventAssignment,
  markEventAssignmentDispatched,
  normalizeAssignmentsState,
  upsertEventAssignment,
} from '@/core/assignments/assignmentState';
import type {
  AssignmentsState,
  EventAssignmentState,
  PersonnelAssignmentType,
  ResponseApproachType,
  VehicleAssignmentType,
} from '@/core/assignments/assignmentTypes';
import {
  applyFullAccessToGameState,
  applyLimitedContinueToGameState,
  buildDevJumpPilotCompletedGameState,
  deriveMonetizationStateFromGameState,
} from '@/core/monetization/monetizationEngine';
import type { IapEntitlementState } from '@/core/iap/iapProductTypes';
import {
  applyIapEntitlementToMonetizationState,
  createInitialMonetizationState,
  markMainOperationOfferSeen,
  mockPurchaseMainOperationPack,
  normalizeMonetizationState,
  restoreMainOperationPlaceholder,
  selectLimitedContinue,
  syncMonetizationAfterPilotComplete,
  syncMonetizationForActivePilot,
} from '@/core/monetization/monetizationState';
import type { MonetizationState } from '@/core/monetization/monetizationTypes';
import {
  buildMainOperationEngineInput,
  processMainOperationEndOfDay,
  syncMainOperationSeasonAfterFullUnlock,
  syncMainOperationSeasonAfterLimitedContinue,
} from '@/core/mainOperation/mainOperationEngine';
import {
  createInitialMainOperationSeasonState,
  normalizeMainOperationSeasonState,
  refreshMainOperationSeasonForDay,
} from '@/core/mainOperation/mainOperationState';
import type { MainOperationSeasonState } from '@/core/mainOperation/mainOperationTypes';
import type { PostPilotEventGenerationContext } from '@/core/postPilot/postPilotEventTypes';
import {
  buildCrisisEngineInput,
  deriveCrisisStateFromGameState,
  processCrisisEndOfDay,
} from '@/core/crisis/crisisEngine';
import {
  addCrisisSignal,
  buildCrisisSignal,
  createInitialCrisisState,
  normalizeCrisisState,
} from '@/core/crisis/crisisState';
import type { CrisisState } from '@/core/crisis/crisisTypes';
import {
  buildMicroDecisionEngineInputFromStore,
  createDevFallbackMicroDecision,
  processMicroDecisionsEndOfDay,
  refreshMicroDecisionsForDay,
} from '@/core/microDecisions/microDecisionEngine';
import {
  createInitialMicroDecisionState,
  resolveMicroDecision as resolveMicroDecisionState,
  skipMicroDecision as skipMicroDecisionState,
} from '@/core/microDecisions/microDecisionState';
import type { MicroDecisionState } from '@/core/microDecisions/microDecisionTypes';
import {
  buildCrisisActionEngineInputFromStore,
  processCrisisActionsEndOfDay,
  refreshCrisisActionsForDay,
  selectCrisisActionByType,
} from '@/core/crisisActions/crisisActionEngine';
import { createInitialCrisisActionState } from '@/core/crisisActions/crisisActionState';
import type {
  CrisisActionState,
  CrisisActionType,
} from '@/core/crisisActions/crisisActionTypes';
import {
  buildOperationalResourceEngineInputFromStore,
  deriveOperationalResourcesFromGameState,
  processOperationalResourcesEndOfDay,
} from '@/core/operationalResources/operationalResourceEngine';
import {
  createInitialOperationalResourcesState,
  refreshOperationalResourcesForDay,
} from '@/core/operationalResources/operationalResourceState';
import type {
  OperationalResourceEngineInput,
  OperationalResourcesState,
} from '@/core/operationalResources/operationalResourceTypes';
import {
  attachAdvisorPredictionAfterInsight,
  evaluateAdvisorPredictionsAgainstSignals,
} from '@/core/advisors/advisorPrediction';
import {
  applyAcknowledgeMissedSignalRewards,
  createInitialAdvisorState,
  grantAdvisorEndOfDayExperience,
  grantAdvisorExperience,
  refreshAdvisorDailyUses,
  spendAdvisorUse,
} from '@/core/advisors/advisorState';
import type { OperationImpactPreview } from '@/core/operations/operationSignalTypes';
import {
  buildOperationImpactPreviewForDecision,
  buildOperationImpactPreviewForEvent,
  buildOperationSignalsEngineInputFromStore,
  deriveOperationSignalsFromGameState,
  processOperationSignalsEndOfDay,
} from '@/core/operations/operationSignalEngine';
import {
  createInitialOperationSignalsState,
  refreshOperationSignalsForDay,
} from '@/core/operations/operationSignalState';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import {
  applyDistrictOperationActionEffects,
  buildDistrictOperationActionCandidates,
  createInitialDistrictOperationActionState,
  selectDistrictOperationAction as selectDistrictOperationActionState,
  type CreviaDistrictOperationAction,
  type CreviaDistrictOperationActionState,
} from '@/core/districtOperationActions';
import {
  applyDailyAuthorityTrustGain,
  calculateDailyAuthorityTrustGain,
} from '@/core/authority/authorityEngine';
import { buildAuthorityDailyGainInput } from '@/core/authority/authoritySelectors';
import {
  buildAuthorityDailySummaryLines,
  buildDay1AuthoritySummaryLines,
} from '@/core/authority/authorityPresentation';
import { normalizeAuthorityState } from '@/core/authority/authoritySeed';
import {
  mergeAuthorityEvaluationIntoDailyReport,
  processPilotCompletionAuthority,
  resolvePilotAuthorityEvaluationScore,
} from '@/core/authority/authorityPilotCompletion';
import {
  processDailyBadgeEvaluation,
  processPilotCompletionBadgeEvaluation,
} from '@/core/badges/badgeEngine';
import { buildDay1BadgeSummaryLines } from '@/core/badges/badgePresentation';
import { buildDailyBadgeEvaluationInput } from '@/core/badges/badgeSelectors';

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
  dailyPriorityState: DailyPriorityState | null;
  dailyPriorityByDay: DailyPriorityByDay;
  dailyGoalRuntime: DailyGoalRuntime;
  economyState: EconomyState;
  personnelState: PersonnelState;
  containerState: ContainerState;
  vehicleState: VehicleState;
  socialPulseState: SocialPulseState;
  hubQuickActionState: HubQuickActionState;
  advisorState: AdvisorState;
  operationSignals: OperationSignalsState;
  dailyOperationsPlan: DailyOperationsPlanState;
  assignments: AssignmentsState;
  monetization: MonetizationState;
  mainOperationSeason: MainOperationSeasonState;
  crisisState: CrisisState;
  crisisActionState: CrisisActionState;
  microDecisionState: MicroDecisionState;
  operationalResources: OperationalResourcesState;
  /** Oturum içi mahalle hamlesi seçimi — persist edilmez. */
  districtOperationActionState: CreviaDistrictOperationActionState;
  tutorialState: TutorialState;
  /** Oturum içi onboarding ipucu kapatmaları — persist edilmez. */
  onboardingDismissedHintIds: string[];
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
  ensureDailyPriorityForDay: (day?: number) => void;
  selectDailyPriority: (priorityKey: DailyPriorityKey) => void;
  clearDailyPriority: () => void;
  useQuickAction: (actionId: string) => void;
  endCurrentDay: () => void;
  askAdvisorForDailySummary: () => AdvisorInsight[];
  askAdvisorForEventHint: (eventId: string) => AdvisorInsight[];
  grantAdvisorExperience: (amount: number, reason: string) => void;
  acknowledgeAdvisorMissedSignal: () => void;
  refreshAdvisorForCurrentDay: () => void;
  refreshOperationSignals: () => void;
  processOperationSignalsForEndOfDay: () => void;
  refreshDailyOperationsPlan: () => void;
  updateDailyOperationsPlan: (
    updates: Partial<
      Pick<
        DailyOperationsPlanState,
        | 'districtFocusId'
        | 'personnelFocus'
        | 'vehicleFocus'
        | 'containerFocus'
      >
    >,
  ) => void;
  confirmDailyOperationsPlan: (
    updates?: Partial<
      Pick<
        DailyOperationsPlanState,
        | 'districtFocusId'
        | 'personnelFocus'
        | 'vehicleFocus'
        | 'containerFocus'
      >
    >,
  ) => void;
  resetDailyOperationsPlanToSuggestion: () => void;
  processDailyOperationsPlanForEndOfDay: () => void;
  refreshAssignmentForEvent: (eventId: string) => void;
  updateEventAssignment: (
    eventId: string,
    patch: Partial<
      Pick<
        EventAssignmentState,
        'personnelType' | 'vehicleType' | 'approachType'
      >
    >,
  ) => void;
  confirmEventAssignment: (
    eventId: string,
    patch?: Partial<
      Pick<
        EventAssignmentState,
        'personnelType' | 'vehicleType' | 'approachType'
      >
    >,
  ) => void;
  markAssignmentDispatched: (eventId: string) => void;
  processAssignmentsForEndOfDay: () => void;
  resetEventAssignmentToDefault: (eventId: string) => void;
  markMainOperationOfferSeen: () => void;
  continueWithLimitedAgenda: () => void;
  mockPurchaseMainOperationPack: () => void;
  applyIapEntitlementToMonetization: (entitlement: IapEntitlementState) => void;
  restoreMainOperationAccessPlaceholder: () => void;
  refreshMainOperationSeason: () => void;
  processMainOperationSeasonForEndOfDay: () => void;
  refreshCrisisState: () => void;
  processCrisisForEndOfDay: () => void;
  refreshMicroDecisionsForCurrentDay: () => void;
  resolveMicroDecision: (decisionId: string, optionId: string) => void;
  skipMicroDecision: (decisionId: string) => void;
  processMicroDecisionsForEndOfDay: () => void;
  refreshCrisisActionForCurrentDay: () => void;
  selectCrisisResolutionAction: (actionType: CrisisActionType) => void;
  processCrisisActionsForEndOfDay: () => void;
  refreshOperationalResources: () => void;
  processOperationalResourcesForEndOfDay: () => void;
  selectDistrictOperationAction: (
    actionId: string,
    districtId?: string,
  ) => { success: boolean; action?: CreviaDistrictOperationAction; message: string };
  devResetOperationalResourcesForTesting?: () => void;
  devGenerateCrisisActionForTesting?: () => void;
  devGenerateMicroDecisionForTesting?: () => void;
  devRaiseCrisisRiskForTesting: () => void;
  devJumpToFullMainOperationForTesting: () => void;
  devJumpToPostPilotOfferForTesting: () => void;
  devJumpToDay8LimitedForTesting: () => void;
  getOperationImpactPreview: (
    eventId: string,
    decisionId?: string,
  ) => OperationImpactPreview | undefined;
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
  markMainOperationPreviewSeen: () => void;
  startLightMainOperation: () => void;
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
  performHubQuickAction: (actionId: HubQuickActionId) => HubQuickActionResult;
  ensureDay1TutorialStarted: () => void;
  advanceTutorial: () => void;
  skipTutorial: () => void;
  dismissOnboardingHint: (hintId: string) => void;
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

function buildStoreCarryOverInput(
  slice: Pick<
    GameStoreState,
    'gameState' | 'dailyPriorityByDay' | 'dailyGoalsByDay' | 'lastDailyReport'
  >,
  day?: number,
): CarryOverEvaluationInput {
  return buildCarryOverEvaluationInput(
    {
      gameState: slice.gameState,
      dailyPriorityByDay: slice.dailyPriorityByDay,
      dailyGoalsByDay: slice.dailyGoalsByDay,
      lastDailyReport: slice.lastDailyReport,
    },
    {
      butterflyHookState: slice.gameState.pilot.butterflyHookState,
      day,
    },
  );
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
  | 'dailyPriorityState'
  | 'dailyPriorityByDay'
  | 'dailyGoalRuntime'
  | 'economyState'
  | 'personnelState'
  | 'containerState'
  | 'vehicleState'
  | 'socialPulseState'
  | 'hubQuickActionState'
  | 'advisorState'
  | 'operationSignals'
  | 'dailyOperationsPlan'
  | 'assignments'
  | 'monetization'
  | 'mainOperationSeason'
  | 'crisisState'
  | 'crisisActionState'
  | 'microDecisionState'
  | 'operationalResources'
  | 'districtOperationActionState'
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
    dailyPriorityState: ensureDailyPriorityForDay({
      day: bundle.gameState.city.day,
      isDay1Tutorial: true,
      featuredEvent: bundle.gameState.events[0],
      metricSnapshot: buildMetricSnapshot({
        gameState: bundle.gameState,
        containerState: createInitialContainerState(bundle.gameState.city.day),
        vehicleState: createInitialVehicleState(bundle.gameState.city.day),
        personnelState: createInitialPersonnelState(),
        socialPulseState: createInitialSocialPulseState(bundle.gameState.city.day),
      }),
    }),
    dailyPriorityByDay: {},
    dailyGoalRuntime: { ...INITIAL_DAILY_GOAL_RUNTIME },
    economyState: createInitialEconomyState(),
    personnelState: createInitialPersonnelState(),
    containerState: createInitialContainerState(bundle.gameState.city.day),
    vehicleState: createInitialVehicleState(bundle.gameState.city.day),
    socialPulseState: createInitialSocialPulseState(bundle.gameState.city.day),
    hubQuickActionState: createInitialHubQuickActionState(
      bundle.gameState.city.day,
    ),
    advisorState: createInitialAdvisorState(bundle.gameState.city.day),
    operationSignals: createInitialOperationSignalsState(bundle.gameState.city.day),
    dailyOperationsPlan: createInitialDailyOperationsPlan(
      bundle.gameState.city.day,
    ),
    assignments: createInitialAssignmentsState(),
    monetization: createInitialMonetizationState(),
    mainOperationSeason: createInitialMainOperationSeasonState(),
    crisisState: createInitialCrisisState(),
    crisisActionState: createInitialCrisisActionState(),
    microDecisionState: createInitialMicroDecisionState(),
    operationalResources: createInitialOperationalResourcesState(
      bundle.gameState.city.day,
    ),
    districtOperationActionState: createInitialDistrictOperationActionState(),
    tutorialState: { ...INITIAL_TUTORIAL_STATE },
    bestPilotScores: [],
    lastPilotScore: undefined,
  };
}

function buildCrisisActionInputFromStore(
  state: GameStoreState,
  overrides?: Partial<ReturnType<typeof buildCrisisActionEngineInputFromStore>>,
) {
  return buildCrisisActionEngineInputFromStore({
    gameState: overrides?.gameState ?? state.gameState,
    monetization: overrides?.monetization ?? state.monetization,
    crisisState: overrides?.crisisState ?? state.crisisState,
    operationSignals: overrides?.operationSignals ?? state.operationSignals,
    assignments: overrides?.assignments ?? state.assignments,
    dailyOperationsPlan:
      overrides?.dailyOperationsPlan ?? state.dailyOperationsPlan,
    mainOperationSeason:
      overrides?.mainOperationSeason ?? state.mainOperationSeason,
    advisorState: overrides?.advisorState ?? state.advisorState,
    crisisActionState: overrides?.crisisActionState ?? state.crisisActionState,
  });
}

function buildOperationalResourceInputFromStore(
  state: GameStoreState,
  overrides?: Partial<OperationalResourceEngineInput>,
): OperationalResourceEngineInput {
  return buildOperationalResourceEngineInputFromStore({
    gameState: overrides?.gameState ?? state.gameState,
    monetization: overrides?.monetization ?? state.monetization,
    operationSignals: overrides?.operationSignals ?? state.operationSignals,
    dailyOperationsPlan:
      overrides?.dailyOperationsPlan ?? state.dailyOperationsPlan,
    assignments: overrides?.assignments ?? state.assignments,
    microDecisionState: overrides?.microDecisionState ?? state.microDecisionState,
    crisisActionState: overrides?.crisisActionState ?? state.crisisActionState,
    operationalResources:
      overrides?.operationalResources ?? state.operationalResources,
  });
}

function buildMicroDecisionInputFromStore(
  state: GameStoreState,
  overrides?: Partial<ReturnType<typeof buildMicroDecisionEngineInputFromStore>>,
) {
  const day = overrides?.day ?? state.gameState.city.day;
  return buildMicroDecisionEngineInputFromStore({
    day,
    gameState: state.gameState,
    monetization: state.monetization,
    operationSignals: state.operationSignals,
    crisisState: state.crisisState,
    dailyOperationsPlan: state.dailyOperationsPlan,
    assignments: state.assignments,
    mainOperationSeason: state.mainOperationSeason,
    advisorState: state.advisorState,
    microDecisionState: state.microDecisionState,
    activeEvents: state.gameState.events,
    ...overrides,
  });
}

function buildDailyPlanningInput(state: GameStoreState) {
  return buildDailyPlanningEngineInputFromStore({
    gameState: state.gameState,
    operationSignals: state.operationSignals,
    advisorState: state.advisorState,
    dailyOperationsPlan: state.dailyOperationsPlan,
    isDay1Tutorial: selectIsDay1TutorialEligible(state as GameStore),
    postPilotLightPhase:
      normalizePostPilotOperationState(state.gameState.pilot.postPilotOperation, {
        pilotStatus: state.gameState.pilot.status,
        currentPilotDay: state.gameState.pilot.currentPilotDay,
      }).phase === 'main_operation_light',
  });
}

function buildAssignmentInput(state: GameStoreState) {
  return buildAssignmentEngineInputFromGameStore(state as GameStore);
}

function buildPostPilotMainOperationContext(
  state: Pick<
    GameStoreState,
    | 'monetization'
    | 'mainOperationSeason'
    | 'crisisState'
    | 'operationSignals'
    | 'assignments'
  >,
): PostPilotEventGenerationContext {
  return {
    monetization: state.monetization,
    mainOperationSeason: state.mainOperationSeason,
    crisisState: state.crisisState,
    operationSignals: state.operationSignals,
    assignments: state.assignments,
  };
}

function buildCrisisEngineInputFromStore(
  state: GameStoreState,
  overrides?: Partial<ReturnType<typeof buildCrisisEngineInput>>,
) {
  return buildCrisisEngineInput({
    gameState: state.gameState,
    monetization: state.monetization,
    crisisState: state.crisisState,
    operationSignals: state.operationSignals,
    assignments: state.assignments,
    dailyOperationsPlan: state.dailyOperationsPlan,
    mainOperationSeason: state.mainOperationSeason,
    ...overrides,
  });
}

function refreshPilotEventsForStore(
  gameState: GameState,
  eventPool: EventCard[],
  storeSlice: Pick<
    GameStoreState,
    | 'monetization'
    | 'mainOperationSeason'
    | 'crisisState'
    | 'operationSignals'
    | 'assignments'
  >,
  options?: Parameters<typeof refreshPilotEventsFromGameState>[2],
) {
  return refreshPilotEventsFromGameState(gameState, eventPool, {
    ...options,
    mainOperationContext: buildPostPilotMainOperationContext(storeSlice),
  });
}

function buildMainOperationEngineInputFromStore(
  state: GameStoreState,
): ReturnType<typeof buildMainOperationEngineInput> {
  return buildMainOperationEngineInput({
    gameState: state.gameState,
    monetization: state.monetization,
    mainOperationSeason: state.mainOperationSeason,
    operationSignals: state.operationSignals,
    assignments: state.assignments,
  });
}

function findStoreEvent(
  state: GameStoreState,
  eventId: string,
): EventCard | undefined {
  return (
    state.gameState.events.find((e) => e.id === eventId) ??
    state.eventPool.find((e) => e.id === eventId)
  );
}

function reconcileEventAssignment(
  state: GameStoreState,
  event: EventCard,
  assignment: EventAssignmentState,
): EventAssignmentState {
  const input = buildAssignmentInput(state);
  const compat = calculateAssignmentCompatibility(input, event, assignment);
  const next: EventAssignmentState = {
    ...assignment,
    compatibilityScore: compat.score,
    compatibilityLabel: compat.label,
    effects: compat.effects,
  };
  return {
    ...next,
    advisorNote: getAssignmentAdvisorComment(input, event, next),
  };
}

function buildOperationSignalsInput(state: GameStoreState): ReturnType<
  typeof buildOperationSignalsEngineInputFromStore
> {
  return buildOperationSignalsEngineInputFromStore({
    gameState: state.gameState,
    personnelState: state.personnelState,
    vehicleState: state.vehicleState,
    containerState: state.containerState,
    decisionHistory: state.decisionHistory,
    operationSignals: state.operationSignals,
    isDay1Tutorial: selectIsDay1TutorialEligible(state as GameStore),
  });
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
    dailyPriorityKey: state.dailyPriorityState?.selectedKey,
  };
}

function bootstrapDailyPriorityState(
  state: GameStoreState,
  day?: number,
): DailyPriorityState {
  const resolvedDay = day ?? state.gameState.city.day;
  const featured =
    state.gameState.events.find(
      (e) => e.id === state.gameState.featuredEventId,
    ) ?? state.gameState.events[0];
  const existing =
    state.dailyPriorityByDay[resolvedDay] ??
    (state.dailyPriorityState?.day === resolvedDay
      ? state.dailyPriorityState
      : null);
  return ensureDailyPriorityForDay({
    day: resolvedDay,
    existing,
    isDay1Tutorial: selectIsDay1TutorialEligible(state as GameStore),
    featuredEvent: featured,
    metricSnapshot: buildMetricSnapshot({
      gameState: state.gameState,
      containerState: state.containerState,
      vehicleState: state.vehicleState,
      personnelState: state.personnelState,
      socialPulseState: state.socialPulseState,
    }),
  });
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
      onboardingDismissedHintIds: [],
      bestPilotScores: [],
      lastPilotScore: undefined,
      lastBudgetDelta: null,
      lastDecisionResult: null,
      districtOperationActionState: createInitialDistrictOperationActionState(),
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

      ensureDailyPriorityForDay: (day) => {
        const current = get();
        const targetDay = day ?? current.gameState.city.day;
        const priorityState = bootstrapDailyPriorityState(current, targetDay);
        const existingForDay = current.dailyPriorityByDay[targetDay];
        if (
          current.dailyPriorityState === priorityState &&
          existingForDay === priorityState
        ) {
          return;
        }
        set({
          dailyPriorityState: priorityState,
          dailyPriorityByDay: {
            ...current.dailyPriorityByDay,
            [targetDay]: priorityState,
          },
        });
      },

      selectDailyPriority: (priorityKey) => {
        const current = get();
        const targetDay = current.gameState.city.day;
        let priorityState = bootstrapDailyPriorityState(current, targetDay);
        if (priorityState.selectedKey) {
          return;
        }
        const snapshot = buildMetricSnapshot({
          gameState: current.gameState,
          containerState: current.containerState,
          vehicleState: current.vehicleState,
          personnelState: current.personnelState,
          socialPulseState: current.socialPulseState,
        });
        priorityState = selectDailyPriorityEngine(
          priorityState,
          priorityKey,
          snapshot,
        );

        const updates: Partial<GameStore> = {
          dailyPriorityState: priorityState,
          dailyPriorityByDay: {
            ...current.dailyPriorityByDay,
            [targetDay]: priorityState,
          },
        };

        const goalsMissing =
          !current.dailyGoalState?.goals.length ||
          current.dailyGoalState.day !== targetDay;
        if (goalsMissing && targetDay > 1) {
          const slice = buildDailyGoalStoreSlice(current, targetDay);
          const goalState = createDailyGoalsForDay({
            day: slice.day,
            gameState: slice.gameState,
            neighborhoods: slice.neighborhoods,
            containerState: slice.containerState,
            vehicleState: slice.vehicleState,
            personnelState: slice.personnelState,
            socialPulseState: slice.socialPulseState,
            isDay1Tutorial: slice.isDay1Tutorial,
            dailyPriorityKey: priorityKey,
          });
          updates.dailyGoalState = goalState;
          updates.dailyGoalsByDay = {
            ...current.dailyGoalsByDay,
            [targetDay]: goalState,
          };
        }

        set(updates);
      },

      clearDailyPriority: () => {
        set({ dailyPriorityState: null, dailyPriorityByDay: {} });
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
        set({
          ...applySeedBundle(createDay1Seed()),
          districtOperationActionState: createInitialDistrictOperationActionState(),
          tutorialState: { ...INITIAL_TUTORIAL_STATE },
          onboardingDismissedHintIds: [],
        });
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
          const hubForDay = normalizePersistedHubQuickActionState(
            current.hubQuickActionState,
            result.decisionRecord.day,
          );
          const personnelResult = processPersonnelAfterDecision(
            {
              personnelState,
              event,
              decision,
              day: result.decisionRecord.day,
              neighborhoods: current.neighborhoods,
              resources: result.nextState.resources ?? current.resources,
              fieldDuty: hubForDay.fieldDuty,
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
            routePreparation: hubForDay.routePreparation,
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
        let dailyPriorityState = bootstrapDailyPriorityState(
          current,
          result.decisionRecord.day,
        );
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

          const priorityEval = evaluateDecisionImpactOnPriority({
            state: dailyPriorityState,
            event,
            decision,
            metricChanges: lastDecisionResult.metricChanges,
            subsystemOutcomes: lastDecisionResult.subsystemOutcomes,
            neighborhoodId: event.neighborhoodId,
          });
          dailyPriorityState = priorityEval.state;
          if (priorityEval.impact) {
            lastDecisionResult = {
              ...lastDecisionResult,
              dailyPriorityImpact: priorityEval.impact,
            };
          }

          let butterflyHookState = normalizeButterflyHookState(
            nextGameState.pilot.butterflyHookState ??
              createDefaultButterflyHookState(),
          );

          if (event.butterflyMeta?.hookId) {
            butterflyHookState = markHookResolvedByEvent(
              butterflyHookState,
              event.butterflyMeta.hookId,
              result.decisionRecord.day,
            );
          } else if (result.decisionRecord.day > 1) {
            const registered = tryRegisterButterflyHookAfterDecision({
              day: result.decisionRecord.day,
              event,
              decision,
              dailyPriorityKey: dailyPriorityState?.selectedKey,
              neighborhoodId: event.neighborhoodId,
              hookState: butterflyHookState,
            });
            butterflyHookState = registered.state;
            if (registered.hint && lastDecisionResult) {
              lastDecisionResult = {
                ...lastDecisionResult,
                butterflyHint: registered.hint,
              };
            }
          }

          nextGameState = withPilot(nextGameState, (pilot) => ({
            ...pilot,
            butterflyHookState,
          }));
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
          dailyPriorityState,
          dailyPriorityByDay: {
            ...current.dailyPriorityByDay,
            [result.decisionRecord.day]: dailyPriorityState,
          },
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

        let dailyPriorityState = bootstrapDailyPriorityState(current, day);
        const pulseDelta =
          result.state.globalPulseScore - current.socialPulseState.globalPulseScore;
        dailyPriorityState = evaluateSocialQuickActionOnPriority(
          dailyPriorityState,
          pulseDelta,
        );

        set({
          socialPulseState: result.state,
          dailyGoalState: quickGoal.dailyGoalState,
          dailyGoalsByDay: {
            ...current.dailyGoalsByDay,
            [quickGoal.dailyGoalState.day]: quickGoal.dailyGoalState,
          },
          playerProgress: quickGoal.playerProgress,
          dailyPriorityState,
          dailyPriorityByDay: {
            ...current.dailyPriorityByDay,
            [day]: dailyPriorityState,
          },
        });
        return result;
      },

      performHubQuickAction: (actionId) => {
        const current = get();
        const currentDay = current.gameState.city.day;
        const def = HUB_QUICK_ACTION_DEFINITIONS[actionId];

        if (currentDay <= 1) {
          const blocked: HubQuickActionResult = {
            actionId,
            title: def.title,
            tone: 'warning',
            resultLine: 'Öğretici günde hızlı hamleler henüz açılmadı.',
            day: currentDay,
          };
          set({
            hubQuickActionState: {
              ...normalizePersistedHubQuickActionState(
                current.hubQuickActionState,
                currentDay,
              ),
              lastResult: blocked,
            },
          });
          return blocked;
        }

        const normalized = normalizePersistedHubQuickActionState(
          current.hubQuickActionState,
          currentDay,
        );
        const output = processHubQuickActionForStore({
          actionId,
          currentDay,
          state: normalized,
          fieldDutyContext:
            actionId === 'field_duty'
              ? {
                  personnelState: current.personnelState,
                  activeEvents: current.gameState.events,
                  neighborhoods: current.neighborhoods,
                  containerState: current.containerState,
                  socialPulseState: current.socialPulseState,
                }
              : undefined,
          routePreparationContext:
            actionId === 'route_preparation'
              ? {
                  activeEvents: current.gameState.events,
                  neighborhoods: current.neighborhoods,
                  vehicleState: current.vehicleState,
                  containerState: current.containerState,
                }
              : undefined,
          neighborhoodPatrolContext:
            actionId === 'neighborhood_patrol'
              ? {
                  activeEvents: current.gameState.events,
                  neighborhoods: current.neighborhoods,
                  containerState: current.containerState,
                  socialPulseState: current.socialPulseState,
                  vehicleState: current.vehicleState,
                }
              : undefined,
          socialResponseContext:
            actionId === 'social_response'
              ? {
                  activeEvents: current.gameState.events,
                  neighborhoods: current.neighborhoods,
                  socialPulseState: current.socialPulseState,
                }
              : undefined,
        });

        const storePatch: {
          hubQuickActionState: HubQuickActionState;
          socialPulseState?: typeof current.socialPulseState;
        } = {
          hubQuickActionState: {
            ...output.state,
            lastResult: output.result,
          },
        };
        if (output.socialPulseState) {
          storePatch.socialPulseState = output.socialPulseState;
        }
        set(storePatch);
        return output.result;
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

      refreshAdvisorForCurrentDay: () => {
        const current = get();
        const day = current.gameState.city.day;
        set({
          advisorState: refreshAdvisorDailyUses(current.advisorState, day),
        });
      },

      refreshOperationSignals: () => {
        const current = get();
        const day = current.gameState.city.day;
        const input = buildOperationSignalsInput(current);
        set({
          operationSignals: refreshOperationSignalsForDay(
            deriveOperationSignalsFromGameState(input),
            day,
          ),
        });
      },

      processOperationSignalsForEndOfDay: () => {
        const current = get();
        const input = buildOperationSignalsInput(current);
        set({
          operationSignals: processOperationSignalsEndOfDay(input),
        });
      },

      refreshDailyOperationsPlan: () => {
        const current = get();
        const day = current.gameState.city.day;
        set({
          dailyOperationsPlan: refreshDailyOperationsPlanForDay(
            current.dailyOperationsPlan,
            day,
            current.operationSignals,
          ),
        });
      },

      updateDailyOperationsPlan: (updates) => {
        const current = get();
        const day = current.gameState.city.day;
        set({
          dailyOperationsPlan: updateDailyOperationsPlanFocus(
            current.dailyOperationsPlan,
            updates,
            day,
          ),
        });
      },

      confirmDailyOperationsPlan: (updates) => {
        const current = get();
        set({
          dailyOperationsPlan: confirmDailyOperationsPlan(
            current.dailyOperationsPlan,
            updates,
          ),
        });
      },

      resetDailyOperationsPlanToSuggestion: () => {
        const current = get();
        const day = current.gameState.city.day;
        set({
          dailyOperationsPlan: createDefaultSuggestedPlan(
            day,
            current.operationSignals,
          ),
        });
      },

      processDailyOperationsPlanForEndOfDay: () => {
        const current = get();
        const closingDay = current.gameState.city.day;
        const planningInput = buildDailyPlanningInput(current);
        const { plan, effects } = processDailyPlanEndOfDay({
          plan: current.dailyOperationsPlan,
          closingDay,
          engineInput: planningInput,
        });
        set({
          dailyOperationsPlan: plan,
          operationSignals: applyDailyPlanEffectsToOperationSignals(
            current.operationSignals,
            effects,
          ),
        });
      },

      refreshAssignmentForEvent: (eventId) => {
        const current = get();
        const event = findStoreEvent(current, eventId);
        if (!event) return;
        const input = buildAssignmentInput(current);
        const existing = getEventAssignment(current.assignments, eventId);
        const day = current.gameState.city.day;
        const base =
          existing ??
          buildDefaultAssignmentForEvent(input, event);
        const next = reconcileEventAssignment(current, event, {
          ...base,
          eventId,
          day,
        });
        set({
          assignments: upsertEventAssignment(current.assignments, next),
        });
      },

      updateEventAssignment: (eventId, patch) => {
        const current = get();
        const event = findStoreEvent(current, eventId);
        if (!event) return;
        const existing = getEventAssignment(current.assignments, eventId);
        if (!existing) {
          get().refreshAssignmentForEvent(eventId);
        }
        const fresh = get();
        const assignment = getEventAssignment(fresh.assignments, eventId);
        if (!assignment || assignment.processedAtDay === fresh.gameState.city.day) {
          return;
        }
        const next = reconcileEventAssignment(fresh, event, {
          ...assignment,
          ...patch,
          status: 'draft',
          source: 'player',
        });
        set({
          assignments: upsertEventAssignment(fresh.assignments, next),
        });
      },

      confirmEventAssignment: (eventId, patch) => {
        const current = get();
        const event = findStoreEvent(current, eventId);
        if (!event) return;
        if (!getEventAssignment(current.assignments, eventId)) {
          get().refreshAssignmentForEvent(eventId);
        }
        const fresh = get();
        const day = fresh.gameState.city.day;
        let assignments = confirmEventAssignmentState(
          fresh.assignments,
          eventId,
          patch ?? {},
          day,
        );
        const assignment = getEventAssignment(assignments, eventId);
        if (assignment) {
          assignments = upsertEventAssignment(
            assignments,
            reconcileEventAssignment(fresh, event, assignment),
          );
        }
        set({ assignments });
      },

      markAssignmentDispatched: (eventId) => {
        const current = get();
        const day = current.gameState.city.day;
        set({
          assignments: markEventAssignmentDispatched(
            current.assignments,
            eventId,
            day,
          ),
        });
      },

      resetEventAssignmentToDefault: (eventId) => {
        const current = get();
        const event = findStoreEvent(current, eventId);
        if (!event) return;
        const input = buildAssignmentInput(current);
        const next = buildDefaultAssignmentForEvent(input, event);
        set({
          assignments: upsertEventAssignment(current.assignments, next),
        });
      },

      markMainOperationOfferSeen: () => {
        const current = get();
        const day = current.gameState.city.day;
        set({
          monetization: markMainOperationOfferSeen(current.monetization, day),
        });
      },

      continueWithLimitedAgenda: () => {
        const current = get();
        const day = Math.max(
          current.gameState.city.day,
          current.gameState.pilot.currentPilotDay,
        );
        let nextGameState = applyLimitedContinueToGameState(current.gameState);
        const nextMonetization = selectLimitedContinue(current.monetization, day);
        const nextSeason = syncMainOperationSeasonAfterLimitedContinue(
          day,
          current.mainOperationSeason,
        );
        const postPilotRefresh = refreshPilotEventsForStore(
          nextGameState,
          current.eventPool,
          {
            ...current,
            monetization: nextMonetization,
            mainOperationSeason: nextSeason,
          },
        );
        set({
          gameState: withSyncedPulse(postPilotRefresh.gameState),
          eventPool: postPilotRefresh.eventPool,
          monetization: nextMonetization,
          mainOperationSeason: nextSeason,
        });
      },

      mockPurchaseMainOperationPack: () => {
        const current = get();
        const day = Math.max(
          current.gameState.city.day,
          current.gameState.pilot.currentPilotDay,
        );
        let nextGameState = applyFullAccessToGameState(current.gameState);
        const nextMonetization = mockPurchaseMainOperationPack(
          current.monetization,
          day,
        );
        const nextSeason = syncMainOperationSeasonAfterFullUnlock(
          nextGameState,
          nextMonetization,
          current.mainOperationSeason,
        );
        const postPilotRefresh = refreshPilotEventsForStore(
          nextGameState,
          current.eventPool,
          {
            ...current,
            monetization: nextMonetization,
            mainOperationSeason: nextSeason,
          },
        );
        set({
          gameState: withSyncedPulse(postPilotRefresh.gameState),
          eventPool: postPilotRefresh.eventPool,
          monetization: nextMonetization,
          mainOperationSeason: nextSeason,
        });
      },

      applyIapEntitlementToMonetization: (entitlement) => {
        const current = get();
        const day = Math.max(
          current.gameState.city.day,
          current.gameState.pilot.currentPilotDay,
        );
        const nextGameState = applyFullAccessToGameState(current.gameState);
        const nextMonetization = applyIapEntitlementToMonetizationState(
          current.monetization,
          entitlement,
          day,
        );
        const nextSeason = syncMainOperationSeasonAfterFullUnlock(
          nextGameState,
          nextMonetization,
          current.mainOperationSeason,
        );
        const postPilotRefresh = refreshPilotEventsForStore(
          nextGameState,
          current.eventPool,
          {
            ...current,
            monetization: nextMonetization,
            mainOperationSeason: nextSeason,
          },
        );
        set({
          gameState: withSyncedPulse(postPilotRefresh.gameState),
          eventPool: postPilotRefresh.eventPool,
          monetization: nextMonetization,
          mainOperationSeason: nextSeason,
        });
      },

      refreshMainOperationSeason: () => {
        const current = get();
        const day = current.gameState.city.day;
        const accessMode =
          current.monetization.mainOperationAccess === 'full'
            ? 'full'
            : current.monetization.mainOperationAccess === 'limited'
              ? 'limited'
              : 'none';
        set({
          mainOperationSeason: refreshMainOperationSeasonForDay(
            normalizeMainOperationSeasonState(
              current.mainOperationSeason,
              day,
              current.monetization,
            ),
            day,
            accessMode,
          ),
        });
      },

      processMainOperationSeasonForEndOfDay: () => {
        const current = get();
        const closingDay = current.gameState.city.day;
        const input = buildMainOperationEngineInputFromStore(current);
        set({
          mainOperationSeason: processMainOperationEndOfDay(input, closingDay),
        });
      },

      refreshCrisisState: () => {
        const current = get();
        set({
          crisisState: deriveCrisisStateFromGameState(
            buildCrisisEngineInputFromStore(current),
          ),
        });
      },

      processCrisisForEndOfDay: () => {
        const current = get();
        const closingDay = current.gameState.city.day;
        set({
          crisisState: processCrisisEndOfDay(
            buildCrisisEngineInputFromStore(current),
            closingDay,
          ),
        });
      },

      refreshMicroDecisionsForCurrentDay: () => {
        const current = get();
        const day = current.gameState.city.day;
        const input = buildMicroDecisionInputFromStore(current);
        set({
          microDecisionState: refreshMicroDecisionsForDay(input),
        });
      },

      resolveMicroDecision: (decisionId, optionId) => {
        const current = get();
        const day = current.gameState.city.day;
        set({
          microDecisionState: resolveMicroDecisionState(
            current.microDecisionState,
            decisionId,
            optionId,
            day,
          ),
        });
      },

      skipMicroDecision: (decisionId) => {
        const current = get();
        const day = current.gameState.city.day;
        set({
          microDecisionState: skipMicroDecisionState(
            current.microDecisionState,
            decisionId,
            day,
          ),
        });
      },

      processMicroDecisionsForEndOfDay: () => {
        const current = get();
        const closingDay = current.gameState.city.day;
        const input = buildMicroDecisionInputFromStore(current);
        const result = processMicroDecisionsEndOfDay(input, closingDay);
        set({
          microDecisionState: result.microDecisionState,
          operationSignals: result.operationSignals,
          crisisState: result.crisisState,
        });
      },

      devGenerateMicroDecisionForTesting: () => {
        if (!__DEV__) return;
        const current = get();
        const day = current.gameState.city.day;
        const input = buildMicroDecisionInputFromStore(current);
        let next = refreshMicroDecisionsForDay(input);
        if (next.activeDecisionIds.length === 0) {
          const fallback = createDevFallbackMicroDecision(day);
          next = {
            ...next,
            decisionsById: { ...next.decisionsById, [fallback.id]: fallback },
            activeDecisionIds: [fallback.id],
          };
        }
        set({ microDecisionState: next });
      },

      refreshCrisisActionForCurrentDay: () => {
        const current = get();
        set({
          crisisActionState: refreshCrisisActionsForDay(
            buildCrisisActionInputFromStore(current),
          ),
        });
      },

      selectCrisisResolutionAction: (actionType) => {
        const current = get();
        set({
          crisisActionState: selectCrisisActionByType(
            current.crisisActionState,
            buildCrisisActionInputFromStore(current),
            actionType,
          ),
        });
      },

      processCrisisActionsForEndOfDay: () => {
        const current = get();
        const closingDay = current.gameState.city.day;
        const input = buildCrisisActionInputFromStore(current);
        if (input.crisisActionState.lastProcessedDay === closingDay) {
          return;
        }
        const result = processCrisisActionsEndOfDay(input, closingDay);
        set({
          crisisActionState: result.crisisActionState,
          operationSignals: result.operationSignals,
          crisisState: result.crisisState,
          ...(result.mainOperationSeason
            ? { mainOperationSeason: result.mainOperationSeason }
            : {}),
        });
      },

      refreshOperationalResources: () => {
        const current = get();
        const day = current.gameState.city.day;
        const input = buildOperationalResourceInputFromStore(current);
        const refreshed = refreshOperationalResourcesForDay(
          input.operationalResources,
          day,
        );
        const derived = deriveOperationalResourcesFromGameState({
          ...input,
          operationalResources: refreshed,
        });
        set({ operationalResources: derived });
      },

      processOperationalResourcesForEndOfDay: () => {
        const current = get();
        const closingDay = current.gameState.city.day;
        const input = buildOperationalResourceInputFromStore(current);
        if (input.operationalResources.lastProcessedDay === closingDay) {
          return;
        }
        const next = processOperationalResourcesEndOfDay(input, closingDay);
        set({ operationalResources: next });
      },

      selectDistrictOperationAction: (actionId, districtId) => {
        const current = get();
        const day = current.gameState.city.day;
        const candidates = buildDistrictOperationActionCandidates({
          day,
          focusDistrictId:
            districtId ?? current.operationSignals.priorityDistrictId,
          rankKey: current.gameState.pilot.authorityState?.formalRankId,
          unlockedPermissionIds:
            current.gameState.pilot.authorityState?.unlockedPermissionIds,
          operationSignals: current.operationSignals,
          resourceFatigue: current.operationalResources,
          crisisState: current.crisisState,
          selectedByDay: current.districtOperationActionState.selectedByDay,
          recentDistrictOperationKeys:
            current.districtOperationActionState.recentDistrictOperationKeys,
        });
        const action = candidates.find((candidate) => candidate.id === actionId);
        if (!action) {
          return {
            success: false,
            message: 'Mahalle hamlesi bulunamadı.',
          };
        }
        const nextActionState = selectDistrictOperationActionState(
          current.districtOperationActionState,
          action,
        );
        if (nextActionState === current.districtOperationActionState) {
          return {
            success: false,
            action,
            message:
              action.status === 'preview_only'
                ? 'Bu hamle şimdilik önizlemede.'
                : 'Bugün için mahalle hamlesi zaten seçildi.',
          };
        }
        set({
          districtOperationActionState: nextActionState,
          operationSignals: applyDistrictOperationActionEffects(
            current.operationSignals,
            action,
          ),
        });
        return {
          success: true,
          action: nextActionState.selectedByDay[day],
          message: 'Mahalle odağı bugünün küçük hamlesi olarak seçildi.',
        };
      },

      devResetOperationalResourcesForTesting: () => {
        if (!__DEV__) return;
        const day = get().gameState.city.day;
        set({
          operationalResources: createInitialOperationalResourcesState(day),
        });
      },

      devGenerateCrisisActionForTesting: () => {
        if (!__DEV__) return;
        const current = get();
        if (current.monetization.mainOperationAccess !== 'full') {
          get().devJumpToFullMainOperationForTesting();
        }
        get().devRaiseCrisisRiskForTesting();
        get().refreshCrisisActionForCurrentDay();
      },

      devRaiseCrisisRiskForTesting: () => {
        if (!__DEV__) {
          return;
        }
        const current = get();
        const base = deriveCrisisStateFromGameState(
          buildCrisisEngineInputFromStore(current),
        );
        if (base.accessMode !== 'active') {
          get().devJumpToFullMainOperationForTesting();
        }
        const after = get();
        const boostedCrisis = addCrisisSignal(
          {
            ...after.crisisState,
            accessMode: 'active',
            cityCrisisScore: 84,
            riskLevel: 'critical',
            trend: 'worsening',
          },
          buildCrisisSignal({
            id: 'dev-crisis-test-signal',
            domain: 'city',
            score: 84,
            trend: 'worsening',
            title: 'Çoklu mahalle baskısı yükseliyor.',
            summary: 'Dev test sinyali — şehir baskısı yükseldi.',
            sourceTags: ['dev', 'crisis'],
          }),
        );
        set({ crisisState: boostedCrisis });
      },

      devJumpToFullMainOperationForTesting: () => {
        if (!__DEV__) {
          return;
        }
        const current = get();
        get().devJumpToPostPilotOfferForTesting();
        get().mockPurchaseMainOperationPack();
        const after = get();
        const day = Math.max(8, after.gameState.city.day);
        set({
          mainOperationSeason: syncMainOperationSeasonAfterFullUnlock(
            after.gameState,
            after.monetization,
            after.mainOperationSeason,
          ),
        });
        const refreshed = refreshPilotEventsForStore(
          get().gameState,
          get().eventPool,
          get(),
        );
        set({
          gameState: withSyncedPulse(refreshed.gameState),
          eventPool: refreshed.eventPool,
        });
      },

      restoreMainOperationAccessPlaceholder: () => {
        const current = get();
        const day = current.gameState.city.day;
        set({
          monetization: restoreMainOperationPlaceholder(
            current.monetization,
            day,
          ),
        });
      },

      devJumpToPostPilotOfferForTesting: () => {
        if (!__DEV__) {
          return;
        }
        const current = get();
        const jumpedGameState = buildDevJumpPilotCompletedGameState(
          current.gameState,
        );
        const postPilotRefresh = refreshPilotEventsForStore(
          jumpedGameState,
          [],
          current,
        );
        const day = postPilotRefresh.gameState.city.day;
        set({
          gameState: withSyncedPulse(
            clearActiveEventsForGameState(postPilotRefresh.gameState),
          ),
          eventPool: postPilotRefresh.eventPool,
          monetization: syncMonetizationAfterPilotComplete(
            createInitialMonetizationState(),
            day,
          ),
          mainOperationSeason: createInitialMainOperationSeasonState(),
          crisisState: createInitialCrisisState(),
          crisisActionState: createInitialCrisisActionState(),
          lastClosedDay: 7,
        });
      },

      devJumpToDay8LimitedForTesting: () => {
        if (!__DEV__) {
          return;
        }
        get().devJumpToPostPilotOfferForTesting();
        get().continueWithLimitedAgenda();
      },

      processAssignmentsForEndOfDay: () => {
        const current = get();
        const closingDay = current.gameState.city.day;
        const input = buildAssignmentInput(current);
        const events = Object.keys(current.assignments.assignmentsByEventId)
          .map((id) => findStoreEvent(current, id))
          .filter((e): e is EventCard => e != null);
        const { state, effects } = processAssignmentsEndOfDay({
          assignments: current.assignments,
          closingDay,
          engineInput: input,
          events,
        });
        set({
          assignments: state,
          operationSignals: applyAssignmentEffectsToOperationSignals(
            current.operationSignals,
            effects,
          ),
        });
      },

      getOperationImpactPreview: (eventId, decisionId) => {
        const current = get();
        const input = buildOperationSignalsInput(current);
        const event =
          current.gameState.events.find((e) => e.id === eventId) ??
          current.eventPool.find((e) => e.id === eventId);
        if (!event) return undefined;
        if (decisionId) {
          const decision = event.decisions.find((d) => d.id === decisionId);
          if (!decision) return undefined;
          return buildOperationImpactPreviewForDecision(input, event, decision);
        }
        return buildOperationImpactPreviewForEvent(input, event);
      },

      grantAdvisorExperience: (amount, reason) => {
        const current = get();
        set({
          advisorState: grantAdvisorExperience(
            current.advisorState,
            amount,
            reason,
          ),
        });
      },

      acknowledgeAdvisorMissedSignal: () => {
        const current = get();
        const day = current.gameState.city.day;
        set({
          advisorState: applyAcknowledgeMissedSignalRewards(
            current.advisorState,
            day,
          ),
        });
      },

      askAdvisorForDailySummary: () => {
        const current = get();
        const day = current.gameState.city.day;
        let advisorState = refreshAdvisorDailyUses(current.advisorState, day);
        if (advisorState.dailyUsesRemaining <= 0) {
          return buildDailyAdvisorInsights(
            buildAdvisorContextFromStore({
              gameState: current.gameState,
              advisorState,
              personnelState: current.personnelState,
              vehicleState: current.vehicleState,
              containerState: current.containerState,
              operationSignals: current.operationSignals,
              dailyOperationsPlan: current.dailyOperationsPlan,
              isDay1Tutorial: selectIsDay1TutorialEligible(current),
            }),
          );
        }
        advisorState = spendAdvisorUse(advisorState);
        advisorState = attachAdvisorPredictionAfterInsight({
          state: advisorState,
          signals: current.operationSignals,
          gameState: current.gameState,
          insightType: 'daily_summary',
        });
        set({ advisorState });
        return buildDailyAdvisorInsights(
          buildAdvisorContextFromStore({
            gameState: current.gameState,
            advisorState,
            personnelState: current.personnelState,
            vehicleState: current.vehicleState,
            containerState: current.containerState,
            operationSignals: current.operationSignals,
            dailyOperationsPlan: current.dailyOperationsPlan,
            isDay1Tutorial: selectIsDay1TutorialEligible(current),
          }),
        );
      },

      askAdvisorForEventHint: (eventId) => {
        const current = get();
        const day = current.gameState.city.day;
        let advisorState = refreshAdvisorDailyUses(current.advisorState, day);
        const event =
          current.gameState.events.find((e) => e.id === eventId) ??
          current.eventPool.find((e) => e.id === eventId);
        const ctx = buildAdvisorContextFromStore({
          gameState: current.gameState,
          advisorState,
          personnelState: current.personnelState,
          vehicleState: current.vehicleState,
          containerState: current.containerState,
          operationSignals: current.operationSignals,
          dailyOperationsPlan: current.dailyOperationsPlan,
          isDay1Tutorial: selectIsDay1TutorialEligible(current),
        });
        if (!event) {
          return buildDailyAdvisorInsights(ctx);
        }
        if (advisorState.dailyUsesRemaining <= 0) {
          return buildEventAdvisorInsights(ctx, event);
        }
        advisorState = spendAdvisorUse(advisorState);
        advisorState = attachAdvisorPredictionAfterInsight({
          state: advisorState,
          signals: current.operationSignals,
          gameState: current.gameState,
          insightType: 'event_plan_hint',
          event,
        });
        set({ advisorState });
        const detailedCtx = buildAdvisorContextFromStore({
          gameState: current.gameState,
          advisorState,
          personnelState: current.personnelState,
          vehicleState: current.vehicleState,
          containerState: current.containerState,
          operationSignals: current.operationSignals,
          dailyOperationsPlan: current.dailyOperationsPlan,
          isDay1Tutorial: selectIsDay1TutorialEligible(current),
        });
        return [
          ...buildEventAdvisorInsights(detailedCtx, event),
          ...buildAssignmentAdvisorInsights(detailedCtx, event),
        ];
      },

      endCurrentDay: () => {
        const current = get();
        const closingDay = current.gameState.city.day;
        const pilotActiveBeforeEnd =
          current.gameState.pilot.status === 'active';

        // --- day pipeline: preflight_guard ---
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

        // --- day pipeline: event_outcome_snapshot ---
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
          {
            enrichMainOperation:
              current.gameState.pilot.postPilotOperation?.phase ===
              'main_operation_full',
          },
        );

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

        let closingPriorityState = bootstrapDailyPriorityState(
          {
            ...current,
            containerState: containerStateAfterNight,
            vehicleState: vehicleStateAfterNight,
            socialPulseState: socialPulseStateAfterNight,
            personnelState: personnelStateAfterNight,
          },
          closingDay,
        );
        const focalNeighborhood =
          normalizeNeighborhoodId(
            current.decisionHistory.find((r) => r.day === closingDay)
              ?.neighborhoodId,
          ) ??
          normalizeNeighborhoodId(current.gameState.events[0]?.neighborhoodId);
        closingPriorityState = finalizeDailyPriority({
          state: closingPriorityState,
          gameState: current.gameState,
          containerState: containerStateAfterNight,
          vehicleState: vehicleStateAfterNight,
          personnelState: personnelStateAfterNight,
          socialPulseState: socialPulseStateAfterNight,
          resolvedEventCount: current.decisionHistory.filter(
            (r) => r.day === closingDay,
          ).length,
          focalNeighborhoodId: focalNeighborhood,
        });

        let closingHookState = expireOldButterflyHooks(
          normalizeButterflyHookState(
            current.gameState.pilot.butterflyHookState ??
              createDefaultButterflyHookState(),
          ),
          closingDay,
        );
        const butterflySummaryLines = buildButterflyReportLines(
          closingHookState.hooks,
          closingDay,
        );

        const dailyGoalsByDayForCarry = {
          ...current.dailyGoalsByDay,
          [closingDay]: closingGoalState,
        };
        const dailyPriorityByDayForCarry = {
          ...current.dailyPriorityByDay,
          [closingDay]: closingPriorityState,
        };
        const carryOverInputForReport = buildStoreCarryOverInput(
          {
            gameState: current.gameState,
            dailyPriorityByDay: dailyPriorityByDayForCarry,
            dailyGoalsByDay: dailyGoalsByDayForCarry,
            lastDailyReport: current.lastDailyReport,
          },
          closingDay,
        );
        const carryOverSummaryLines = buildCarryOverReportLines(
          buildCarryOverSignalsForDay(carryOverInputForReport),
          {
            hideOverlapWhenButterflyReport: butterflySummaryLines.length > 0,
          },
        );

        const metricsBefore = (() => {
          const prevSnapshots = current.snapshots.filter(
            (snapshot) => snapshot.day < closingDay,
          );
          const lastSnapshot = prevSnapshots[prevSnapshots.length - 1];
          if (lastSnapshot?.metrics) {
            return {
              publicSatisfaction: lastSnapshot.metrics.publicSatisfaction,
              staffMorale: lastSnapshot.metrics.staffMorale,
              budget: lastSnapshot.metrics.budget,
            };
          }
          return {
            publicSatisfaction: current.gameState.city.publicSatisfaction,
            staffMorale: current.gameState.city.morale,
            budget: current.gameState.city.budget,
          };
        })();

        // --- day pipeline: authority_badge_process ---
        const closingAuthorityState = normalizeAuthorityState(
          current.gameState.pilot.authorityState,
          closingDay,
        );
        const authorityGainInput = buildAuthorityDailyGainInput({
          day: closingDay,
          dailyEventSet: current.gameState.pilot.dailyEventSet,
          decisionHistory: current.decisionHistory,
          activeEvents: current.gameState.events,
          dailyGoalState: closingGoalState,
          metricsBefore,
          metricsAfter: metricsFromCity(current.gameState.city),
          socialPulseStateBefore: socialPulseStateBeforeNight,
          socialPulseStateAfter: socialPulseStateAfterNight,
          butterflyHookState: closingHookState,
        });
        const authorityDailyGain = calculateDailyAuthorityTrustGain(
          authorityGainInput,
          closingAuthorityState,
        );
        const authorityStateAfterGain = applyDailyAuthorityTrustGain(
          closingAuthorityState,
          authorityDailyGain,
          closingDay,
        );
        const authoritySummaryLines =
          closingDay === 1
            ? buildDay1AuthoritySummaryLines()
            : buildAuthorityDailySummaryLines(
                authorityDailyGain,
                authorityStateAfterGain,
              );

        const dailyBadgeInput = buildDailyBadgeEvaluationInput({
          day: closingDay,
          decisionHistory: current.decisionHistory,
          activeEvents: current.gameState.events,
          eventPool: current.eventPool,
          dailyEventSet: current.gameState.pilot.dailyEventSet,
          dailyGoalState: closingGoalState,
          metricsBefore,
          metricsAfter: metricsFromCity(current.gameState.city),
          socialPulseStateBefore: socialPulseStateBeforeNight,
          socialPulseStateAfter: socialPulseStateAfterNight,
          butterflyHookState: closingHookState,
          containerState: containerStateAfterNight,
          vehicleState: vehicleStateAfterNight,
          personnelState: personnelStateAfterNight,
          hubQuickActionState: current.hubQuickActionState,
          authorityDailyGain,
        });
        const badgeEvaluationResult = processDailyBadgeEvaluation({
          badgeState: current.gameState.pilot.badgeState,
          day: closingDay,
          input: dailyBadgeInput,
        });
        const badgeSummaryLines =
          closingDay === 1
            ? buildDay1BadgeSummaryLines()
            : badgeEvaluationResult.summaryLines;

        // --- day pipeline: report_build (endDay snapshot; domain cards read live slices) ---
        const result = endDay(toEngineState(current), {
          skipEventSelection: skipGenericEventSelection,
          personnelReport,
          containerState: containerStateAfterNight,
          vehicleState: vehicleStateAfterNight,
          socialPulseState: socialPulseStateAfterNight,
          socialPulseStateBefore: socialPulseStateBeforeNight,
          dailyGoalState: closingGoalState,
          dailyPriorityResult: buildDailyPriorityReportResult(closingPriorityState),
          butterflySummaryLines,
          carryOverSummaryLines,
          hubQuickActionState: current.hubQuickActionState,
          authorityDailyGain,
          authoritySummaryLines,
        });

        let nextGameState = withSyncedPulse(result.nextState);
        let nextEventPool = current.eventPool;

        nextGameState = withPilot(nextGameState, (pilot) => ({
          ...pilot,
          butterflyHookState: closingHookState,
          authorityState: authorityStateAfterGain,
          badgeState: badgeEvaluationResult.badgeState,
        }));

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
          dailyPriorityResult:
            result.dailyReport.dailyPriorityResult ??
            buildDailyPriorityReportResult(closingPriorityState) ??
            undefined,
          carryOverSummaryLines:
            result.dailyReport.carryOverSummaryLines ?? carryOverSummaryLines,
          authorityDailyGain:
            result.dailyReport.authorityDailyGain ?? authorityDailyGain,
          authoritySummaryLines:
            result.dailyReport.authoritySummaryLines ?? authoritySummaryLines,
          badgeEvaluation:
            badgeEvaluationResult.snapshot.earnedBadgeIds.length > 0 ||
            badgeEvaluationResult.snapshot.progressLines.length > 0
              ? badgeEvaluationResult.snapshot
              : undefined,
          badgeSummaryLines:
            badgeSummaryLines.length > 0 ? badgeSummaryLines : undefined,
        };

        const dailyGoalsByDay = {
          ...current.dailyGoalsByDay,
          [closingDay]: closingGoalState,
        };

        const dailyPriorityByDay = {
          ...current.dailyPriorityByDay,
          [closingDay]: closingPriorityState,
        };

        // --- day pipeline: post_day_refresh (pilot / post-pilot day advance) ---
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
              dailyPriorityKey: current.dailyPriorityState?.selectedKey,
              carryOverEvaluationInput: buildStoreCarryOverInput(
                {
                  gameState: advancedGameState,
                  dailyPriorityByDay,
                  dailyGoalsByDay,
                  lastDailyReport: dailyReport,
                },
                advancedGameState.city.day,
              ),
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
        } else if (
          nextGameState.pilot.status === 'completed' &&
          normalizePostPilotOperationState(
            nextGameState.pilot.postPilotOperation,
            {
              pilotStatus: 'completed',
              currentPilotDay: nextGameState.pilot.currentPilotDay,
            },
          ).phase === 'main_operation_light'
        ) {
          let postPilotOp = normalizePostPilotOperationState(
            nextGameState.pilot.postPilotOperation,
            {
              pilotStatus: 'completed',
              currentPilotDay: nextGameState.pilot.currentPilotDay,
            },
          );
          postPilotOp = {
            ...postPilotOp,
            operationDay: nextGameState.city.day,
            lastUpdatedDay: nextGameState.city.day,
            postPilotDailyEventSet: undefined,
          };
          postPilotOp = applyDerivedScopesToPostPilotState(postPilotOp, {
            postPilotOperation: postPilotOp,
            pilotStatus: 'completed',
            authorityState: nextGameState.pilot.authorityState,
          });
          nextGameState = withPilot(nextGameState, (pilot) => ({
            ...pilot,
            postPilotOperation: postPilotOp,
          }));
          const postPilotRefresh = refreshPilotEventsForStore(
            nextGameState,
            [],
            current,
          );
          nextGameState = withSyncedPulse(postPilotRefresh.gameState);
          nextEventPool = postPilotRefresh.eventPool;
        }

        const nextDay = nextGameState.city.day;

        // --- day pipeline: advisor_eod_process (experience grant) ---
        let advisorStateAfterDay = grantAdvisorEndOfDayExperience(
          refreshAdvisorDailyUses(current.advisorState, closingDay),
          closingDay,
          ADVISOR_END_OF_DAY_EXPERIENCE,
        );
        advisorStateAfterDay = refreshAdvisorDailyUses(
          advisorStateAfterDay,
          nextDay,
        );

        const closingSignalsInput = buildOperationSignalsEngineInputFromStore({
          gameState: current.gameState,
          personnelState: personnelStateAfterNight,
          vehicleState: vehicleStateAfterNight,
          containerState: containerStateAfterNight,
          decisionHistory: current.decisionHistory,
          operationSignals: current.operationSignals,
          isDay1Tutorial: selectIsDay1TutorialEligible(current),
        });
        // --- day pipeline: operation_signals_base_eod ---
        let operationSignalsAfterDay =
          current.operationSignals.lastProcessedDay === closingDay
            ? current.operationSignals
            : processOperationSignalsEndOfDay(closingSignalsInput);

        const planningInputClosing = buildDailyPlanningInput({
          ...current,
          gameState: current.gameState,
          operationSignals: operationSignalsAfterDay,
        });
        // --- day pipeline: daily_plan_effects ---
        const planProcessed =
          current.dailyOperationsPlan.lastProcessedDay === closingDay
            ? {
                plan: current.dailyOperationsPlan,
                effects: [],
              }
            : processDailyPlanEndOfDay({
                plan: current.dailyOperationsPlan,
                closingDay,
                engineInput: planningInputClosing,
              });
        if (planProcessed.effects.length > 0) {
          operationSignalsAfterDay = applyDailyPlanEffectsToOperationSignals(
            operationSignalsAfterDay,
            planProcessed.effects,
          );
        }

        const assignmentInputClosing = buildAssignmentInput({
          ...current,
          operationSignals: operationSignalsAfterDay,
        });
        const assignmentEvents = Object.keys(current.assignments.assignmentsByEventId)
          .map((id) => findStoreEvent(current, id))
          .filter((e): e is EventCard => e != null);
        // --- day pipeline: assignment_effects ---
        const assignmentProcessed =
          current.assignments.lastProcessedDay === closingDay
            ? { state: current.assignments, effects: [] }
            : processAssignmentsEndOfDay({
                assignments: current.assignments,
                closingDay,
                engineInput: assignmentInputClosing,
                events: assignmentEvents,
              });
        if (assignmentProcessed.effects.length > 0) {
          operationSignalsAfterDay = applyAssignmentEffectsToOperationSignals(
            operationSignalsAfterDay,
            assignmentProcessed.effects,
          );
        }

        const mainOpInput = buildMainOperationEngineInput({
          gameState: current.gameState,
          monetization: current.monetization,
          mainOperationSeason: current.mainOperationSeason,
          operationSignals: operationSignalsAfterDay,
          assignments: assignmentProcessed.state,
        });
        // --- day pipeline: main_operation_season_process ---
        let mainOperationSeasonAfterDay =
          current.mainOperationSeason.lastProcessedDay === closingDay
            ? current.mainOperationSeason
            : processMainOperationEndOfDay(mainOpInput, closingDay);

        const nextSignalsInput = buildOperationSignalsEngineInputFromStore({
          gameState: withSyncedPulse({
            ...nextGameState,
            city: { ...nextGameState.city },
          }),
          personnelState: personnelStateAfterNight,
          vehicleState: vehicleStateAfterNight,
          containerState: containerStateAfterNight,
          decisionHistory: current.decisionHistory,
          operationSignals: operationSignalsAfterDay,
          isDay1Tutorial: selectIsDay1TutorialEligible(current),
        });
        operationSignalsAfterDay = refreshOperationSignalsForDay(
          deriveOperationSignalsFromGameState(nextSignalsInput),
          nextDay,
        );

        // --- day pipeline: micro_decision_effects ---
        const microEodResult = processMicroDecisionsEndOfDay(
          buildMicroDecisionInputFromStore({
            ...current,
            gameState: current.gameState,
            operationSignals: operationSignalsAfterDay,
            crisisState: current.crisisState,
          }),
          closingDay,
        );
        operationSignalsAfterDay = microEodResult.operationSignals;
        let crisisStateBeforeDerive = microEodResult.crisisState;

        // --- day pipeline: crisis_action_effects (before crisis_state_process) ---
        const crisisActionEod = processCrisisActionsEndOfDay(
          buildCrisisActionInputFromStore({
            ...current,
            operationSignals: operationSignalsAfterDay,
            crisisState: crisisStateBeforeDerive,
            mainOperationSeason: mainOperationSeasonAfterDay,
          }),
          closingDay,
        );
        operationSignalsAfterDay = crisisActionEod.operationSignals;
        crisisStateBeforeDerive = crisisActionEod.crisisState;
        mainOperationSeasonAfterDay =
          crisisActionEod.mainOperationSeason ?? mainOperationSeasonAfterDay;

        // --- day pipeline: operational_resources_process ---
        const operationalResourcesAfterDay =
          current.operationalResources.lastProcessedDay === closingDay
            ? current.operationalResources
            : processOperationalResourcesEndOfDay(
                buildOperationalResourceInputFromStore({
                  ...current,
                  operationSignals: operationSignalsAfterDay,
                  crisisActionState: crisisActionEod.crisisActionState,
                  crisisState: crisisStateBeforeDerive,
                  assignments: assignmentProcessed.state,
                  dailyOperationsPlan: planProcessed.plan,
                  microDecisionState: microEodResult.microDecisionState,
                }),
                closingDay,
              );

        const hasCriticalEvent = nextGameState.events.some(
          (e) => e.riskLevel === 'critical' || e.riskLevel === 'high',
        );
        // --- day pipeline: advisor_eod_process (prediction eval) ---
        const predictionEval = evaluateAdvisorPredictionsAgainstSignals({
          state: advisorStateAfterDay,
          signals: operationSignalsAfterDay,
          evalDay: nextDay,
          isDay1Tutorial: selectIsDay1TutorialEligible({
            ...current,
            gameState: nextGameState,
          }),
          hasCriticalEvent,
        });
        advisorStateAfterDay = predictionEval.state;

        // --- day pipeline: post_day_refresh (next-day plan / season) ---
        let dailyPlanAfterDay = refreshDailyOperationsPlanForDay(
          planProcessed.plan,
          nextDay,
          operationSignalsAfterDay,
        );
        dailyPlanAfterDay = createDefaultSuggestedPlan(
          nextDay,
          operationSignalsAfterDay,
        );

        const nextAccessMode =
          current.monetization.mainOperationAccess === 'full'
            ? 'full'
            : current.monetization.mainOperationAccess === 'limited'
              ? 'limited'
              : 'none';
        mainOperationSeasonAfterDay = refreshMainOperationSeasonForDay(
          mainOperationSeasonAfterDay,
          nextDay,
          nextAccessMode,
        );

        const crisisInput = buildCrisisEngineInput({
          gameState: current.gameState,
          monetization: current.monetization,
          crisisState: crisisStateBeforeDerive,
          operationSignals: operationSignalsAfterDay,
          assignments: assignmentProcessed.state,
          dailyOperationsPlan: planProcessed.plan,
          mainOperationSeason: mainOperationSeasonAfterDay,
        });
        // --- day pipeline: crisis_state_process ---
        let crisisStateAfterDay =
          current.crisisState.lastProcessedDay === closingDay
            ? current.crisisState
            : processCrisisEndOfDay(crisisInput, closingDay);
        crisisStateAfterDay = deriveCrisisStateFromGameState({
          ...crisisInput,
          crisisState: crisisStateAfterDay,
        });

        // --- day pipeline: cleanup (refresh / prune next-day slices) ---
        const microStateForNextDay = refreshMicroDecisionsForDay(
          buildMicroDecisionInputFromStore(
            {
              ...current,
              gameState: withSyncedPulse({
                ...nextGameState,
                city: { ...nextGameState.city },
              }),
              operationSignals: operationSignalsAfterDay,
              crisisState: crisisStateAfterDay,
              microDecisionState: microEodResult.microDecisionState,
            },
            { day: nextDay },
          ),
        );

        const crisisActionStateForNextDay = refreshCrisisActionsForDay(
          buildCrisisActionInputFromStore({
            ...current,
            gameState: withSyncedPulse({
              ...nextGameState,
              city: { ...nextGameState.city },
            }),
            operationSignals: operationSignalsAfterDay,
            crisisState: crisisStateAfterDay,
            mainOperationSeason: mainOperationSeasonAfterDay,
            crisisActionState: crisisActionEod.crisisActionState,
          }),
        );

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
          dailyPriorityState: bootstrapDailyPriorityState(
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
          dailyPriorityByDay,
          dailyGoalRuntime: { ...INITIAL_DAILY_GOAL_RUNTIME },
          personnelState: personnelStateAfterNight,
          containerState: containerStateAfterNight,
          vehicleState: vehicleStateAfterNight,
          socialPulseState: socialPulseStateAfterNight,
          hubQuickActionState: createInitialHubQuickActionState(nextDay),
          advisorState: advisorStateAfterDay,
          operationSignals: operationSignalsAfterDay,
          dailyOperationsPlan: dailyPlanAfterDay,
          assignments: assignmentProcessed.state,
          mainOperationSeason: mainOperationSeasonAfterDay,
          crisisState: crisisStateAfterDay,
          crisisActionState: crisisActionStateForNextDay,
          microDecisionState: microStateForNextDay,
          operationalResources: operationalResourcesAfterDay,
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
        const store = get();
        const pilotRefresh = refreshPilotEventsFromGameState(
          withDistrict,
          eventPool,
          {
            containerState,
            vehicleState,
            dailyPriorityKey: store.dailyPriorityState?.selectedKey,
            carryOverEvaluationInput: buildStoreCarryOverInput(store),
          },
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
        const storeBefore = get();
        const pilotRefresh = refreshPilotEventsFromGameState(
          nextGameState,
          eventPool,
          {
            containerState,
            vehicleState,
            dailyPriorityKey: storeBefore.dailyPriorityState?.selectedKey,
            carryOverEvaluationInput: buildStoreCarryOverInput({
              ...storeBefore,
              gameState: nextGameState,
            }),
          },
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
        get().ensureDay1TutorialStarted();
      },

      refreshPilotEventsForCurrentDay: () => {
        const store = get();
        const { gameState, eventPool, containerState, vehicleState } = store;
        const pilotRefresh = refreshPilotEventsFromGameState(
          gameState,
          eventPool,
          {
            containerState,
            vehicleState,
            dailyPriorityKey: store.dailyPriorityState?.selectedKey,
            carryOverEvaluationInput: buildStoreCarryOverInput(store),
          },
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
        const alreadyCompleted = gameState.pilot.status === 'completed';
        const finalMetrics = metricsFromCity(gameState.city);
        const closingDay = gameState.pilot.currentPilotDay;
        const pilotRunId = gameState.pilot.run?.id;

        const pilotScore = resolvePilotAuthorityEvaluationScore({
          finalResult: gameState.pilot.finalResult ?? finalResult,
          lastPilotScore: current.lastPilotScore,
          fallbackScore: finalResult.score,
        });

        const authorityResult = processPilotCompletionAuthority({
          authorityState: gameState.pilot.authorityState,
          evaluationDay: closingDay >= 7 ? 7 : closingDay,
          pilotScore,
          pilotRunId,
          skipIfAlreadyApplied: true,
        });

        const badgePilotResult = processPilotCompletionBadgeEvaluation({
          badgeState: gameState.pilot.badgeState,
          day: closingDay >= 7 ? 7 : closingDay,
          pilotRunId,
          authorityEvaluationStatus: authorityResult.evaluation.evaluationStatus,
          authorityPromoted: authorityResult.evaluation.promoted,
          skipIfAlreadyApplied: true,
        });

        const withCompleted = withPilot(gameState, (pilot) => {
          let run = pilot.run;
          if (run && !alreadyCompleted) {
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
          const postPilotOperation = normalizePostPilotOperationState(
            pilot.postPilotOperation ??
              createInitialPostPilotOperationState({
                pilotStatus: 'completed',
                currentPilotDay: closingDay,
              }),
            { pilotStatus: 'completed', currentPilotDay: closingDay },
          );

          return {
            ...pilot,
            status: 'completed' as const,
            finalResult: pilot.finalResult ?? finalResult,
            run,
            authorityState: authorityResult.authorityState,
            badgeState: badgePilotResult.badgeState,
            postPilotOperation,
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

        const nextDailyReport = mergeAuthorityEvaluationIntoDailyReport(
          current.lastDailyReport,
          authorityResult.evaluation,
          authorityResult.evaluationLines,
        );

        const closingDayForMonetization = Math.max(
          7,
          gameState.pilot.currentPilotDay,
        );

        set({
          gameState: withSyncedPulse(
            clearActiveEventsForGameState(withCompleted),
          ),
          eventPool: [],
          bestPilotScores: leaderboardUpdate.bestPilotScores,
          lastPilotScore: leaderboardUpdate.lastPilotScore,
          monetization: syncMonetizationAfterPilotComplete(
            current.monetization,
            closingDayForMonetization,
          ),
          ...(nextDailyReport ? { lastDailyReport: nextDailyReport } : {}),
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

      markMainOperationPreviewSeen: () => {
        const { gameState } = get();
        if (gameState.pilot.status !== 'completed') {
          return;
        }

        const current = normalizePostPilotOperationState(
          gameState.pilot.postPilotOperation,
          {
            pilotStatus: 'completed',
            currentPilotDay: gameState.pilot.currentPilotDay,
          },
        );

        if (current.phase !== 'pilot_complete_idle') {
          return;
        }

        const next: typeof current = {
          ...current,
          phase: 'preview_seen',
          previewSeenAt: current.previewSeenAt ?? new Date().toISOString(),
          lastUpdatedDay: gameState.pilot.currentPilotDay,
        };

        set({
          gameState: withPilot(gameState, (pilot) => ({
            ...pilot,
            postPilotOperation: next,
          })),
        });
      },

      startLightMainOperation: () => {
        const { gameState, eventPool } = get();
        if (gameState.pilot.status !== 'completed') {
          return;
        }

        const closingDay = gameState.pilot.currentPilotDay;
        let next = normalizePostPilotOperationState(
          gameState.pilot.postPilotOperation,
          { pilotStatus: 'completed', currentPilotDay: closingDay },
        );

        if (next.phase === 'main_operation_light') {
          return;
        }

        const operationDay = Math.max(
          8,
          gameState.city.day,
          closingDay + 1,
        );

        next = {
          ...next,
          phase: 'main_operation_light',
          lightOperationStartedAt:
            next.lightOperationStartedAt ?? new Date().toISOString(),
          lastUpdatedDay: operationDay,
          operationDay,
          postPilotDailyEventSet: undefined,
        };

        next = applyDerivedScopesToPostPilotState(next, {
          postPilotOperation: next,
          pilotStatus: 'completed',
          authorityState: gameState.pilot.authorityState,
        });

        let nextGameState = withPilot(gameState, (pilot) => ({
          ...pilot,
          postPilotOperation: next,
        }));
        nextGameState = {
          ...nextGameState,
          city: {
            ...nextGameState.city,
            day: operationDay,
          },
        };

        const postPilotRefresh = refreshPilotEventsFromGameState(
          nextGameState,
          eventPool,
        );

        set({
          gameState: withSyncedPulse(postPilotRefresh.gameState),
          eventPool: postPilotRefresh.eventPool,
        });
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

      dismissOnboardingHint: (hintId) => {
        const ids = get().onboardingDismissedHintIds;
        if (ids.includes(hintId)) return;
        set({ onboardingDismissedHintIds: [...ids, hintId] });
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

        const hydratedMonetization = deriveMonetizationStateFromGameState(
          withPilotRun,
          normalizeMonetizationState(saved.monetization),
        );
        const hydratedMainOperationSeason = normalizeMainOperationSeasonState(
          saved.mainOperationSeason,
          withPilotRun.city.day,
          hydratedMonetization,
        );
        const hydratedCrisisState = normalizeCrisisState(saved.crisisState);
        const pilotRefresh = refreshPilotEventsForStore(
          withPilotRun,
          saved.eventPool,
          {
            monetization: hydratedMonetization,
            mainOperationSeason: hydratedMainOperationSeason,
            crisisState: hydratedCrisisState,
            operationSignals: saved.operationSignals,
            assignments: saved.assignments,
          },
          {
            containerState: saved.containerState,
            vehicleState: saved.vehicleState,
            dailyPriorityKey: saved.dailyPriorityState?.selectedKey,
            carryOverEvaluationInput: buildStoreCarryOverInput({
              gameState: withPilotRun,
              dailyPriorityByDay: saved.dailyPriorityByDay ?? {},
              dailyGoalsByDay: saved.dailyGoalsByDay ?? {},
              lastDailyReport: saved.lastDailyReport,
            }),
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
          dailyPriorityState:
            saved.dailyPriorityState ??
            bootstrapDailyPriorityState({
              ...currentState,
              gameState: withSyncedPulse(pilotRefresh.gameState),
              neighborhoods: saved.neighborhoods,
              containerState: saved.containerState,
              vehicleState: saved.vehicleState,
              personnelState: saved.personnelState,
              socialPulseState: saved.socialPulseState,
              decisionHistory: saved.decisionHistory,
            }),
          dailyPriorityByDay: saved.dailyPriorityByDay ?? {},
          dailyGoalRuntime: saved.dailyGoalRuntime,
          economyState: saved.economyState,
          personnelState: saved.personnelState,
          containerState: saved.containerState,
          vehicleState: saved.vehicleState,
          socialPulseState: saved.socialPulseState,
          hubQuickActionState: normalizePersistedHubQuickActionState(
            saved.hubQuickActionState,
            withSyncedPulse(pilotRefresh.gameState).city.day,
          ),
          advisorState: refreshAdvisorDailyUses(
            saved.advisorState,
            withSyncedPulse(pilotRefresh.gameState).city.day,
          ),
          operationSignals: saved.operationSignals,
          dailyOperationsPlan: normalizeDailyOperationsPlan(
            saved.dailyOperationsPlan,
            withSyncedPulse(pilotRefresh.gameState).city.day,
            saved.operationSignals.priorityDistrictId,
          ),
          assignments: normalizeAssignmentsState(saved.assignments),
          monetization: hydratedMonetization,
          mainOperationSeason: hydratedMainOperationSeason,
          crisisState: deriveCrisisStateFromGameState(
            buildCrisisEngineInput({
              gameState: withSyncedPulse(pilotRefresh.gameState),
              monetization: hydratedMonetization,
              crisisState: hydratedCrisisState,
              operationSignals: saved.operationSignals,
              assignments: saved.assignments,
              dailyOperationsPlan: normalizeDailyOperationsPlan(
                saved.dailyOperationsPlan,
                withSyncedPulse(pilotRefresh.gameState).city.day,
                saved.operationSignals.priorityDistrictId,
              ),
              mainOperationSeason: hydratedMainOperationSeason,
            }),
          ),
          microDecisionState:
            saved.microDecisionState ?? createInitialMicroDecisionState(),
          crisisActionState:
            saved.crisisActionState ?? createInitialCrisisActionState(),
          operationalResources:
            saved.operationalResources ??
            createInitialOperationalResourcesState(
              withSyncedPulse(pilotRefresh.gameState).city.day,
            ),
          districtOperationActionState: createInitialDistrictOperationActionState(),
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
        if (state) {
          state.ensureDailyPriorityForDay();
          state.ensureDay1TutorialStarted();
          state.refreshAdvisorForCurrentDay();
          state.refreshOperationSignals();
          state.refreshDailyOperationsPlan();
          state.refreshMicroDecisionsForCurrentDay();
          state.refreshCrisisActionForCurrentDay();
          state.refreshOperationalResources();
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

export const selectPostPilotOperation = (s: GameStore) =>
  s.gameState.pilot.postPilotOperation;
export const selectPilotRun = (s: GameStore) => s.gameState.pilot.run;
export const selectDailyEventSet = (s: GameStore) =>
  s.gameState.pilot.dailyEventSet ?? null;
export const selectPersonnelState = (s: GameStore) => s.personnelState;
export const selectContainerState = (s: GameStore) => s.containerState;
export const selectVehicleStateFromStore = (s: GameStore) => s.vehicleState;
export const selectSocialPulseStateFromStore = (s: GameStore) =>
  s.socialPulseState;
export const selectAdvisorState = (s: GameStore) => s.advisorState;
export const selectOperationSignals = (s: GameStore) => s.operationSignals;

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
