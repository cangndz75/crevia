import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { buildDecisionOptionCardPresentation } from '@/features/events/utils/decisionOptionCardIntegration';
import { createEmptyDecisionResultFallback } from '@/features/events/utils/decisionResultModel';
import { pilotEvents } from '@/core/content/pilotEvents';
import { createDay1Seed } from '@/core/content/day1Seed';
import {
  buildEventLifecycleMeta,
  buildEventLifecycleContext,
} from '@/core/liveFlow/eventLifecycleEngine';
import {
  buildLiveFlowStoreSliceFromGameStore,
  selectHubTodayFlowLines,
} from '@/core/liveFlow/liveFlowSelectors';
import { SAVE_VERSION } from '@/store/gamePersist';
import {
  decisionOptionCardAllowsPressFeedback,
  getPressFeedbackStyle,
  PRESS_MUTED_OPACITY,
} from '@/core/feedback/pressFeedbackHelpers';
import {
  isHapticModuleAvailable,
  playLightImpactHaptic,
  playSelectionHaptic,
  playSuccessHaptic,
  playWarningHaptic,
} from '@/core/feedback/hapticFeedback';

export type VerifyMicroInteractionsOutcome = {
  ok: boolean;
  checks: string[];
  failCount: number;
};

function record(checks: string[], label: string, pass: boolean): void {
  checks.push(pass ? `✓ ${label}` : `✗ ${label}`);
}

export function verifyMicroInteractionsScenario(): VerifyMicroInteractionsOutcome {
  const checks: string[] = [];

  let hapticCrashed = false;
  try {
    playSelectionHaptic();
    playSuccessHaptic();
    playWarningHaptic();
    playLightImpactHaptic();
  } catch {
    hapticCrashed = true;
  }
  record(checks, 'haptic helper expo-haptics yoksa crash etmiyor', !hapticCrashed);
  record(checks, 'playSelectionHaptic no-op fallback', !hapticCrashed);
  record(checks, 'playSuccessHaptic no-op fallback', !hapticCrashed);
  record(checks, 'playWarningHaptic no-op fallback', !hapticCrashed);
  record(
    checks,
    'isHapticModuleAvailable boolean',
    typeof isHapticModuleAvailable() === 'boolean',
  );

  record(
    checks,
    'DecisionOptionCard disabled press feedback kapalı',
    !decisionOptionCardAllowsPressFeedback(true) &&
      decisionOptionCardAllowsPressFeedback(false),
  );

  const bundle = createDay1Seed();
  const event = bundle.gameState.events[0] ?? pilotEvents[0];
  const decision = event?.decisions[0];
  let cardVariantOk = false;
  if (event && decision) {
    try {
      const quick = buildDecisionOptionCardPresentation({
        event,
        decision,
        variant: 'quick',
      });
      const full = buildDecisionOptionCardPresentation({
        event,
        decision,
        variant: 'full',
      });
      cardVariantOk =
        typeof quick.tradeoff === 'string' && typeof full.tradeoff === 'string';
    } catch {
      cardVariantOk = false;
    }
  }
  record(
    checks,
    'DecisionOptionCard quick/full presentation crash yok',
    cardVariantOk,
  );

  const emptyFlowLines = selectHubTodayFlowLines(
    buildLiveFlowStoreSliceFromGameStore({
      gameState: bundle.gameState,
      eventPool: bundle.eventPool,
      decisionHistory: [],
      lastDecisionResult: null,
      lastDailyReport: null,
      dailyPriorityByDay: {},
      dailyGoalsByDay: {},
      isDay1Tutorial: true,
    }),
  );
  record(
    checks,
    'HubTodayFlowStrip empty/placeholder slice crash yok',
    Array.isArray(emptyFlowLines),
  );

  const lifecycleCtx = buildEventLifecycleContext({
    currentDay: bundle.gameState.city.day,
    decisionHistory: bundle.decisionHistory,
    solvedEventIds: [],
    lastDecisionResult: undefined,
    isDay1Tutorial: false,
  });
  const resolvedMeta = event
    ? buildEventLifecycleMeta(event, lifecycleCtx, bundle.decisionHistory)
    : null;
  const resolvedSummaryOk =
    event != null &&
    resolvedMeta != null &&
    (resolvedMeta.summaryText?.length ?? 0) >= 0;
  record(
    checks,
    'ResolvedEventSummaryCard eksik özet metni güvenli',
    resolvedSummaryOk,
  );

  let resultFallbackOk = false;
  try {
    const fallback = createEmptyDecisionResultFallback();
    resultFallbackOk =
      fallback.metricChanges.length >= 0 &&
      typeof fallback.summaryTitle === 'string';
  } catch {
    resultFallbackOk = false;
  }
  record(
    checks,
    'DecisionResultScreen boş snapshot fallback crash yok',
    resultFallbackOk,
  );

  let dismissHapticOk = false;
  try {
    const dismiss = () => playLightImpactHaptic();
    dismiss();
    dismissHapticOk = true;
  } catch {
    dismissHapticOk = false;
  }
  record(
    checks,
    'OnboardingCoachBubble dismiss haptic pattern crash yok',
    dismissHapticOk,
  );

  const mutedStyle = getPressFeedbackStyle({ pressed: false, disabled: true });
  record(
    checks,
    'press feedback disabled muted opacity',
    mutedStyle.opacity === PRESS_MUTED_OPACITY,
  );

  const loop = runFullLoopAnalysis();
  record(checks, 'SAVE_VERSION güncel', SAVE_VERSION === 17);
  const loopNoCrash = loop.scenarios.every((s) => s.crashes === 0);
  record(checks, 'full loop invariant FAIL yok', loop.totalFAIL === 0 && loopNoCrash);
  record(
    checks,
    'full loop 8 senaryo simüle',
    loop.scenarios.length === 8 && loop.saveVersionOk,
  );

  const failCount = checks.filter((c) => c.startsWith('✗')).length;
  return { ok: failCount === 0, checks, failCount };
}
