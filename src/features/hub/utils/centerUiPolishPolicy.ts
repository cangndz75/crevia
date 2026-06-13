import { MOTION_DENSITY_CAPS } from '@/core/motion/motionConstants';
import { MOTION_TOKEN_PULSE } from '@/core/motion/motionTokens';
import { resolveMotionDensity } from '@/core/motion/motionPresentation';

import {
  CENTER_HOME_MODULE_ORDER,
  type CenterHomeModuleKey,
  type CenterHomePresentation,
} from './centerHomePresentation';
import { CENTER_CONTINUATION_CARDS_MAX } from './centerContinuationCardsPresentation';
import { CENTER_HEADER_MAX_RESOURCE_CHIPS } from './centerHeaderPresentation';
import { CENTER_OPERATION_SIGNALS_MAX } from './centerOperationSignalsPresentation';
import { CENTER_QUICK_ACTIONS_MAX } from './centerQuickActionsPresentation';
import { CENTER_RECOMMENDED_PLAN_MAX_STEPS } from './centerRecommendedPlanPresentation';
import {
  CENTER_DAY_ONE_MAX_CONTINUATION_CARDS,
  CENTER_DAY_ONE_MAX_OPERATION_FOCUS_ITEMS,
  CENTER_DAY_ONE_MAX_QUICK_ACTIONS,
} from './centerStatePolicy';
import {
  auditCenterHomePresentation,
  centerCompletedTargetGuidesNext,
  centerDayOnePolicyValid,
  centerPresentationAccessibilityValid,
  centerPresentationNoCriticalDuplicates,
  centerPresentationNoUnsafeText,
  centerPresentationRouteSafetyValid,
  centerVisibilityFlagsConsistent,
  isCenterModuleRenderable,
} from './centerStatePolicy';

export const CENTER_UI_DENSITY_LIMITS = {
  headerChips: CENTER_HEADER_MAX_RESOURCE_CHIPS,
  citySummaryMetrics: 3,
  operationSignals: CENTER_OPERATION_SIGNALS_MAX,
  quickActions: CENTER_QUICK_ACTIONS_MAX,
  continuationCards: CENTER_CONTINUATION_CARDS_MAX,
  recommendedPlanSteps: CENTER_RECOMMENDED_PLAN_MAX_STEPS,
  hubMotionEnterCap: MOTION_DENSITY_CAPS.hub.maxAnimatedItems,
} as const;

const FIRST_FOLD_MODULES: CenterHomeModuleKey[] = [
  'header',
  'citySummary',
  'dailyReward',
  'activeTarget',
];

export function centerUiPolishModuleOrderValid(presentation: CenterHomePresentation): boolean {
  return presentation.moduleOrder.join('|') === CENTER_HOME_MODULE_ORDER.join('|');
}

export function centerUiPolishDensityValid(presentation: CenterHomePresentation): boolean {
  return (
    presentation.headerSummary.resourceChips.length <= CENTER_UI_DENSITY_LIMITS.headerChips &&
    presentation.citySummary.metrics.length <= CENTER_UI_DENSITY_LIMITS.citySummaryMetrics &&
    presentation.operationSignals.signals.length <= CENTER_UI_DENSITY_LIMITS.operationSignals &&
    presentation.quickActions.items.length <= CENTER_UI_DENSITY_LIMITS.quickActions &&
    presentation.continuationCards.cards.length <= CENTER_UI_DENSITY_LIMITS.continuationCards &&
    (presentation.recommendedPlan.steps?.length ?? 0) <=
      CENTER_UI_DENSITY_LIMITS.recommendedPlanSteps &&
    presentation.operationFocus.items.length <= 6
  );
}

export function centerUiPolishDay1LimitsValid(presentation: CenterHomePresentation): boolean {
  if (presentation.activeTarget.sourceLabel !== 'Başlangıç hedefi') return true;
  return (
    centerDayOnePolicyValid(presentation) &&
    presentation.operationFocus.items.length <= CENTER_DAY_ONE_MAX_OPERATION_FOCUS_ITEMS &&
    presentation.continuationCards.cards.length <= CENTER_DAY_ONE_MAX_CONTINUATION_CARDS &&
    presentation.quickActions.items.length <= CENTER_DAY_ONE_MAX_QUICK_ACTIONS
  );
}

export function centerUiPolishFirstFoldValid(presentation: CenterHomePresentation): boolean {
  return FIRST_FOLD_MODULES.every((key) => {
    const flag = presentation.visibilityFlags[key];
    return isCenterModuleRenderable(flag);
  });
}

export function centerUiPolishHiddenModulesLeaveNoGap(
  presentation: CenterHomePresentation,
): boolean {
  if (
    presentation.continuationCards.cards.length === 0 &&
    presentation.continuationCards.visibility !== 'hidden'
  ) {
    return false;
  }
  if (
    presentation.recommendedPlan.visibility === 'hidden' &&
    presentation.recommendedPlan.body.trim() !== 'Gizli'
  ) {
    return true;
  }
  return true;
}

export function centerUiPolishMotionCapValid(day: number): boolean {
  const density = resolveMotionDensity({ day });
  if (day <= 1 && density !== 'day1_minimal') return false;
  return (
    CENTER_UI_DENSITY_LIMITS.hubMotionEnterCap === 3 &&
    MOTION_TOKEN_PULSE.softRepeatCount >= 1 &&
    MOTION_TOKEN_PULSE.softRepeatCount <= 4
  );
}

export function centerUiPolishReducedMotionPresetSafe(): boolean {
  return MOTION_TOKEN_PULSE.softRepeatCount > 0 && MOTION_TOKEN_PULSE.softRepeatCount < 10;
}

export function centerUiPolishCompletedUxValid(presentation: CenterHomePresentation): boolean {
  if (presentation.activeTarget.status !== 'completed') return true;
  return centerCompletedTargetGuidesNext(presentation);
}

export function centerUiPolishCalmDayUxValid(presentation: CenterHomePresentation): boolean {
  const calmSignals =
    presentation.operationSignals.displayMode === 'empty' ||
    presentation.operationSignals.signals.every(
      (signal) => signal.signalType === 'calm' || signal.tone === 'neutral' || signal.tone === 'stable',
    );
  const noFakeUrgent =
    !presentation.operationSignals.signals.some(
      (signal) => signal.tone === 'urgent' && signal.sourceIds.includes('day1.intro'),
    ) &&
    presentation.recommendedPlan.planType !== 'tomorrow_risk';
  return calmSignals && noFakeUrgent;
}

export function auditCenterUiPolish(presentation: CenterHomePresentation, day: number): {
  ok: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const push = (ok: boolean, label: string) => {
    if (!ok) issues.push(label);
  };

  push(centerUiPolishModuleOrderValid(presentation), 'module order');
  push(centerUiPolishDensityValid(presentation), 'density limits');
  push(centerUiPolishFirstFoldValid(presentation), 'first fold');
  push(centerUiPolishHiddenModulesLeaveNoGap(presentation), 'hidden layout');
  push(centerPresentationNoUnsafeText(presentation), 'unsafe text');
  push(centerPresentationRouteSafetyValid(presentation), 'route safety');
  push(centerPresentationAccessibilityValid(presentation), 'accessibility');
  push(centerPresentationNoCriticalDuplicates(presentation), 'dedupe');
  push(centerVisibilityFlagsConsistent(presentation), 'visibility flags');
  push(centerUiPolishMotionCapValid(day), 'motion cap');
  push(centerUiPolishReducedMotionPresetSafe(), 'pulse preset');
  push(auditCenterHomePresentation(presentation).ok, 'state audit');

  if (day <= 1) {
    push(centerUiPolishDay1LimitsValid(presentation), 'day 1 limits');
  }

  return { ok: issues.length === 0, issues };
}
