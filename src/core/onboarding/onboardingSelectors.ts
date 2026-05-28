import { isDailyPrioritySelectionRequired } from '@/core/dailyPriority/dailyPrioritySelectors';
import { getTutorialStepById } from '@/features/tutorial/tutorialSteps';
import type { TutorialScreen, TutorialState } from '@/features/tutorial/tutorialTypes';
import type { GameStore } from '@/store/useGameStore';

import {
  LEGACY_TUTORIAL_STEP_BY_MOMENT,
  ONBOARDING_HINTS,
  ONBOARDING_MAX_HINT_TEXT_LENGTH,
} from './onboardingPresentation';
import type {
  OnboardingContextInput,
  OnboardingHint,
  OnboardingHubVisibility,
  OnboardingMoment,
  OnboardingScreen,
} from './onboardingTypes';

export function isOnboardingHintDismissed(
  dismissedIds: string[] | undefined,
  hintId: string,
): boolean {
  return (dismissedIds ?? []).includes(hintId);
}

export function isOnboardingHintTextValid(hint: OnboardingHint): boolean {
  return (
    hint.title.trim().length > 0 &&
    hint.text.trim().length > 0 &&
    hint.text.length <= ONBOARDING_MAX_HINT_TEXT_LENGTH
  );
}

export function selectLegacyCoachOnScreen(
  tutorialState: TutorialState,
  screen: OnboardingScreen,
): boolean {
  if (!tutorialState.activeStepId) return false;
  const step = getTutorialStepById(tutorialState.activeStepId);
  if (!step) return false;
  return step.screen === (screen as TutorialScreen);
}

export function buildOnboardingContext(
  input: OnboardingContextInput,
): OnboardingContextInput {
  return input;
}

export function selectOnboardingHubVisibility(
  day: number,
  isDay1TutorialEligible: boolean,
  hasDecisionToday: boolean,
): OnboardingHubVisibility {
  if (day <= 1 || isDay1TutorialEligible) {
    return {
      showDailyPrioritySelection: false,
      showDailyPriorityCompact: true,
      showCarryOverStrip: false,
      showTodayFlow: hasDecisionToday,
      showTodayFlowPlaceholder: !hasDecisionToday,
      showStatusCardsRow: false,
      showPersonnelStrip: day > 1,
      showQuickActionsPanel: true,
      muteStatusCards: true,
    };
  }

  if (day === 2) {
    return {
      showDailyPrioritySelection: true,
      showDailyPriorityCompact: false,
      showCarryOverStrip: false,
      showTodayFlow: true,
      showTodayFlowPlaceholder: false,
      showStatusCardsRow: true,
      showPersonnelStrip: true,
      showQuickActionsPanel: true,
      muteStatusCards: true,
    };
  }

  return {
    showDailyPrioritySelection: true,
    showDailyPriorityCompact: false,
    showCarryOverStrip: true,
    showTodayFlow: true,
    showTodayFlowPlaceholder: false,
    showStatusCardsRow: true,
    showPersonnelStrip: true,
    showQuickActionsPanel: true,
    muteStatusCards: false,
  };
}

function conflictsWithLegacyTutorial(
  hint: OnboardingHint,
  ctx: OnboardingContextInput,
): boolean {
  if (!ctx.legacyCoachOnScreen) return false;
  if (hint.presentationMode === 'coach') return true;
  const legacyStep = LEGACY_TUTORIAL_STEP_BY_MOMENT[hint.moment];
  if (!legacyStep) return true;
  return ctx.tutorialActiveStepId !== legacyStep;
}

function shouldShowMoment(
  moment: OnboardingMoment,
  ctx: OnboardingContextInput,
): boolean {
  const { day } = ctx;

  switch (moment) {
    case 'hub_intro':
      return (
        day === 1 &&
        !ctx.hasDecisionToday &&
        !ctx.tutorialDay1Completed &&
        !ctx.tutorialSkipped
      );
    case 'critical_event_intro':
      return day === 1 && !ctx.hasDecisionToday;
    case 'event_detail_intro':
      return day === 1 && !ctx.hasDecisionToday;
    case 'decision_card_intro':
      return day === 1;
    case 'decision_result_intro':
      return day === 1 && ctx.hasLastDecisionResult;
    case 'live_flow_intro':
      return day === 1 && ctx.hasDecisionToday;
    case 'daily_report_intro':
      return day === 1 && ctx.hasDailyReportForToday;
    case 'day2_priority_choice':
      return day === 2 && ctx.dailyPrioritySelectionRequired;
    case 'day2_goals_intro':
      return day === 2 && ctx.dailyPrioritySelected && ctx.dailyGoalCount > 0;
    case 'daily_priority_intro':
    case 'daily_goals_intro':
    case 'butterfly_intro':
    case 'final_day_intro':
      return false;
    default: {
      const _exhaustive: never = moment;
      return _exhaustive;
    }
  }
}

function toMutableOnboardingHint(
  hint: (typeof ONBOARDING_HINTS)[number],
): OnboardingHint {
  return { ...hint };
}

export function selectEligibleOnboardingHints(
  ctx: OnboardingContextInput,
): OnboardingHint[] {
  return ONBOARDING_HINTS.filter((hint) => {
    if (hint.screen !== ctx.screen) return false;
    if (ctx.day < hint.dayMin) return false;
    if (hint.dayMax != null && ctx.day > hint.dayMax) return false;
    if (!shouldShowMoment(hint.moment, ctx)) return false;
    if (isOnboardingHintDismissed(ctx.dismissedHintIds, hint.id)) return false;
    if (conflictsWithLegacyTutorial(hint, ctx)) return false;
    return true;
  })
    .map(toMutableOnboardingHint)
    .sort((a, b) => a.priority - b.priority);
}

export function selectActiveOnboardingHint(
  ctx: OnboardingContextInput,
): OnboardingHint | null {
  const eligible = selectEligibleOnboardingHints(ctx);
  if (eligible.length === 0) return null;

  const coach = eligible.find((h) => h.presentationMode === 'coach');
  if (coach && !ctx.legacyCoachOnScreen) return coach;

  return eligible[0] ?? null;
}

export function selectOnboardingFocusHint(
  ctx: OnboardingContextInput,
  targetKey?: string,
): OnboardingHint | null {
  const eligible = selectEligibleOnboardingHints(ctx).filter(
    (h) => h.presentationMode === 'focus' || h.presentationMode == null,
  );
  if (targetKey) {
    const match = eligible.find((h) => h.targetKey === targetKey);
    if (match) return match;
  }
  return eligible.find((h) => !h.presentationMode || h.presentationMode === 'focus') ?? null;
}

export function selectOnboardingFocusHintByMoment(
  ctx: OnboardingContextInput,
  moment: OnboardingMoment,
): OnboardingHint | null {
  return (
    selectEligibleOnboardingHints(ctx).find(
      (h) =>
        h.moment === moment &&
        (h.presentationMode === 'focus' || h.presentationMode == null),
    ) ?? null
  );
}

export function selectOnboardingCoachHint(
  ctx: OnboardingContextInput,
): OnboardingHint | null {
  if (ctx.legacyCoachOnScreen) return null;
  const hint = selectActiveOnboardingHint(ctx);
  if (!hint || hint.presentationMode === 'focus') {
    return selectEligibleOnboardingHints(ctx).find(
      (h) => h.presentationMode === 'coach',
    ) ?? null;
  }
  return hint.presentationMode === 'coach' ? hint : null;
}

export function countOnboardingHintsForDay(day: number): number {
  return ONBOARDING_HINTS.filter(
    (h) => h.dayMin <= day && (h.dayMax == null || h.dayMax >= day),
  ).length;
}

export type OnboardingStoreSlice = Pick<
  GameStore,
  | 'gameState'
  | 'tutorialState'
  | 'dailyPriorityState'
  | 'dailyGoalState'
  | 'lastDecisionResult'
  | 'lastDailyReport'
  | 'decisionHistory'
  | 'onboardingDismissedHintIds'
>;

/** tutorialSelectors ile aynı kurallar — dar slice için GameStore cast gerekmez. */
function isDay1TutorialEligibleSlice(s: OnboardingStoreSlice): boolean {
  if (s.tutorialState.day1Completed || s.tutorialState.skipped) {
    return false;
  }
  if (s.gameState.pilot.status !== 'active') {
    return false;
  }
  const day = s.gameState.pilot.currentPilotDay ?? s.gameState.city.day;
  return day === 1;
}

function isDay1TutorialActiveSlice(s: OnboardingStoreSlice): boolean {
  return isDay1TutorialEligibleSlice(s) && s.tutorialState.activeStepId != null;
}

export function buildOnboardingContextFromStore(
  s: OnboardingStoreSlice,
  screen: OnboardingScreen,
): OnboardingContextInput {
  const day = s.gameState.pilot.currentPilotDay ?? s.gameState.city.day;
  const isDay1Eligible = isDay1TutorialEligibleSlice(s);
  const isDay1Active = isDay1TutorialActiveSlice(s);
  const hasDecisionToday = s.decisionHistory.some((r) => r.day === day);
  const dailyPrioritySelectionRequired = isDailyPrioritySelectionRequired(
    s.dailyPriorityState,
    day,
    isDay1Active || isDay1Eligible,
  );

  return {
    day,
    screen,
    pilotActive: s.gameState.pilot.status === 'active',
    tutorialDay1Completed: s.tutorialState.day1Completed,
    tutorialSkipped: s.tutorialState.skipped,
    tutorialActiveStepId: s.tutorialState.activeStepId,
    tutorialCompletedStepIds: s.tutorialState.completedStepIds,
    dismissedHintIds: s.onboardingDismissedHintIds ?? [],
    dailyPrioritySelected: !!s.dailyPriorityState?.selectedKey,
    dailyPrioritySelectionRequired,
    hasDecisionToday,
    hasLastDecisionResult: s.lastDecisionResult != null,
    hasDailyReportForToday: s.lastDailyReport?.day === day,
    dailyGoalCount: s.dailyGoalState?.goals?.length ?? 0,
    todayFlowLineCount: 0,
    legacyCoachOnScreen: selectLegacyCoachOnScreen(s.tutorialState, screen),
  };
}

export function selectOnboardingHubVisibilityFromStore(
  s: OnboardingStoreSlice,
): OnboardingHubVisibility {
  const day = s.gameState.pilot.currentPilotDay ?? s.gameState.city.day;
  const isDay1Eligible = isDay1TutorialEligibleSlice(s);
  const hasDecisionToday = s.decisionHistory.some((r) => r.day === day);
  return selectOnboardingHubVisibility(day, isDay1Eligible, hasDecisionToday);
}
