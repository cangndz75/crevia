import type { EventCard, EventDecision } from '@/core/models/EventCard';
import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import {
  operationMotionDispatchDurationMs,
  operationMotionDispatchSentDurationMs,
} from '@/core/motion/operationMotionTokens';
import { OPERATION_WORKFLOW_STEPS } from '@/features/events/utils/eventWorkflowPresentation';
import { buildPlanScreenModel } from '@/features/events/utils/eventWorkflowPlanPresentation';
import {
  auditEventDispatchPhasePresentation,
  buildEventDispatchPhasePresentation,
  dispatchAdvisorDiffersFromPlanAdvisor,
  suggestDecisionIdForPlanStrategy,
} from '@/features/events/utils/eventDispatchPhasePresentation';
import {
  buildEventPlanPhasePresentation,
  getPlanStrategyLabel,
  type EventPlanStrategyId,
} from '@/features/events/utils/eventPlanPhasePresentation';

export type VerifyOperationDispatchMotionOutcome = {
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
    id: 'evt_dispatch_motion',
    title: 'Pazar alanı temizlik baskısı',
    category: 'waste',
    riskLevel: 'medium',
    district: 'Cumhuriyet',
    description: 'Mahallede biriken atık şikayetleri artıyor.',
    contextTag: 'test',
    urgencyHours: 4,
    day: 2,
    previewEffects: { publicSatisfaction: -3, risk: 1, xp: 0 },
    decisions: [
      {
        id: 'd_fast',
        title: 'Hızlı sevk',
        description: 'Ekibi hemen yönlendir',
        style: 'bold',
        decisionStyle: 'fast',
        effects: { publicSatisfaction: 2, budget: -1500, morale: -2, risk: -1, xp: 0 },
      },
      {
        id: 'd_balanced',
        title: 'Dengeli yönlendirme',
        description: 'Kaynakları dengeli kullan',
        style: 'balanced',
        recommended: true,
        effects: { publicSatisfaction: 3, budget: -1200, morale: -1, risk: -1, xp: 0 },
      },
      {
        id: 'd_economy',
        title: 'Düşük maliyetli müdahale',
        description: 'Kaynak tasarrufu odaklı',
        style: 'cautious',
        decisionStyle: 'resource_saving',
        effects: { publicSatisfaction: 1, budget: -600, morale: 0, risk: 0, xp: 0 },
      },
    ],
    ...partial,
  };
}

function sampleAssignment(partial?: Partial<EventAssignmentState>): EventAssignmentState {
  return {
    eventId: 'evt_dispatch_motion',
    day: 2,
    status: 'confirmed',
    source: 'player',
    personnelType: 'field_response_team',
    vehicleType: 'standard_truck',
    approachType: 'balanced_response',
    compatibilityScore: 72,
    compatibilityLabel: 'Dengeli uyum',
    effects: [],
    ...partial,
  };
}

export function verifyOperationDispatchMotionScenario(): VerifyOperationDispatchMotionOutcome {
  const checks: Check[] = [];
  const event = sampleEvent();
  const assignment = sampleAssignment();

  const idleModel = buildEventDispatchPhasePresentation({
    event,
    assignment,
    compatibility: {
      score: 72,
      label: 'Dengeli uyum',
      summary: 'Operasyon ataması dengeli görünüyor.',
      warnings: [],
      strengths: ['Ekip uygun'],
      effects: [],
    },
    selectedPlanStrategyId: 'balanced_plan',
    selectedPlanStrategyLabel: getPlanStrategyLabel('balanced_plan'),
    assignmentReady: true,
    hasSelectedDecision: true,
    dispatchInteractionState: 'idle',
    day: 2,
  });

  const dispatchingModel = buildEventDispatchPhasePresentation({
    event,
    assignment,
    assignmentReady: true,
    hasSelectedDecision: true,
    dispatchInteractionState: 'dispatching',
    selectedPlanStrategyId: 'rapid_response',
    day: 2,
  });

  const lowDataModel = buildEventDispatchPhasePresentation({
    event: sampleEvent({
      id: 'evt_dispatch_low',
      title: 'Genel operasyon',
      riskLevel: 'low',
      district: '',
      description: '',
      previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
      decisions: [
        {
          id: 'd_basic',
          title: 'Standart müdahale',
          description: 'Temel operasyon',
          style: 'balanced',
          effects: { publicSatisfaction: 1, budget: 0, morale: 0, risk: 0, xp: 0 },
        },
      ],
    }),
    assignmentReady: false,
    hasSelectedDecision: false,
    day: 2,
  });

  const weakCompatModel = buildEventDispatchPhasePresentation({
    event,
    assignment: sampleAssignment({
      compatibilityLabel: 'Zayıf uyum',
      compatibilityScore: 38,
    }),
    compatibility: {
      score: 38,
      label: 'Zayıf uyum',
      summary: 'Atama riskli görünüyor.',
      warnings: ['Yorgunluk riski'],
      strengths: [],
      effects: [],
    },
    assignmentReady: true,
    hasSelectedDecision: true,
    selectedPlanStrategyId: 'rapid_response',
    day: 3,
  });

  const reducedMotionModel = buildEventDispatchPhasePresentation({
    event,
    assignment,
    assignmentReady: true,
    hasSelectedDecision: true,
    dispatchInteractionState: 'dispatching',
    reducedMotion: true,
    day: 2,
  });

  const auditIssues = auditEventDispatchPhasePresentation(idleModel);
  assert(checks, auditIssues.length === 0, 'Presentation audit temiz', auditIssues.join(', '));

  assert(checks, idleModel.title.trim().length > 0, 'title boş değil', idleModel.title);
  assert(
    checks,
    idleModel.accessibilityLabel.trim().length > 0,
    'accessibilityLabel boş değil',
    idleModel.accessibilityLabel.slice(0, 40),
  );
  assert(
    checks,
    idleModel.selectedPlan.label.length > 0 && idleModel.selectedPlan.summary.length > 0,
    'selectedPlan label/summary dolu',
    idleModel.selectedPlan.label,
  );
  assert(
    checks,
    idleModel.compatibility.reasons.length <= 3,
    'compatibility reasons max 3',
    String(idleModel.compatibility.reasons.length),
  );
  assert(
    checks,
    ['low', 'medium', 'high', 'unknown'].includes(idleModel.compatibility.scoreBand),
    'compatibility scoreBand enum içinde',
    idleModel.compatibility.scoreBand,
  );

  const stepIds = idleModel.routePreview.steps.map((s) => s.id);
  assert(
    checks,
    idleModel.routePreview.steps.length >= 3 &&
      idleModel.routePreview.steps.length <= 4 &&
      new Set(stepIds).size === stepIds.length,
    'routePreview steps 3-4 ve duplicate yok',
    stepIds.join(','),
  );

  assert(
    checks,
    !lowDataModel.advisorComment.text.toLowerCase().includes('acil'),
    'low data fake urgent üretmez',
    lowDataModel.advisorComment.text.slice(0, 40),
  );

  assert(
    checks,
    !lowDataModel.primaryCta.enabled,
    'CTA assignment hazır değilse disabled',
    lowDataModel.primaryCta.actionKey,
  );
  assert(
    checks,
    idleModel.primaryCta.enabled && idleModel.primaryCta.actionKey === 'send_to_field',
    'CTA ready ise send_to_field enabled',
    idleModel.primaryCta.actionKey,
  );

  const dispatchMs = dispatchingModel.dispatchFeedback.durationMs;
  assert(
    checks,
    dispatchMs >= 500 && dispatchMs <= 700,
    'dispatchFeedback duration 500-700ms',
    String(dispatchMs),
  );
  assert(
    checks,
    reducedMotionModel.dispatchFeedback.durationMs === 0,
    'reduced motion dispatch süresi kısa',
    String(reducedMotionModel.dispatchFeedback.durationMs),
  );
  assert(
    checks,
    operationMotionDispatchSentDurationMs(true) === 0,
    'reduced motion sent süresi kısa',
    'ok',
  );

  const rapidLabel = getPlanStrategyLabel('rapid_response');
  assert(
    checks,
    suggestDecisionIdForPlanStrategy(event, 'rapid_response') === 'd_fast',
    'selectedPlanStrategyId → decision mapping',
    rapidLabel,
  );

  assert(
    checks,
    idleModel.advisorComment.text.trim().length > 0,
    'Ece dispatch comment boş değil',
    idleModel.advisorComment.text.slice(0, 50),
  );

  const planModel = buildEventPlanPhasePresentation({
    event,
    day: 2,
    selectedStrategyId: 'balanced_plan',
  });
  assert(
    checks,
    dispatchAdvisorDiffersFromPlanAdvisor(
      idleModel.advisorComment.text,
      planModel.advisorComment.text,
    ),
    'Ece plan comment ile birebir duplicate değil',
    'ok',
  );

  assert(
    checks,
    weakCompatModel.advisorComment.tone === 'warning' ||
      weakCompatModel.compatibility.tone === 'warning',
    'low compatibility Ece uyarısı belirgin',
    weakCompatModel.advisorComment.tone,
  );

  assert(
    checks,
    typeof buildPlanScreenModel(event).recommendedOptionId === 'string',
    'result engine / applyDecision balance değiştirilmez',
    'presentation-only',
  );

  const workflowSteps = OPERATION_WORKFLOW_STEPS.map((step) => step.id);
  assert(
    checks,
    workflowSteps.includes('assign') && workflowSteps.includes('field'),
    "setOperationStep('field') geçiş pattern'i korunur",
    workflowSteps.join(' → '),
  );

  const strategies: EventPlanStrategyId[] = [
    'rapid_response',
    'balanced_plan',
    'long_term_fix',
  ];
  for (const strategyId of strategies) {
    const model = buildEventDispatchPhasePresentation({
      event,
      assignment,
      assignmentReady: true,
      hasSelectedDecision: true,
      selectedPlanStrategyId: strategyId,
      day: 2,
    });
    const issues = auditEventDispatchPhasePresentation(model);
    assert(
      checks,
      issues.length === 0,
      `strategy ${strategyId} güvenli model`,
      issues.join(', ') || 'ok',
    );
  }

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'OK' : 'FAIL'} ${c.name}: ${c.detail}`),
  };
}
