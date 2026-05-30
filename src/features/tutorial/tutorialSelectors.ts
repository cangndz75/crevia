import type { GameStore } from '@/store/useGameStore';
import { buildDay1AuthoritySummaryLines } from '@/core/authority/authorityPresentation';
import { buildFirstReportGuidanceModel } from '@/core/onboarding/onboardingPresentation';

import {
  DAY1_TUTORIAL_STEPS,
  FIRST_DAY1_STEP_ID,
  getTutorialStepById,
} from './tutorialSteps';
import type {
  TutorialScreen,
  TutorialState,
  TutorialStep,
  TutorialTargetKey,
} from './tutorialTypes';
import { isDay1LearningEventId } from './tutorialTypes';

export function selectTutorialState(s: GameStore): TutorialState {
  return s.tutorialState;
}

export function selectIsDay1TutorialEligible(s: GameStore): boolean {
  if (s.tutorialState.day1Completed || s.tutorialState.skipped) {
    return false;
  }
  const pilot = s.gameState.pilot;
  if (pilot.status !== 'active') return false;
  const day = pilot.currentPilotDay ?? s.gameState.city.day;
  return day === 1;
}

export function selectIsDay1TutorialActive(s: GameStore): boolean {
  return (
    selectIsDay1TutorialEligible(s) && s.tutorialState.activeStepId != null
  );
}

export function selectActiveTutorialStep(s: GameStore): TutorialStep | null {
  if (!selectIsDay1TutorialActive(s)) return null;
  const step = getTutorialStepById(s.tutorialState.activeStepId!);
  return step ?? null;
}

export function selectActiveTutorialStepForScreen(
  s: GameStore,
  screen: TutorialScreen,
): TutorialStep | null {
  const step = selectActiveTutorialStep(s);
  if (!step || step.screen !== screen) return null;
  return step;
}

export function selectTutorialHighlightTarget(
  s: GameStore,
  screen: TutorialScreen,
): TutorialTargetKey | null {
  const step = selectActiveTutorialStepForScreen(s, screen);
  return step?.targetKey ?? null;
}

export function selectShouldShowTutorialSocialCard(s: GameStore): boolean {
  if (!selectIsDay1TutorialEligible(s)) return false;
  const completed = s.tutorialState.completedStepIds;
  return completed.includes('decision_result');
}

export function selectDay1TutorialEventId(s: GameStore): string | null {
  const featured = s.gameState.featuredEventId;
  if (featured && isDay1LearningEventId(featured)) {
    return featured;
  }
  const active = s.gameState.events.find((e) => isDay1LearningEventId(e.id));
  return active?.id ?? null;
}

export function getNextTutorialStepId(currentStepId: string): string | null {
  const index = DAY1_TUTORIAL_STEPS.findIndex((s) => s.id === currentStepId);
  if (index < 0) return null;
  return DAY1_TUTORIAL_STEPS[index + 1]?.id ?? null;
}

export function advanceTutorialState(state: TutorialState): TutorialState {
  const currentId = state.activeStepId ?? FIRST_DAY1_STEP_ID;
  const completed = state.completedStepIds.includes(currentId)
    ? state.completedStepIds
    : [...state.completedStepIds, currentId];

  const nextId = getNextTutorialStepId(currentId);
  if (!nextId) {
    return {
      ...state,
      completedStepIds: completed,
      activeStepId: null,
      day1Completed: true,
    };
  }

  return {
    ...state,
    completedStepIds: completed,
    activeStepId: nextId,
  };
}

export function startTutorialState(state: TutorialState): TutorialState {
  if (state.day1Completed || state.skipped) return state;
  if (state.activeStepId) return state;
  return {
    ...state,
    activeStepId: FIRST_DAY1_STEP_ID,
  };
}

export function skipTutorialState(state: TutorialState): TutorialState {
  return {
    ...state,
    skipped: true,
    activeStepId: null,
    day1Completed: true,
  };
}

export type Day1ReportTutorialCopy = {
  title: string;
  summaryLines: string[];
  learningLine: string;
  warningLine: string;
};

const DAY1_REPORT_GUIDANCE = buildFirstReportGuidanceModel();

export const DAY1_REPORT_TUTORIAL_COPY: Day1ReportTutorialCopy = {
  title: DAY1_REPORT_GUIDANCE.title,
  summaryLines: DAY1_REPORT_GUIDANCE.summaryLines,
  learningLine:
    'Operasyon kararların halk, ekip ve kaynak dengesini birlikte etkiler.',
  warningLine:
    'Pilot boyunca yetki değerlendirmesi günlük raporlarda izlenir.',
};

export function selectShowDay1TutorialReportCopy(s: GameStore): boolean {
  if (s.tutorialState.skipped) return false;
  return s.lastDailyReport?.day === 1;
}

export function applyDay1TutorialReportCopy(
  report: import('@/core/models/DailyReport').DailyReport,
  useTutorialCopy: boolean,
): import('@/core/models/DailyReport').DailyReport {
  if (!useTutorialCopy || report.day !== 1) return report;

  const copy = DAY1_REPORT_TUTORIAL_COPY;
  return {
    ...report,
    title: copy.title,
    summaryLines: copy.summaryLines,
    highlights: [copy.learningLine, ...(report.highlights ?? [])],
    warnings: [copy.warningLine, ...(report.warnings ?? [])],
    rewardTitle: 'Bugünün Öğrenimi',
    rewardDescription: copy.learningLine,
    containerSummaryLines: undefined,
    vehicleSummaryLines: undefined,
    socialSummaryLines: undefined,
    quickActionSummaryLines: undefined,
    badgeEvaluation: undefined,
    badgeSummaryLines: undefined,
    authoritySummaryLines:
      DAY1_REPORT_GUIDANCE.authorityIntroLines.length > 0
        ? DAY1_REPORT_GUIDANCE.authorityIntroLines
        : buildDay1AuthoritySummaryLines(),
    dailyGoalResults: [
      {
        title: 'İlk gün hedefi',
        status: 'completed',
        resultText:
          'İlk gün hedefi tamamlandı: karar verip günü raporladın.',
      },
    ],
  };
}
