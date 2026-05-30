export type OnboardingScreen =
  | 'hub'
  | 'event_detail'
  | 'decision_result'
  | 'daily_report';

export type OnboardingMoment =
  | 'hub_intro'
  | 'daily_priority_intro'
  | 'daily_goals_intro'
  | 'critical_event_intro'
  | 'event_detail_intro'
  | 'decision_card_intro'
  | 'decision_result_intro'
  | 'live_flow_intro'
  | 'daily_report_intro'
  | 'day2_priority_choice'
  | 'day2_goals_intro'
  | 'butterfly_intro'
  | 'final_day_intro';

export type OnboardingTone = 'info' | 'success' | 'warning' | 'neutral';

export type OnboardingPresentationMode = 'coach' | 'focus' | 'pill';

export type OnboardingHint = {
  id: string;
  moment: OnboardingMoment;
  dayMin: number;
  dayMax?: number;
  screen: OnboardingScreen;
  title: string;
  text: string;
  ctaText?: string;
  tone: OnboardingTone;
  targetKey?: string;
  priority: number;
  dismissible: boolean;
  presentationMode?: OnboardingPresentationMode;
  stepPill?: string;
};

export type OnboardingHubVisibility = {
  showDailyPrioritySelection: boolean;
  showDailyPriorityCompact: boolean;
  showCarryOverStrip: boolean;
  showTodayFlow: boolean;
  showTodayFlowPlaceholder: boolean;
  showStatusCardsRow: boolean;
  showPersonnelStrip: boolean;
  showQuickActionsPanel: boolean;
  muteStatusCards: boolean;
};

export type PilotBriefingStep = {
  title: string;
  line: string;
  iconKey: string;
};

export type PilotBriefingModel = {
  title: string;
  subtitle: string;
  goalLine: string;
  steps: PilotBriefingStep[];
};

export type Day1HubGuidanceModel = {
  showPilotBriefing: boolean;
  pilotProgressLabel: string | null;
  pilotGoalLine: string | null;
};

export type OnboardingWorkflowStepId =
  | 'inspect'
  | 'plan'
  | 'assign'
  | 'field'
  | 'result'
  | 'unknown';

export type WorkflowStepHintModel = {
  visible: boolean;
  text: string;
  compact: boolean;
};

export type FirstEventGuidanceModel = {
  showInspectBanner: boolean;
  inspectHint: string | null;
};

export type FirstResultGuidanceModel = {
  visible: boolean;
  title: string;
  line: string;
};

export type FirstReportGuidanceModel = {
  title: string;
  summaryLines: string[];
  authorityIntroLines: string[];
  hideBadgeBlock: boolean;
  hideScoreCard: boolean;
};

export type OnboardingContextInput = {
  day: number;
  screen: OnboardingScreen;
  pilotActive: boolean;
  tutorialDay1Completed: boolean;
  tutorialSkipped: boolean;
  tutorialActiveStepId: string | null;
  tutorialCompletedStepIds: string[];
  dismissedHintIds: string[];
  dailyPrioritySelected: boolean;
  dailyPrioritySelectionRequired: boolean;
  hasDecisionToday: boolean;
  hasLastDecisionResult: boolean;
  hasDailyReportForToday: boolean;
  dailyGoalCount: number;
  todayFlowLineCount: number;
  legacyCoachOnScreen: boolean;
};
