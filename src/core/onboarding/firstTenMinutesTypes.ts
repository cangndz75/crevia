import type { GameState } from '@/core/models/GameState';

export type FirstTenMinutesStage =
  | 'day1_entry'
  | 'day1_first_event'
  | 'day1_dispatch'
  | 'day1_result'
  | 'day1_report'
  | 'day2_reinforcement'
  | 'day3_unlock_hint'
  | 'normal';

export type FirstTenMinutesVisibility =
  | 'hidden'
  | 'compact'
  | 'featured'
  | 'normal';

export type FirstTenMinutesSurface =
  | 'hub'
  | 'event_plan'
  | 'event_dispatch'
  | 'event_field'
  | 'event_result'
  | 'report'
  | 'map'
  | 'social'
  | 'profile';

export type FirstTenMinutesSystemKey =
  | 'crisis_desk'
  | 'crisis_actions'
  | 'main_operation_season'
  | 'live_micro_decisions'
  | 'post_pilot_preview'
  | 'advanced_assignment_editor'
  | 'advanced_operation_impacts'
  | 'social_deep_dive'
  | 'leaderboard'
  | 'profile_prestige';

export type FirstTenMinutesSurfaceRule = {
  surface: FirstTenMinutesSurface;
  visibility: FirstTenMinutesVisibility;
  reason: string;
  maxPrimaryCards: number;
  allowedCtas: string[];
};

export type FirstTenMinutesGuidanceModel = {
  stage: FirstTenMinutesStage;
  title: string;
  summary: string;
  primaryInstruction: string;
  secondaryNote?: string;
  surfaceRules: FirstTenMinutesSurfaceRule[];
  shouldShowAdvancedSystems: boolean;
};

export type HubCardVisibilityModel = {
  showFirstDayGuide: boolean;
  showOperationSignals: 'hidden' | 'compact' | 'normal';
  showAdvisor: 'hidden' | 'compact' | 'featured' | 'normal';
  showDailyPlan: 'hidden' | 'compact' | 'featured' | 'normal';
  showLiveOperations: boolean;
  showCrisis: boolean;
  showCrisisActions: boolean;
  showMainOperationSeason: boolean;
  showPostPilotPreview: boolean;
  showQuickActions: 'compact' | 'normal';
  showPersonnelStrip: boolean;
  showRegionPulse: boolean;
  showOperationalResources: boolean;
  maxFeaturedCards: number;
};

export type FirstTenMinutesReportGuard = {
  hideCrisis: boolean;
  hideCrisisActions: boolean;
  hideMainOperation: boolean;
  hideMicroDecisions: boolean;
  compactPrimaryImpact: boolean;
  shortAdvisor: boolean;
  hideMetaProgressHeavy: boolean;
  educationalLineCap: number;
};

export type FirstTenMinutesGameContext = {
  gameState: GameState;
  hasDecisionToday?: boolean;
  hasDailyReportForDay?: boolean;
};
