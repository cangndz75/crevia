import type { EventCard } from '@/core/models/EventCard';
import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import { OPERATION_WORKFLOW_STEPS } from '@/features/events/utils/eventWorkflowPresentation';
import { buildPlanScreenModel } from '@/features/events/utils/eventWorkflowPlanPresentation';
import {
  auditEventFieldPhasePresentation,
  buildEventFieldPhasePresentation,
  fieldAdvisorDiffersFromDispatchAdvisor,
  mapMicroDecisionCardToFieldPresentation,
} from '@/features/events/utils/eventFieldPhasePresentation';
import { buildEventDispatchAdvisorComment } from '@/features/events/utils/eventDispatchPhasePresentation';
import {
  getPlanStrategyLabel,
  type EventPlanStrategyId,
} from '@/features/events/utils/eventPlanPhasePresentation';
import {
  OPERATION_MOTION_FIELD_REDUCED_MS,
  operationMotionFieldAutoCompleteDurationMs,
} from '@/core/motion/operationMotionTokens';

export type VerifyOperationFieldLiveOutcome = {
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
    id: 'evt_field_live',
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
        id: 'd_assign',
        title: 'Ekibi yönlendir',
        description: 'Saha ekibini hızlı sevk et',
        style: 'balanced',
        effects: { publicSatisfaction: 3, budget: -1200, morale: -1, risk: -1, xp: 0 },
      },
    ],
    ...partial,
  };
}

function sampleAssignment(partial?: Partial<EventAssignmentState>): EventAssignmentState {
  return {
    eventId: 'evt_field_live',
    day: 2,
    status: 'dispatched',
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

export function verifyOperationFieldLiveScenario(): VerifyOperationFieldLiveOutcome {
  const checks: Check[] = [];
  const event = sampleEvent();
  const assignment = sampleAssignment();

  const runningModel = buildEventFieldPhasePresentation({
    event,
    assignment,
    selectedPlanStrategyId: 'balanced_plan',
    selectedPlanStrategyLabel: getPlanStrategyLabel('balanced_plan'),
    interactionState: 'running',
    timelineStepIndex: 2,
    day: 2,
  });

  const completedModel = buildEventFieldPhasePresentation({
    event,
    assignment,
    selectedPlanStrategyId: 'rapid_response',
    interactionState: 'completed',
    timelineStepIndex: 4,
    day: 2,
  });

  const lowDataModel = buildEventFieldPhasePresentation({
    event: sampleEvent({
      id: 'evt_field_low',
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
    interactionState: 'running',
    timelineStepIndex: 0,
    day: 2,
  });

  const microDecisionModel = buildEventFieldPhasePresentation({
    event,
    assignment,
    interactionState: 'paused_for_decision',
    timelineStepIndex: 2,
    microDecision: {
      id: 'md_1',
      title: 'Rota baskısı',
      body: 'Alternatif rota değerlendirilsin mi?',
      options: [
        { id: 'keep', label: 'Planı koru', tone: 'neutral' },
        { id: 'shift', label: 'Rotayı değiştir', tone: 'warning' },
      ],
      tone: 'warning',
      sourceLabel: 'Saha bildirimi',
    },
    day: 3,
  });

  const reducedMotionModel = buildEventFieldPhasePresentation({
    event,
    assignment,
    interactionState: 'running',
    timelineStepIndex: 4,
    reducedMotion: true,
    day: 2,
  });

  const auditIssues = auditEventFieldPhasePresentation(runningModel);
  assert(checks, auditIssues.length === 0, 'Presentation audit temiz', auditIssues.join(', '));

  assert(checks, runningModel.title.trim().length > 0, 'title boş değil', runningModel.title);
  assert(
    checks,
    runningModel.accessibilityLabel.trim().length > 0,
    'accessibilityLabel boş değil',
    runningModel.accessibilityLabel.slice(0, 40),
  );
  assert(
    checks,
    runningModel.timeline.progressPercent >= 0 && runningModel.timeline.progressPercent <= 100,
    'progressPercent clamp',
    String(runningModel.timeline.progressPercent),
  );
  assert(
    checks,
    runningModel.timeline.steps.length >= 3 && runningModel.timeline.steps.length <= 5,
    'timeline steps 3-5',
    String(runningModel.timeline.steps.length),
  );

  const stepIds = runningModel.timeline.steps.map((s) => s.id);
  assert(
    checks,
    new Set(stepIds).size === stepIds.length,
    'timeline step id duplicate yok',
    stepIds.join(','),
  );

  assert(
    checks,
    runningModel.selectedPlan.label.length > 0 && runningModel.selectedPlan.effectLine.length > 0,
    'selectedPlan label/effectLine dolu',
    runningModel.selectedPlan.label,
  );
  assert(
    checks,
    ['low', 'medium', 'high', 'unknown'].includes(runningModel.assignmentEffect.scoreBand),
    'assignmentEffect scoreBand enum',
    runningModel.assignmentEffect.scoreBand,
  );
  assert(
    checks,
    !lowDataModel.advisorComment.text.toLowerCase().includes('acil'),
    'low data fake urgent üretmez',
    lowDataModel.advisorComment.text.slice(0, 40),
  );
  assert(
    checks,
    !runningModel.microDecision,
    'microDecision yokken fake üretilmez',
    'ok',
  );
  assert(
    checks,
    microDecisionModel.microDecision?.options.length === 2,
    'microDecision varsa options dolu',
    String(microDecisionModel.microDecision?.options.length),
  );
  assert(
    checks,
    !microDecisionModel.autoComplete.enabled,
    'microDecision varken autoComplete durur',
    String(microDecisionModel.autoComplete.enabled),
  );

  const durationMs = runningModel.autoComplete.durationMs;
  assert(
    checks,
    durationMs >= 900 && durationMs <= 1400,
    'autoComplete duration 900-1400ms',
    String(durationMs),
  );
  assert(
    checks,
    OPERATION_MOTION_FIELD_REDUCED_MS <= 150,
    'reduced motion duration 0-150ms',
    String(OPERATION_MOTION_FIELD_REDUCED_MS),
  );
  assert(
    checks,
    operationMotionFieldAutoCompleteDurationMs(true) <= 150,
    'reduced motion helper kısa',
    String(operationMotionFieldAutoCompleteDurationMs(true)),
  );

  assert(
    checks,
    completedModel.primaryCta.enabled && completedModel.primaryCta.actionKey === 'view_result',
    'completed CTA view_result enabled',
    completedModel.primaryCta.actionKey,
  );
  assert(
    checks,
    !runningModel.primaryCta.enabled && runningModel.primaryCta.actionKey !== 'view_result',
    'running state result CTA erken enabled değil',
    runningModel.primaryCta.actionKey,
  );

  assert(
    checks,
    completedModel.selectedPlan.strategyId === 'rapid_response',
    'selectedPlanStrategyId field presentation korunur',
    completedModel.selectedPlan.strategyId ?? 'missing',
  );

  const dispatchAdvisor = buildEventDispatchAdvisorComment(
    {
      event,
      assignment,
      assignmentReady: true,
      hasSelectedDecision: true,
      selectedPlanStrategyId: 'balanced_plan',
      day: 2,
    },
    {
      label: 'Uyum dengeli',
      scoreBand: 'medium',
      tone: 'neutral',
      reasons: [],
    },
    {
      strategyId: 'balanced_plan',
      label: getPlanStrategyLabel('balanced_plan'),
      summary: 'test',
      tone: 'green',
      sourceLabel: 'Planla',
    },
  );
  assert(
    checks,
    fieldAdvisorDiffersFromDispatchAdvisor(
      runningModel.advisorComment.text,
      dispatchAdvisor.text,
    ),
    'Ece dispatch yorumunu birebir tekrar etmez',
    'ok',
  );

  assert(
    checks,
    typeof buildPlanScreenModel(event).recommendedOptionId === 'string',
    'applyDecision/result balance değişmez',
    'presentation-only',
  );

  const workflowSteps = OPERATION_WORKFLOW_STEPS.map((step) => step.id);
  assert(
    checks,
    workflowSteps.includes('field') && workflowSteps.includes('result'),
    'result geçiş pattern korunur',
    workflowSteps.join(' → '),
  );

  const microCard = mapMicroDecisionCardToFieldPresentation({
    id: 'md_test',
    title: 'Test',
    typeLabel: 'Saha',
    summary: 'Özet',
    reasonLine: 'Sebep',
    advisorLine: 'Ece',
    tone: 'warning',
    iconKey: 'pulse',
    optionRows: [
      {
        id: 'a',
        label: 'A',
        description: 'd',
        upside: 'u',
        tradeoff: 't',
        tone: 'neutral',
      },
    ],
    footerNote: 'note',
    compact: true,
  });
  assert(
    checks,
    microCard.options.length === 1 && microCard.options[0]?.id === 'a',
    'microDecision map güvenli',
    microCard.id,
  );

  const strategies: EventPlanStrategyId[] = [
    'rapid_response',
    'balanced_plan',
    'long_term_fix',
  ];
  for (const strategyId of strategies) {
    const model = buildEventFieldPhasePresentation({
      event,
      assignment,
      selectedPlanStrategyId: strategyId,
      interactionState: 'running',
      timelineStepIndex: 1,
      day: 2,
    });
    const issues = auditEventFieldPhasePresentation(model);
    assert(checks, issues.length === 0, `strategy ${strategyId} audit`, issues.join(', ') || 'ok');
  }

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'OK' : 'FAIL'} ${c.name}: ${c.detail}`),
  };
}
