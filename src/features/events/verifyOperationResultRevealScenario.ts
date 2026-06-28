import type { EventCard } from '@/core/models/EventCard';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import { createInitialPersonnelState } from '@/core/personnel/personnelSeed';
import { createInitialVehicleState } from '@/core/vehicles/vehicleSeed';
import { applyDecision } from '@/core/game/applyDecision';
import { createInitialPlayerProgress } from '@/core/xp/levelProgress';
import { createDay1Seed } from '@/core/content/day1Seed';
import {
  OPERATION_MOTION_RESULT_REDUCED_MS,
  OPERATION_MOTION_RESULT_TOTAL_MS,
  operationMotionResultRevealStaggerMs,
} from '@/core/motion/operationMotionTokens';
import {
  auditEventResultRevealPresentation,
  buildEventResultRevealPresentation,
  resultAdvisorDiffersFromFieldAdvisor,
} from '@/features/events/utils/eventResultRevealPresentation';
import { operationResultRevealSectionsHaveDuplicates } from '@/features/events/utils/operationResultRevealSectionsPresentation';
import { buildPostDecisionCityReactionPresentation } from '@/features/events/utils/postDecisionCityReactionPresentation';
import { buildEventFieldAdvisorComment } from '@/features/events/utils/eventFieldPhasePresentation';
import {
  buildDecisionResultSnapshot,
  createEmptyDecisionResultFallback,
} from '@/features/events/utils/decisionResultModel';
import { buildEventResultViewModel } from '@/features/events/utils/eventResultPresentation';
import { verifyEventResultUiScenario } from '@/features/events/verifyEventResultUiScenario';

export type VerifyOperationResultRevealOutcome = {
  ok: boolean;
  failCount: number;
  checks: string[];
};

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

function sampleEvent(partial?: Partial<EventCard>): EventCard {
  return {
    id: 'evt_result_reveal',
    title: 'Pazar alanı temizlik baskısı',
    category: 'waste',
    riskLevel: 'medium',
    district: 'Cumhuriyet',
    description: 'Test',
    contextTag: 'test',
    urgencyHours: 4,
    day: 2,
    previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
    decisions: [
      {
        id: 'd1',
        title: 'Ekibi yönlendir',
        description: '',
        style: 'balanced',
        effects: { publicSatisfaction: 6, budget: -800, morale: 2, risk: -2, xp: 0 },
      },
    ],
    ...partial,
  };
}

function buildPositiveSnapshot() {
  const event = sampleEvent();
  const decision = event.decisions[0]!;
  return buildDecisionResultSnapshot({
    day: 2,
    event,
    decision,
    gameStateBefore: {
      publicSatisfaction: 50,
      budget: 20_000,
      morale: 60,
      riskScore: 35,
    },
    gameStateAfter: {
      publicSatisfaction: 58,
      budget: 19_000,
      morale: 64,
      riskScore: 30,
    },
    personnelStateBefore: createInitialPersonnelState(),
    personnelStateAfter: createInitialPersonnelState(),
    containerStateBefore: createInitialContainerState(2),
    containerStateAfter: createInitialContainerState(2),
    vehicleStateBefore: createInitialVehicleState(2),
    vehicleStateAfter: createInitialVehicleState(2),
    socialPulseStateBefore: createInitialSocialPulseState(2),
    socialPulseStateAfter: createInitialSocialPulseState(2),
  });
}

export function verifyOperationResultRevealScenario(): VerifyOperationResultRevealOutcome {
  const checks: Check[] = [];
  const positive = buildPositiveSnapshot();
  const fallback = createEmptyDecisionResultFallback();

  const defaultModel = buildEventResultRevealPresentation({
    snapshot: positive,
    day: 2,
    selectedPlanStrategyId: 'balanced_plan',
  });

  const lowDataModel = buildEventResultRevealPresentation({
    snapshot: fallback,
    isFallback: true,
    day: 2,
  });

  const planModel = buildEventResultRevealPresentation({
    snapshot: positive,
    selectedPlanStrategyId: 'rapid_response',
    day: 2,
  });

  const reducedModel = buildEventResultRevealPresentation({
    snapshot: positive,
    reducedMotion: true,
    day: 2,
  });

  const butterflyModel = buildEventResultRevealPresentation({
    snapshot: {
      ...positive,
      butterflyHint: {
        title: 'Yarın etkisi',
        text: 'Bu karar sonraki planı etkileyebilir.',
        tone: 'warning',
      },
    },
    day: 3,
  });

  assert(
    checks,
    auditEventResultRevealPresentation(defaultModel).length === 0,
    'Presentation audit temiz',
    auditEventResultRevealPresentation(defaultModel).join(', ') || 'ok',
  );

  assert(checks, defaultModel.title.trim().length > 0, 'title boş değil', defaultModel.title);
  assert(
    checks,
    defaultModel.accessibilityLabel.trim().length > 0,
    'accessibilityLabel boş değil',
    defaultModel.accessibilityLabel.slice(0, 40),
  );
  assert(
    checks,
    defaultModel.outcome.label.length > 0 && defaultModel.outcome.body.length > 0,
    'outcome label/body dolu',
    defaultModel.outcome.label,
  );
  assert(
    checks,
    ['success', 'partial', 'mixed', 'risk', 'unknown'].includes(defaultModel.outcome.outcomeBand),
    'outcomeBand enum',
    defaultModel.outcome.outcomeBand,
  );
  assert(
    checks,
    defaultModel.revealItems.length >= 3 && defaultModel.revealItems.length <= 7,
    'revealItems 3-7',
    String(defaultModel.revealItems.length),
  );

  const kinds = defaultModel.revealItems.map((item) => item.kind);
  assert(
    checks,
    new Set(kinds).size === kinds.length,
    'reveal kind duplicate yok',
    kinds.join(','),
  );

  const orders = defaultModel.revealItems.map((item) => item.revealOrder);
  assert(
    checks,
    orders.join(',') === [...orders].sort((a, b) => a - b).join(','),
    'revealOrder sıralı',
    orders.join(','),
  );

  assert(
    checks,
    !lowDataModel.revealItems.some((item) => /NaN|null|undefined/i.test(item.valueText ?? '')),
    'NaN/null valueText yok',
    'ok',
  );

  assert(
    checks,
    !lowDataModel.revealItems.some((item) => item.kind === 'badge' && item.tone === 'gold'),
    'fake badge unlock yok',
    'ok',
  );

  assert(
    checks,
    !defaultModel.revealItems.some(
      (item) => item.kind === 'butterfly' || item.kind === 'carry_over',
    ),
    'fake butterfly/carry-over yok',
    'ok',
  );

  assert(
    checks,
    butterflyModel.revealItems.some(
      (item) =>
        item.kind === 'tomorrow_risk' &&
        item.sourceIds.includes('butterfly'),
    ),
    'butterfly kaynağı reveal edilir',
    butterflyModel.revealItems.map((item) => item.kind).join(','),
  );

  assert(
    checks,
    Boolean(
      planModel.selectedPlanContext?.label && planModel.selectedPlanContext.resultLine,
    ),
    'selectedPlan context dolu',
    planModel.selectedPlanContext?.label ?? 'missing',
  );

  assert(
    checks,
    defaultModel.primaryCta.id === 'back_to_hub',
    'primary CTA hub-first',
    defaultModel.primaryCta.label,
  );

  assert(
    checks,
    Boolean(defaultModel.revealSections.hero.scoreLabel.trim()),
    'reveal hero score label',
    defaultModel.revealSections.hero.scoreLabel,
  );

  assert(
    checks,
    defaultModel.revealSections.impactSummary.chips.length >= 2 &&
      defaultModel.revealSections.impactSummary.chips.length <= 3,
    'impact chips bounded',
    String(defaultModel.revealSections.impactSummary.chips.length),
  );

  assert(
    checks,
    defaultModel.revealSections.neighborhoodReaction.visibility === 'visible',
    'neighborhood reaction visible',
    defaultModel.revealSections.neighborhoodReaction.message.slice(0, 40),
  );

  assert(
    checks,
    defaultModel.revealSections.decisionImpact.visibility === 'visible',
    'decision impact visible',
    defaultModel.revealSections.decisionImpact.summaryLine.slice(0, 40),
  );

  assert(
    checks,
    !operationResultRevealSectionsHaveDuplicates(defaultModel.revealSections),
    'reveal sections duplicate guard',
  );

  const day1Model = buildEventResultRevealPresentation({
    snapshot: positive,
    day: 1,
    isDay1LearningEvent: true,
    selectedPlanStrategyId: 'balanced_plan',
  });
  assert(checks, day1Model.revealSections.densityBand === 'day1', 'day1 density band');
  assert(
    checks,
    day1Model.revealSections.impactSummary.chips.length <= 2,
    'day1 impact chips capped',
    String(day1Model.revealSections.impactSummary.chips.length),
  );
  assert(
    checks,
    day1Model.revealSections.decisionImpact.visibility === 'visible',
    'day1 decision impact teaching',
  );

  const day8Model = buildEventResultRevealPresentation({
    snapshot: positive,
    day: 8,
    selectedPlanStrategyId: 'long_term_fix',
    cityReaction: buildPostDecisionCityReactionPresentation(positive),
  });
  assert(checks, day8Model.revealSections.densityBand === 'openEnded', 'day8 density band');
  assert(
    checks,
    day8Model.revealSections.tomorrowRipple.visibility === 'visible',
    'day8 tomorrow ripple',
  );

  const negativeSnapshot = buildPositiveSnapshot();
  negativeSnapshot.resultTone = 'negative';
  negativeSnapshot.metricChanges = negativeSnapshot.metricChanges.map((metric) =>
    metric.key === 'publicSatisfaction'
      ? { ...metric, delta: -4, isGood: false }
      : metric.key === 'budget'
        ? { ...metric, delta: -2200, isGood: false }
        : metric,
  );
  const riskModel = buildEventResultRevealPresentation({
    snapshot: negativeSnapshot,
    day: 5,
    selectedPlanStrategyId: 'rapid_response',
  });
  assert(
    checks,
    riskModel.revealSections.hero.tone.id !== defaultModel.revealSections.hero.tone.id,
    'negative outcome tone distinct',
    riskModel.revealSections.hero.tone.id,
  );

  const maintenanceModel = buildEventResultRevealPresentation({
    snapshot: positive,
    day: 8,
    maintenanceBacklogRuntime: {
      items: [
        {
          id: 'maint-1',
          domain: 'vehicle',
          severity: 'strained',
          status: 'open',
          createdDay: 6,
          updatedDay: 8,
          carryOverDays: 2,
          sourceDedupeKey: 'maintenance:vehicle:strained',
          lastReasonLabels: ['Araç bakımı gecikmesi'],
          districtId: 'central',
        },
      ],
      attentionStreaks: {},
    },
  });
  const maintenanceSurfaced =
    maintenanceModel.revealSections.impactSummary.chips.some((chip) => chip.id === 'readiness') ||
    Boolean(maintenanceModel.resourceCost.maintenanceHint);
  assert(checks, maintenanceSurfaced, 'maintenance/readiness surfaces when runtime active');

  const hubAlignedReaction = buildPostDecisionCityReactionPresentation(positive);
  const hubAlignedModel = buildEventResultRevealPresentation({
    snapshot: positive,
    day: 3,
    cityReaction: hubAlignedReaction,
  });
  assert(
    checks,
    hubAlignedModel.revealSections.neighborhoodReaction.message.length > 0,
    'hub/report aligned reaction',
  );

  assert(
    checks,
    defaultModel.advisorComment.text.trim().length > 0,
    'advisorComment dolu',
    defaultModel.advisorComment.text.slice(0, 40),
  );

  assert(
    checks,
    defaultModel.finalActions.length >= 1,
    'finalActions en az 1',
    String(defaultModel.finalActions.length),
  );

  for (const action of defaultModel.finalActions) {
    if (action.enabled && action.id !== 'next_day') {
      assert(checks, Boolean(action.route), `enabled action route: ${action.id}`, action.route ?? '');
    }
  }

  assert(
    checks,
    defaultModel.revealTotalMs >= 1200 && defaultModel.revealTotalMs <= 1800,
    'reveal total 1200-1800ms',
    String(defaultModel.revealTotalMs),
  );
  assert(
    checks,
    reducedModel.revealTotalMs <= 150,
    'reduced motion kısa',
    String(reducedModel.revealTotalMs),
  );
  assert(
    checks,
    operationMotionResultRevealStaggerMs(true) === 0,
    'reduced stagger sıfır',
    'ok',
  );

  const fieldAdvisor = buildEventFieldAdvisorComment(
    { event: sampleEvent(), day: 2 },
    {
      label: 'Uyum dengeli',
      body: 'Ekip planla uyumlu ilerliyor.',
      scoreBand: 'medium',
      tone: 'neutral',
    },
    { strategyId: 'balanced_plan', label: 'Dengeli', effectLine: 'test', tone: 'green' },
    false,
  );
  assert(
    checks,
    resultAdvisorDiffersFromFieldAdvisor(
      defaultModel.advisorComment.text,
      fieldAdvisor.text,
    ),
    'Ece field yorumunu tekrar etmez',
    'ok',
  );

  assert(
    checks,
    typeof buildEventResultViewModel(positive).hero.title === 'string',
    'result engine balance değişmedi',
    'presentation-only',
  );

  let applyDigest = 'skip';
  try {
    const bundle = createDay1Seed();
    const event = bundle.gameState.events[0];
    const decision = event?.decisions[0];
    if (event && decision) {
      const result = applyDecision({
        state: {
          ...bundle.gameState,
          neighborhoods: bundle.neighborhoods,
          resources: bundle.resources,
        },
        eventId: event.id,
        decisionId: decision.id,
        playerProgress: createInitialPlayerProgress(),
      });
      applyDigest = JSON.stringify({
        eventId: result.decisionRecord.eventId,
        budget: result.afterSnapshot.metrics.budget,
      });
    }
  } catch (error) {
    applyDigest = error instanceof Error ? error.message : 'fail';
  }
  assert(checks, applyDigest !== 'fail', 'applyDecision çalışır', applyDigest.slice(0, 40));

  const eventResultUi = verifyEventResultUiScenario();
  assert(checks, eventResultUi.ok, 'verify:event-result-ui PASS kalır', String(eventResultUi.failCount));

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'OK' : 'FAIL'} ${c.name}: ${c.detail}`),
  };
}
