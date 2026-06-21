import type { CenterHomeModuleKey, CenterHomePresentation, CenterHomeVisibilityFlags, CenterHomeVisibilityState } from './centerHomePresentation';
import type { CenterActiveTarget } from './centerActiveTargetPresentation';
import type { CenterAdvisorSuggestion } from './centerAdvisorPresentation';
import type { CenterContinuationCards } from './centerContinuationCardsPresentation';
import type { CenterDailyReward } from './centerDailyRewardPresentation';
import type { CenterOperationSignals } from './centerOperationSignalsPresentation';
import type { CenterQuickActions } from './centerQuickActionsPresentation';
import type { CenterRecommendedPlan } from './centerRecommendedPlanPresentation';

export const CENTER_DAY_ONE_MAX_OPERATION_FOCUS_ITEMS = 4;
export const CENTER_DAY_ONE_MAX_CONTINUATION_CARDS = 2;
export const CENTER_DAY_ONE_MAX_QUICK_ACTIONS = 4;

export type CenterModuleState =
  | 'ready'
  | 'empty'
  | 'locked'
  | 'completed'
  | 'low_data'
  | 'disabled'
  | 'hidden';

export type CenterFallbackReason =
  | 'day_1'
  | 'missing_runtime'
  | 'no_active_goal'
  | 'no_signal'
  | 'no_route'
  | 'no_permission'
  | 'completed_today'
  | 'feature_locked'
  | 'calm_day';

export type CenterStatePolicyResult = {
  state: CenterModuleState;
  reason: CenterFallbackReason;
  shouldRender: boolean;
  shouldUseCompactCopy: boolean;
  shouldDisableActions: boolean;
  label?: string;
  helperText?: string;
};

const UNSAFE_TEXT_PATTERN =
  /\b(undefined|null|NaN|feature locked|permission missing|coming soon|null route)\b/i;

const TECHNICAL_COPY_PATTERN = /\b(veri eksik|missing runtime|error|failed to load)\b/i;

function normalizeLine(value: string | null | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function linesAreDuplicate(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeLine(a);
  const right = normalizeLine(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

export function isSafeCenterDisplayText(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (UNSAFE_TEXT_PATTERN.test(trimmed)) return false;
  if (TECHNICAL_COPY_PATTERN.test(trimmed)) return false;
  if (trimmed.toLowerCase() === 'nan') return false;
  return true;
}

export function sanitizeCenterDisplayText(
  value: string | null | undefined,
  fallback: string,
): string {
  return isSafeCenterDisplayText(value) ? value!.trim() : fallback;
}

export function isCenterModuleRenderable(state: CenterHomeVisibilityState): boolean {
  return state !== 'hidden';
}

export function mapVisibilityToModuleState(
  visibility: CenterHomeVisibilityState,
): CenterModuleState {
  switch (visibility) {
    case 'hidden':
      return 'hidden';
    case 'locked':
      return 'locked';
    case 'empty':
      return 'empty';
    case 'completed':
      return 'completed';
    default:
      return 'ready';
  }
}

export function resolveCenterModulePolicy(input: {
  moduleKey: CenterHomeModuleKey;
  day: number;
  visibility: CenterHomeVisibilityState;
  itemCount?: number;
  hasActionRoute?: boolean;
}): CenterStatePolicyResult {
  const baseVisibility = mapVisibilityToModuleState(input.visibility);
  const isDayOne = input.day <= 1;

  if (baseVisibility === 'hidden') {
    return {
      state: 'hidden',
      reason: isDayOne ? 'day_1' : 'calm_day',
      shouldRender: false,
      shouldUseCompactCopy: true,
      shouldDisableActions: true,
    };
  }

  if (input.visibility === 'locked') {
    return {
      state: 'locked',
      reason: isDayOne ? 'day_1' : 'feature_locked',
      shouldRender: true,
      shouldUseCompactCopy: true,
      shouldDisableActions: true,
      label: isDayOne ? 'İlk sonuçtan sonra açılır' : 'Yakında açılır',
      helperText: isDayOne
        ? 'İlk operasyonla merkez akışı genişler.'
        : 'Operasyon tamamlanınca netleşir.',
    };
  }

  if (input.visibility === 'empty' || input.itemCount === 0) {
    return {
      state: 'empty',
      reason: 'calm_day',
      shouldRender: input.moduleKey === 'operationSignals',
      shouldUseCompactCopy: true,
      shouldDisableActions: true,
      label: 'Merkez sakin',
      helperText: 'Aktif hedefe odaklan.',
    };
  }

  if (input.visibility === 'completed' || baseVisibility === 'completed') {
    return {
      state: 'completed',
      reason: 'completed_today',
      shouldRender: true,
      shouldUseCompactCopy: false,
      shouldDisableActions: false,
      helperText: 'Sonucu gör veya raporu aç.',
    };
  }

  if (!input.hasActionRoute && input.moduleKey === 'quickActions') {
    return {
      state: 'disabled',
      reason: 'no_route',
      shouldRender: true,
      shouldUseCompactCopy: true,
      shouldDisableActions: true,
    };
  }

  return {
    state: isDayOne ? 'ready' : 'ready',
    reason: isDayOne ? 'day_1' : 'missing_runtime',
    shouldRender: true,
    shouldUseCompactCopy: isDayOne,
    shouldDisableActions: false,
  };
}

export function applyCenterVisibilityPolicy(
  flags: CenterHomeVisibilityFlags,
  presentation: Omit<CenterHomePresentation, 'moduleOrder' | 'visibilityFlags'>,
  day: number,
): CenterHomeVisibilityFlags {
  const next: CenterHomeVisibilityFlags = { ...flags };

  if (presentation.continuationCards.cards.length === 0) {
    next.continuationCards = 'hidden';
  }

  if (day <= 1) {
    next.operationFocus = 'visible';
    next.quickActions = presentation.quickActions.visibility === 'hidden' ? 'hidden' : 'locked';
    next.recommendedPlan =
      presentation.recommendedPlan.visibility === 'hidden' ? 'hidden' : 'visible';
    next.advisorSuggestion = 'visible';
    next.activeTarget = 'visible';
    next.dailyReward = 'visible';
    next.citySummary = 'visible';
    next.header = 'visible';
  }

  if (
    presentation.operationSignals.displayMode === 'empty' &&
    presentation.operationSignals.signals.length <= 1
  ) {
    next.operationSignals = presentation.operationSignals.visibility;
  }

  return next;
}

function collectTexts(values: Array<string | null | undefined>): string[] {
  return values.map((value) => value?.trim()).filter((value): value is string => Boolean(value));
}

function auditTextsSafe(texts: string[]): string[] {
  const issues: string[] = [];
  for (const text of texts) {
    if (!isSafeCenterDisplayText(text)) {
      issues.push(`unsafe text: ${text.slice(0, 48)}`);
    }
  }
  return issues;
}

function auditActiveTargetRoute(target: CenterActiveTarget): string[] {
  if (!target.cta.enabled) return [];
  if (target.cta.actionKey === 'locked' || target.cta.actionKey === 'none') {
    return ['activeTarget enabled without safe action'];
  }
  if (!target.cta.route?.trim()) {
    return ['activeTarget enabled without route'];
  }
  return [];
}

function auditDailyRewardActions(reward: CenterDailyReward): string[] {
  if (reward.claimState === 'claimed' && reward.ctaEnabled) {
    return ['dailyReward claimed but claim enabled'];
  }
  if (reward.ctaEnabled && !reward.ctaLabel?.trim()) {
    return ['dailyReward cta enabled without label'];
  }
  return [];
}

function auditQuickActions(section: CenterQuickActions): string[] {
  const issues: string[] = [];
  for (const item of section.items) {
    if (item.enabled && !item.route?.trim()) {
      issues.push(`quickAction ${item.id} enabled without route`);
    }
    if (item.status === 'locked' && item.enabled) {
      issues.push(`quickAction ${item.id} locked but enabled`);
    }
  }
  return issues;
}

function auditRecommendedPlan(plan: CenterRecommendedPlan): string[] {
  const issues: string[] = [];
  if (plan.cta?.enabled && !plan.cta.route?.trim()) {
    issues.push('recommendedPlan cta enabled without route');
  }
  if (plan.planType === 'empty' && /sahte|fake|uydurma/i.test(plan.body)) {
    issues.push('recommendedPlan empty with fake copy');
  }
  return issues;
}

function auditContinuation(section: CenterContinuationCards): string[] {
  const issues: string[] = [];
  for (const card of section.cards) {
    if (card.enabled && !card.route?.trim()) {
      issues.push(`continuation ${card.id} enabled without route`);
    }
    if (!isSafeCenterDisplayText(card.title) || !isSafeCenterDisplayText(card.body)) {
      issues.push(`continuation ${card.id} unsafe copy`);
    }
  }
  return issues;
}

function auditOperationSignals(section: CenterOperationSignals): string[] {
  const issues: string[] = [];
  if (section.displayMode === 'empty' && section.signals.length > 1) {
    issues.push('operationSignals empty mode with multiple signals');
  }
  for (const signal of section.signals) {
    if (!isSafeCenterDisplayText(signal.title) || !isSafeCenterDisplayText(signal.description)) {
      issues.push(`operationSignal ${signal.id} unsafe copy`);
    }
    if (signal.tone === 'urgent' && signal.sourceIds.includes('day1.intro')) {
      issues.push('operationSignals day1 fake urgent');
    }
  }
  return issues;
}

export function centerPresentationNoUnsafeText(presentation: CenterHomePresentation): boolean {
  const texts = collectTexts([
    presentation.headerSummary.title,
    presentation.headerSummary.subtitle,
    presentation.headerSummary.accessibilityLabel,
    presentation.citySummary.title,
    presentation.citySummary.accessibilityLabel,
    presentation.dailyReward.title,
    presentation.dailyReward.helperText,
    presentation.dailyReward.accessibilityLabel,
    presentation.activeTarget.title,
    presentation.activeTarget.description,
    presentation.activeTarget.helperText,
    presentation.activeTarget.accessibilityLabel,
    presentation.advisorSuggestion.recommendation,
    presentation.advisorSuggestion.contextLine,
    presentation.advisorSuggestion.accessibilityLabel,
    presentation.operationFocus.helperText,
    presentation.operationFocus.accessibilityLabel,
    presentation.operationSignals.accessibilityLabel,
    presentation.quickActions.accessibilityLabel,
    presentation.recommendedPlan.body,
    presentation.recommendedPlan.accessibilityLabel,
    presentation.continuationCards.accessibilityLabel,
    ...presentation.citySummary.metrics.map((metric) => metric.valueText),
    ...presentation.operationSignals.signals.flatMap((signal) => [
      signal.title,
      signal.description,
    ]),
    ...presentation.continuationCards.cards.flatMap((card) => [card.title, card.body]),
  ]);

  return auditTextsSafe(texts).length === 0;
}

export function centerPresentationRouteSafetyValid(presentation: CenterHomePresentation): boolean {
  const issues = [
    ...auditActiveTargetRoute(presentation.activeTarget),
    ...auditDailyRewardActions(presentation.dailyReward),
    ...auditQuickActions(presentation.quickActions),
    ...auditRecommendedPlan(presentation.recommendedPlan),
    ...auditContinuation(presentation.continuationCards),
  ];

  if (presentation.advisorSuggestion.action?.enabled && !presentation.advisorSuggestion.action.route) {
    if (
      presentation.advisorSuggestion.action.actionKey !== 'none' &&
      presentation.advisorSuggestion.action.actionKey !== 'view_signals'
    ) {
      issues.push('advisor action enabled without route');
    }
  }

  return issues.length === 0;
}

export function centerPresentationAccessibilityValid(presentation: CenterHomePresentation): boolean {
  const labels = [
    presentation.headerSummary.accessibilityLabel,
    presentation.citySummary.accessibilityLabel,
    presentation.dailyReward.accessibilityLabel,
    presentation.activeTarget.accessibilityLabel,
    presentation.advisorSuggestion.accessibilityLabel,
    presentation.operationFocus.accessibilityLabel,
    presentation.operationSignals.accessibilityLabel,
    presentation.quickActions.accessibilityLabel,
    presentation.recommendedPlan.accessibilityLabel,
    presentation.continuationCards.accessibilityLabel,
  ];

  return labels.every((label) => isSafeCenterDisplayText(label));
}

export function centerDayOnePolicyValid(presentation: CenterHomePresentation): boolean {
  const plan = presentation.recommendedPlan;
  const forbiddenPlanTypes: Array<CenterRecommendedPlan['planType']> = [
    'city_journal',
    'story_chain',
    'carry_over',
    'tomorrow_risk',
  ];

  if (forbiddenPlanTypes.includes(plan.planType)) return false;
  if (presentation.operationFocus.items.length > CENTER_DAY_ONE_MAX_OPERATION_FOCUS_ITEMS) {
    return false;
  }
  if (presentation.continuationCards.cards.length > CENTER_DAY_ONE_MAX_CONTINUATION_CARDS) {
    return false;
  }
  if (presentation.quickActions.items.length > CENTER_DAY_ONE_MAX_QUICK_ACTIONS) {
    return false;
  }
  if (presentation.operationSignals.signals.some((signal) => signal.tone === 'urgent')) {
    return false;
  }
  if (
    presentation.continuationCards.cards.some(
      (card) =>
        (card.kind === 'story_chain' || card.kind === 'city_journal') &&
        card.enabled &&
        !card.isLocked,
    )
  ) {
    return false;
  }
  if (presentation.quickActions.items.some((item) => item.status === 'locked' && item.enabled)) {
    return false;
  }
  return true;
}

export function centerPresentationNoCriticalDuplicates(
  presentation: CenterHomePresentation,
): boolean {
  const pairs: Array<[string | undefined, string | undefined]> = [
    [presentation.activeTarget.title, presentation.recommendedPlan.body],
    [presentation.activeTarget.description, presentation.recommendedPlan.body],
    [presentation.advisorSuggestion.recommendation, presentation.recommendedPlan.body],
    [presentation.advisorSuggestion.recommendation, presentation.activeTarget.title],
    [presentation.dailyReward.helperText, presentation.advisorSuggestion.recommendation],
    [presentation.citySummary.primaryInsight?.text, presentation.advisorSuggestion.recommendation],
    [presentation.headerSummary.notification.label, presentation.dailyReward.streakLabel],
  ];

  for (const signal of presentation.operationSignals.signals) {
    pairs.push([signal.title, presentation.activeTarget.title]);
    pairs.push([signal.description, presentation.advisorSuggestion.recommendation]);
  }

  for (const card of presentation.continuationCards.cards) {
    pairs.push([card.body, presentation.recommendedPlan.body]);
    pairs.push([card.title, presentation.activeTarget.title]);
  }

  for (const item of presentation.quickActions.items) {
    pairs.push([item.label, presentation.activeTarget.cta.label]);
  }

  return pairs.every(([left, right]) => !linesAreDuplicate(left, right));
}

export function centerVisibilityFlagsConsistent(presentation: CenterHomePresentation): boolean {
  const flags = presentation.visibilityFlags;
  if (flags.header !== 'visible' || flags.citySummary !== 'visible') return false;
  if (
    presentation.continuationCards.cards.length === 0 &&
    flags.continuationCards !== 'hidden'
  ) {
    return false;
  }
  if (
    presentation.continuationCards.cards.length > 0 &&
    flags.continuationCards === 'hidden'
  ) {
    return false;
  }
  if (presentation.recommendedPlan.visibility !== flags.recommendedPlan) return false;
  if (presentation.quickActions.visibility !== flags.quickActions) return false;
  return true;
}

export function centerCompletedTargetGuidesNext(presentation: CenterHomePresentation): boolean {
  if (presentation.activeTarget.status !== 'completed') return true;
  return (
    presentation.activeTarget.cta.enabled &&
    Boolean(presentation.activeTarget.cta.route?.trim()) &&
    isSafeCenterDisplayText(presentation.activeTarget.cta.label)
  );
}

export function auditCenterHomePresentation(
  presentation: CenterHomePresentation,
): { ok: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!centerPresentationNoUnsafeText(presentation)) {
    issues.push('unsafe presentation text');
  }
  if (!centerPresentationRouteSafetyValid(presentation)) {
    issues.push('route/action safety');
  }
  if (!centerPresentationAccessibilityValid(presentation)) {
    issues.push('accessibility labels');
  }
  if (!centerVisibilityFlagsConsistent(presentation)) {
    issues.push('visibility flags');
  }

  return { ok: issues.length === 0, issues };
}

export function centerLowDataPresentationSafe(presentation: CenterHomePresentation): boolean {
  const metrics = presentation.citySummary.metrics;
  const metricsOk = metrics.every(
    (metric) =>
      isSafeCenterDisplayText(metric.label) &&
      isSafeCenterDisplayText(metric.valueText),
  );
  const progressOk =
    !presentation.citySummary.progress ||
    (!Number.isNaN(presentation.citySummary.progress.progressRatio) &&
      presentation.citySummary.progress.progressRatio >= 0 &&
      presentation.citySummary.progress.progressRatio <= 1);
  return metricsOk && progressOk;
}
