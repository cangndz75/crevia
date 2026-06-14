import type { HubQuickActionState } from '@/core/hubQuickActions/hubQuickActionTypes';
import type { CityJournalHubPresentation } from '@/core/cityJournal';
import type { DailyGoalState } from '@/core/dailyGoals/dailyGoalTypes';
import type { HubCardVisibilityModel } from '@/core/onboarding/firstTenMinutesTypes';
import { buildHubCardVisibilityModel } from '@/core/onboarding/firstTenMinutesPresentation';
import {
  buildCenterQuickActions,
  type CenterQuickActions,
} from './centerQuickActionsPresentation';
import type { MainOperationFeelHubPresentation } from '@/core/mainOperationFeel/mainOperationFeelTypes';
import type { GameState } from '@/core/models/GameState';
import type { MonetizationState } from '@/core/monetization/monetizationTypes';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import type { SocialPulseState } from '@/core/social/socialTypes';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskTypes';
import {
  buildCenterActiveTarget,
  type CenterActiveTarget,
} from './centerActiveTargetPresentation';
import {
  buildCenterHeaderSummary,
  type CenterHeaderSummary,
} from './centerHeaderPresentation';
import {
  buildCenterCitySummary,
  type CenterCitySummary,
} from './centerCitySummaryPresentation';
import {
  buildCenterDailyReward,
  type CenterDailyReward,
} from './centerDailyRewardPresentation';
import {
  buildCenterAdvisorSuggestion,
  centerAdvisorDedupeText,
  type CenterAdvisorSuggestion,
} from './centerAdvisorPresentation';
import {
  buildCenterOperationFocus,
  type CenterOperationFocus,
} from './centerOperationFocusPresentation';
import {
  buildCenterOperationSignals,
  type CenterOperationSignals,
} from './centerOperationSignalsPresentation';
import {
  buildCenterRecommendedPlan,
  type CenterRecommendedPlan,
} from './centerRecommendedPlanPresentation';
import {
  buildCenterContinuationCards,
  type CenterContinuationCards,
} from './centerContinuationCardsPresentation';
import {
  buildCenterPortfolioSurface,
  type CenterPortfolioSurfaceModel,
} from './centerDailyCapacityPortfolioPresentation';
import {
  applyCenterVisibilityPolicy,
} from './centerStatePolicy';
import {
  buildMemoryFollowUpPresentationContext,
  type MemoryFollowUpPresentationContext,
} from '@/features/shared/utils/memoryFollowUpPresentationContext';

export { isCenterModuleRenderable } from './centerStatePolicy';

export type CenterHomeHeaderSummary = CenterHeaderSummary;
export type CenterHomeCitySummary = CenterCitySummary;

export const CENTER_HOME_MODULE_ORDER = [
  'header',
  'citySummary',
  'dailyReward',
  'activeTarget',
  'advisorSuggestion',
  'operationFocus',
  'operationSignals',
  'quickActions',
  'recommendedPlan',
  'continuationCards',
] as const;

export type CenterHomeModuleKey = (typeof CENTER_HOME_MODULE_ORDER)[number];

export type CenterHomeVisibilityState =
  | 'visible'
  | 'hidden'
  | 'locked'
  | 'empty'
  | 'completed';

export type { CenterDailyReward as CenterHomeDailyReward } from './centerDailyRewardPresentation';

export type { CenterActiveTarget as CenterHomeActiveTarget } from './centerActiveTargetPresentation';

export type { CenterAdvisorSuggestion as CenterHomeAdvisorSuggestion } from './centerAdvisorPresentation';

export type {
  CenterOperationFocus as CenterHomeOperationFocus,
  CenterOperationFocusItem as CenterHomeOperationFocusItem,
} from './centerOperationFocusPresentation';

export type {
  CenterOperationSignals as CenterHomeOperationSignals,
  CenterOperationSignalItem as CenterHomeOperationSignal,
} from './centerOperationSignalsPresentation';

export type {
  CenterQuickActions as CenterHomeQuickActions,
  CenterQuickActionItem as CenterHomeQuickAction,
} from './centerQuickActionsPresentation';

export type { CenterRecommendedPlan as CenterHomeRecommendedPlan } from './centerRecommendedPlanPresentation';

export type { CenterContinuationCards as CenterHomeContinuationCards } from './centerContinuationCardsPresentation';
export type { CenterContinuationCard as CenterHomeContinuationCard } from './centerContinuationCardsPresentation';
export type { CenterPortfolioSurfaceModel as CenterHomePortfolioSurface } from './centerDailyCapacityPortfolioPresentation';

export type CenterHomeVisibilityFlags = Record<
  CenterHomeModuleKey,
  CenterHomeVisibilityState
>;

export type CenterHomePresentation = {
  moduleOrder: readonly CenterHomeModuleKey[];
  visibilityFlags: CenterHomeVisibilityFlags;
  headerSummary: CenterHomeHeaderSummary;
  citySummary: CenterHomeCitySummary;
  dailyReward: CenterDailyReward;
  activeTarget: CenterActiveTarget;
  advisorSuggestion: CenterAdvisorSuggestion;
  operationFocus: CenterOperationFocus;
  portfolioSurface: CenterPortfolioSurfaceModel;
  operationSignals: CenterOperationSignals;
  quickActions: CenterQuickActions;
  recommendedPlan: CenterRecommendedPlan;
  continuationCards: CenterContinuationCards;
};

export type BuildCenterHomePresentationInput = {
  gameState: GameState;
  monetization?: MonetizationState;
  dailyGoalState?: DailyGoalState | null;
  operationSignals?: OperationSignalsState | null;
  socialPulseState?: SocialPulseState | null;
  hubQuickActionState?: HubQuickActionState | null;
  mainOperationFeelPresentation?: MainOperationFeelHubPresentation | null;
  hubEceContextLine?: string | null;
  hubTomorrowRisk?: TomorrowRiskModel | null;
  hubImpactExplanationLine?: string | null;
  hubCityJournal?: CityJournalHubPresentation | null;
  hubDistrictReportLine?: string | null;
  hubStoryChainLine?: string | null;
  hubVehicleMaintenanceLine?: string | null;
  hubTeamSpecializationLine?: string | null;
  cardVisibility?: HubCardVisibilityModel;
  economySource?: number;
  budgetDeltaLabel?: string | null;
  playerLevel?: number;
  selectedDistrictName?: string;
};


function normalizeLine(value: string | null | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function linesAreDuplicate(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeLine(a);
  const right = normalizeLine(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function resolveDay(gameState: GameState): number {
  if (gameState.pilot.status === 'active') {
    return gameState.pilot.currentPilotDay ?? gameState.city.day;
  }
  return gameState.city.day;
}

function buildHeaderSummary(
  input: BuildCenterHomePresentationInput,
  day: number,
  dailyReward: CenterDailyReward,
): CenterHomeHeaderSummary {
  return buildCenterHeaderSummary({
    gameState: input.gameState,
    day,
    socialPulseState: input.socialPulseState,
    hubTomorrowRisk: input.hubTomorrowRisk,
    operationSignals: input.operationSignals,
    dailyRewardClaimedToday: dailyReward.claimedToday,
    dailyRewardVisible: dailyReward.visibility !== 'hidden',
    economySource: input.economySource,
    budgetDeltaLabel: input.budgetDeltaLabel,
    playerLevel: input.playerLevel,
    selectedDistrictName: input.selectedDistrictName,
  });
}

function buildDailyReward(
  input: BuildCenterHomePresentationInput,
  day: number,
): CenterDailyReward {
  return buildCenterDailyReward({
    gameState: input.gameState,
    day,
    dailyGoalState: input.dailyGoalState,
  });
}

function buildActiveTarget(
  input: BuildCenterHomePresentationInput,
  day: number,
  dailyRewardHelperText?: string | null,
): CenterActiveTarget {
  return buildCenterActiveTarget({
    gameState: input.gameState,
    day,
    dailyGoalState: input.dailyGoalState,
    mainOperationFeelPresentation: input.mainOperationFeelPresentation,
    operationSignals: input.operationSignals,
    hubTomorrowRisk: input.hubTomorrowRisk,
    hubEceContextLine: input.hubEceContextLine,
    hubImpactExplanationLine: input.hubImpactExplanationLine,
    dailyRewardHelperText,
    cardVisibility: input.cardVisibility,
  });
}

function buildAdvisorSuggestion(
  input: BuildCenterHomePresentationInput,
  day: number,
  activeTarget: CenterActiveTarget,
  dailyReward: CenterDailyReward,
  citySummary: CenterCitySummary,
  recommendedPlanBody: string,
  visibility: HubCardVisibilityModel,
  eceStrategyLines?: MemoryFollowUpPresentationContext['eceStrategyLines'],
  followUpActions?: MemoryFollowUpPresentationContext['followUpActions'],
  districtNeglectRecovery?: MemoryFollowUpPresentationContext['districtNeglectRecovery'],
  day8StrategicContent?: MemoryFollowUpPresentationContext['day8StrategicContent'],
  cityRhythmDirector?: MemoryFollowUpPresentationContext['cityRhythmDirector'],
  followUpExecution?: MemoryFollowUpPresentationContext['followUpExecution'],
  dominantStrategyDetector?: MemoryFollowUpPresentationContext['dominantStrategyDetector'],
): CenterAdvisorSuggestion {
  return buildCenterAdvisorSuggestion({
    gameState: input.gameState,
    day,
    activeTarget,
    dailyReward,
    citySummary,
    operationSignals: input.operationSignals,
    hubTomorrowRisk: input.hubTomorrowRisk,
    hubEceContextLine: input.hubEceContextLine,
    hubImpactExplanationLine: input.hubImpactExplanationLine,
    mainOperationFeelPresentation: input.mainOperationFeelPresentation,
    socialPulseState: input.socialPulseState,
    cardVisibility: visibility,
    recommendedPlanBody,
    eceStrategyLines,
    followUpActions,
    districtNeglectRecovery,
    day8StrategicContent,
    cityRhythmDirector,
    followUpExecution,
    dominantStrategyDetector,
  });
}

function buildOperationFocus(
  input: BuildCenterHomePresentationInput,
  day: number,
  activeTarget: CenterActiveTarget,
  advisorSuggestion: CenterAdvisorSuggestion,
  citySummary: CenterCitySummary,
  operationSignalLabels: string[],
  day8OperationFeedBinding?: MemoryFollowUpPresentationContext['day8OperationFeedBinding'],
): CenterOperationFocus {
  return buildCenterOperationFocus({
    gameState: input.gameState,
    day,
    activeTarget,
    advisorSuggestion,
    citySummary,
    operationSignals: input.operationSignals,
    socialPulseState: input.socialPulseState,
    mainOperationFeelPresentation: input.mainOperationFeelPresentation,
    operationSignalLabels,
    hubVehicleMaintenanceLine: input.hubVehicleMaintenanceLine,
    day8OperationFeedBinding,
  });
}

function buildOperationSignalsSection(
  input: BuildCenterHomePresentationInput,
  day: number,
  activeTarget: CenterActiveTarget,
  advisorSuggestion: CenterAdvisorSuggestion,
  citySummary: CenterCitySummary,
  dailyReward: CenterDailyReward,
  headerSummary: CenterHeaderSummary,
  visibility: HubCardVisibilityModel,
  day8OperationFeedBinding?: MemoryFollowUpPresentationContext['day8OperationFeedBinding'],
  operationFocus?: CenterOperationFocus,
): CenterOperationSignals {
  return buildCenterOperationSignals({
    gameState: input.gameState,
    day,
    activeTarget,
    advisorSuggestion,
    citySummary,
    dailyReward,
    headerSummary,
    operationSignals: input.operationSignals,
    socialPulseState: input.socialPulseState,
    hubTomorrowRisk: input.hubTomorrowRisk,
    hubImpactExplanationLine: input.hubImpactExplanationLine,
    hubVehicleMaintenanceLine: input.hubVehicleMaintenanceLine,
    hubTeamSpecializationLine: input.hubTeamSpecializationLine,
    operationFocusTitles: operationFocus?.items.map((item) => item.title) ?? [],
    operationFocusSubtitles: operationFocus?.items
      .map((item) => item.subtitle)
      .filter((subtitle): subtitle is string => Boolean(subtitle?.trim())),
    day8OperationFeedBinding,
    cardVisibility: visibility,
  });
}

function buildQuickActionsSection(
  input: BuildCenterHomePresentationInput,
  day: number,
  activeTarget: CenterActiveTarget,
  advisorSuggestion: CenterAdvisorSuggestion,
  headerSummary: CenterHeaderSummary,
  operationSignalItems: CenterOperationSignals['signals'],
  visibility: HubCardVisibilityModel,
): CenterQuickActions {
  return buildCenterQuickActions({
    gameState: input.gameState,
    day,
    activeTarget,
    advisorSuggestion,
    headerSummary,
    operationSignals: input.operationSignals,
    operationSignalItems,
    hubQuickActionState: input.hubQuickActionState,
    cardVisibility: visibility,
  });
}

function buildRecommendedPlanSection(
  input: BuildCenterHomePresentationInput,
  day: number,
  activeTarget: CenterActiveTarget,
  visibility: HubCardVisibilityModel,
  options?: {
    advisorSuggestion?: CenterAdvisorSuggestion;
    operationSignalItems?: CenterOperationSignals['signals'];
    operationFocus?: CenterOperationFocus;
    citySummary?: CenterCitySummary;
    dailyReward?: CenterDailyReward;
    headerSummary?: CenterHeaderSummary;
  },
): CenterRecommendedPlan {
  return buildCenterRecommendedPlan({
    gameState: input.gameState,
    day,
    activeTarget,
    advisorSuggestion: options?.advisorSuggestion,
    operationSignalItems: options?.operationSignalItems,
    operationFocus: options?.operationFocus,
    citySummary: options?.citySummary,
    dailyReward: options?.dailyReward,
    headerSummary: options?.headerSummary,
    hubCityJournal: input.hubCityJournal,
    hubDistrictReportLine: input.hubDistrictReportLine,
    hubStoryChainLine: input.hubStoryChainLine,
    hubImpactExplanationLine: input.hubImpactExplanationLine,
    hubTomorrowRisk: input.hubTomorrowRisk,
    cardVisibility: visibility,
  });
}

function buildContinuationCardsSection(
  input: BuildCenterHomePresentationInput,
  day: number,
  context: {
    activeTarget: CenterActiveTarget;
    advisorSuggestion: CenterAdvisorSuggestion;
    operationSignalItems: CenterOperationSignals['signals'];
    quickActions: CenterQuickActions;
    recommendedPlan: CenterRecommendedPlan;
    citySummary: CenterCitySummary;
    dailyReward: CenterDailyReward;
    headerSummary: CenterHeaderSummary;
    memoryFollowUp?: MemoryFollowUpPresentationContext;
  },
): CenterContinuationCards {
  return buildCenterContinuationCards({
    gameState: input.gameState,
    day,
    activeTarget: context.activeTarget,
    advisorSuggestion: context.advisorSuggestion,
    operationSignalItems: context.operationSignalItems,
    quickActions: context.quickActions,
    recommendedPlan: context.recommendedPlan,
    citySummary: context.citySummary,
    dailyReward: context.dailyReward,
    headerSummary: context.headerSummary,
    hubCityJournal: input.hubCityJournal,
    hubDistrictReportLine: input.hubDistrictReportLine,
    hubStoryChainLine: input.hubStoryChainLine,
    hubImpactExplanationLine: input.hubImpactExplanationLine,
    hubVehicleMaintenanceLine: input.hubVehicleMaintenanceLine,
    hubTeamSpecializationLine: input.hubTeamSpecializationLine,
    oneMoreDayRetention: context.memoryFollowUp?.oneMoreDayRetention,
    eceStrategyLines: context.memoryFollowUp?.eceStrategyLines,
    cityMemoryVisibility: context.memoryFollowUp?.cityMemoryVisibility,
    followUpActions: context.memoryFollowUp?.followUpActions,
    followUpExecution: context.memoryFollowUp?.followUpExecution,
    dominantStrategyDetector: context.memoryFollowUp?.dominantStrategyDetector,
    districtNeglectRecovery: context.memoryFollowUp?.districtNeglectRecovery,
    day8StrategicContent: context.memoryFollowUp?.day8StrategicContent,
    cityRhythmDirector: context.memoryFollowUp?.cityRhythmDirector,
  });
}

function buildPortfolioSurfaceSection(
  input: BuildCenterHomePresentationInput,
  day: number,
  context: {
    operationFocus: CenterOperationFocus;
    operationSignals: CenterOperationSignals;
    recommendedPlanBody: string;
    memoryFollowUp?: MemoryFollowUpPresentationContext;
  },
): CenterPortfolioSurfaceModel {
  return buildCenterPortfolioSurface({
    gameState: input.gameState,
    day,
    operationSignals: input.operationSignals,
    socialPulseState: input.socialPulseState,
    hubTomorrowRisk: input.hubTomorrowRisk,
    hubVehicleMaintenanceLine: input.hubVehicleMaintenanceLine,
    hubTeamSpecializationLine: input.hubTeamSpecializationLine,
    operationFocus: context.operationFocus,
    operationSignalsSection: context.operationSignals,
    recommendedPlanBody: context.recommendedPlanBody,
    resourcePressureDifferentiation: context.memoryFollowUp?.resourcePressureDifferentiation,
  });
}

function buildVisibilityFlags(
  sections: Omit<CenterHomePresentation, 'moduleOrder' | 'visibilityFlags'>,
  day: number,
): CenterHomeVisibilityFlags {
  const raw: CenterHomeVisibilityFlags = {
    header: 'visible',
    citySummary: 'visible',
    dailyReward: sections.dailyReward.visibility,
    activeTarget: sections.activeTarget.visibility,
    advisorSuggestion: sections.advisorSuggestion.visibility,
    operationFocus: sections.operationFocus.visibility,
    operationSignals: sections.operationSignals.visibility,
    quickActions: sections.quickActions.visibility,
    recommendedPlan: sections.recommendedPlan.visibility,
    continuationCards: sections.continuationCards.visibility,
  };

  return applyCenterVisibilityPolicy(raw, sections, day);
}

export function buildCenterHomePresentation(
  input: BuildCenterHomePresentationInput,
): CenterHomePresentation {
  const day = resolveDay(input.gameState);
  const visibility =
    input.cardVisibility ??
    buildHubCardVisibilityModel(input.gameState, input.monetization);

  const dailyReward = buildDailyReward(input, day);
  const activeTarget = buildActiveTarget(input, day, dailyReward.helperText);
  const headerSummary = buildHeaderSummary(input, day, dailyReward);

  const citySummaryForAdvisor = buildCenterCitySummary({
    gameState: input.gameState,
    day,
    socialPulseState: input.socialPulseState,
    operationSignals: input.operationSignals,
    dailyGoalState: input.dailyGoalState,
    hubTomorrowRisk: input.hubTomorrowRisk,
    activeTargetTitle: activeTarget.title,
    headerSummary,
  });

  const recommendedPlanDraft = buildRecommendedPlanSection(
    input,
    day,
    activeTarget,
    visibility,
    { dailyReward, headerSummary },
  );

  const memoryFollowUpContext = buildMemoryFollowUpPresentationContext({
    day,
    gameState: input.gameState,
    operationSignals: input.operationSignals,
    socialPulseState: input.socialPulseState,
    hubTomorrowRisk: input.hubTomorrowRisk,
    hubImpactExplanationLine: input.hubImpactExplanationLine,
    hubCityJournal: input.hubCityJournal,
    hubDistrictReportLine: input.hubDistrictReportLine,
    hubStoryChainLine: input.hubStoryChainLine,
    hubVehicleMaintenanceLine: input.hubVehicleMaintenanceLine,
    hubTeamSpecializationLine: input.hubTeamSpecializationLine,
  });

  const advisorSuggestion = buildAdvisorSuggestion(
    input,
    day,
    activeTarget,
    dailyReward,
    citySummaryForAdvisor,
    recommendedPlanDraft.body,
    visibility,
    memoryFollowUpContext.eceStrategyLines,
    memoryFollowUpContext.followUpActions,
    memoryFollowUpContext.districtNeglectRecovery,
    memoryFollowUpContext.day8StrategicContent,
    memoryFollowUpContext.cityRhythmDirector,
    memoryFollowUpContext.followUpExecution,
    memoryFollowUpContext.dominantStrategyDetector,
  );

  const operationFocus = buildOperationFocus(
    input,
    day,
    activeTarget,
    advisorSuggestion,
    citySummaryForAdvisor,
    [],
    memoryFollowUpContext.day8OperationFeedBinding,
  );

  const operationSignals = buildOperationSignalsSection(
    input,
    day,
    activeTarget,
    advisorSuggestion,
    citySummaryForAdvisor,
    dailyReward,
    headerSummary,
    visibility,
    memoryFollowUpContext.day8OperationFeedBinding,
    operationFocus,
  );

  const citySummary = buildCenterCitySummary({
    gameState: input.gameState,
    day,
    socialPulseState: input.socialPulseState,
    operationSignals: input.operationSignals,
    dailyGoalState: input.dailyGoalState,
    hubTomorrowRisk: input.hubTomorrowRisk,
    activeTargetTitle: activeTarget.title,
    advisorCommentary: centerAdvisorDedupeText(advisorSuggestion),
    headerSummary,
  });
  const recommendedPlanFinal = buildRecommendedPlanSection(
    input,
    day,
    activeTarget,
    visibility,
    {
      advisorSuggestion,
      operationSignalItems: operationSignals.signals,
      operationFocus,
      citySummary,
      dailyReward,
      headerSummary,
    },
  );
  const portfolioSurface = buildPortfolioSurfaceSection(input, day, {
    operationFocus,
    operationSignals,
    recommendedPlanBody: recommendedPlanFinal.body,
    memoryFollowUp: memoryFollowUpContext,
  });

  const quickActions = buildQuickActionsSection(
    input,
    day,
    activeTarget,
    advisorSuggestion,
    headerSummary,
    operationSignals.signals,
    visibility,
  );

  const sections = {
    headerSummary,
    citySummary,
    dailyReward,
    activeTarget,
    advisorSuggestion,
    operationFocus,
    portfolioSurface,
    operationSignals,
    quickActions,
    recommendedPlan: recommendedPlanFinal,
    continuationCards: buildContinuationCardsSection(input, day, {
      activeTarget,
      advisorSuggestion,
      operationSignalItems: operationSignals.signals,
      quickActions,
      recommendedPlan: recommendedPlanFinal,
      citySummary,
      dailyReward,
      headerSummary,
      memoryFollowUp: memoryFollowUpContext,
    }),
  };

  return {
    moduleOrder: CENTER_HOME_MODULE_ORDER,
    visibilityFlags: buildVisibilityFlags(sections, day),
    ...sections,
  };
}

export function centerHomeHasDuplicateModuleKeys(
  presentation: CenterHomePresentation,
): boolean {
  const keys = new Set(presentation.moduleOrder);
  return keys.size !== presentation.moduleOrder.length;
}

export function centerHomeAdvisorAndPlanShareText(
  presentation: CenterHomePresentation,
): boolean {
  return linesAreDuplicate(
    presentation.advisorSuggestion.recommendation,
    presentation.recommendedPlan.body,
  );
}
