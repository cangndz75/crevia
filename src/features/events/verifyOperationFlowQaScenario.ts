import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { verifyMotionFoundationScenario } from '@/core/motion/verifyMotionFoundationScenario';
import {
  OPERATION_MOTION_DISPATCH_MAX_MS,
  OPERATION_MOTION_DISPATCH_MIN_MS,
  OPERATION_MOTION_FIELD_PROGRESS_MAX_MS,
  OPERATION_MOTION_FIELD_PROGRESS_MIN_MS,
  OPERATION_MOTION_FINDING_REVEAL_MS,
  OPERATION_MOTION_PLAN_SELECT_MS,
  OPERATION_MOTION_REDUCED_MAX_MS,
  OPERATION_MOTION_RESULT_TOTAL_MS,
  OPERATION_MOTION_SCAN_MAX_MS,
  OPERATION_MOTION_SCAN_MIN_MS,
  operationMotionDispatchDurationMs,
  operationMotionFieldAutoCompleteDurationMs,
  operationMotionPlanSelectDurationMs,
  operationMotionResultRevealStaggerMs,
  operationMotionResultRevealTotalMs,
  operationMotionScanDurationMs,
} from '@/core/motion/operationMotionTokens';
import { verifyMainOperationFeelScenario } from '@/core/mainOperationFeel/verifyMainOperationFeelScenario';
import { verifyDispatchFieldUiScenario } from '@/features/events/verifyDispatchFieldUiScenario';
import { verifyEventResultUiScenario } from '@/features/events/verifyEventResultUiScenario';
import { verifyOperationDispatchMotionScenario } from '@/features/events/verifyOperationDispatchMotionScenario';
import { verifyOperationFieldLiveScenario } from '@/features/events/verifyOperationFieldLiveScenario';
import { verifyOperationInspectUiScenario } from '@/features/events/verifyOperationInspectUiScenario';
import { verifyOperationPlanUiScenario } from '@/features/events/verifyOperationPlanUiScenario';
import { verifyOperationResultRevealScenario } from '@/features/events/verifyOperationResultRevealScenario';
import type { EventCard } from '@/core/models/EventCard';
import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import {
  buildEventDispatchPhasePresentation,
  suggestDecisionIdForPlanStrategy,
} from '@/features/events/utils/eventDispatchPhasePresentation';
import {
  buildEventFieldPhasePresentation,
} from '@/features/events/utils/eventFieldPhasePresentation';
import {
  buildEventInspectPhasePresentation,
} from '@/features/events/utils/eventInspectPhasePresentation';
import {
  buildEventPlanPhasePresentation,
  getPlanStrategyLabel,
  type EventPlanStrategyId,
} from '@/features/events/utils/eventPlanPhasePresentation';
import {
  buildEventResultRevealPresentation,
} from '@/features/events/utils/eventResultRevealPresentation';
import { createEmptyDecisionResultFallback } from '@/features/events/utils/decisionResultModel';
import { OPERATION_WORKFLOW_STEPS } from '@/features/events/utils/eventWorkflowPresentation';
import {
  auditOperationPhaseTransitionPresentation,
  OPERATION_PHASE_CTA_LABELS,
} from '@/features/events/utils/operationPhaseTransitionPresentation';
import { SAVE_VERSION } from '@/store/gamePersist';

const REPO_ROOT = join(__dirname, '..', '..', '..');

const TECHNICAL_ENUM_PATTERN =
  /\b(rapid_response|balanced_plan|long_term_fix|paused_for_decision|dispatching|view_result)\b/i;

const OPERATION_PHASE_FILES = [
  'src/features/events/components/event-workflow/EventInspectPhase.tsx',
  'src/features/events/components/event-workflow/EventPlanPhase.tsx',
  'src/features/events/components/event-workflow/dispatch/EventDispatchPhase.tsx',
  'src/features/events/components/event-workflow/field/EventFieldPhase.tsx',
  'src/features/events/screens/DecisionResultScreen.tsx',
  'src/features/events/screens/EventDetailDecisionScreen.tsx',
];

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

export type VerifyOperationFlowQaOutcome = {
  ok: boolean;
  failCount: number;
  checks: string[];
};

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

function sampleEvent(): EventCard {
  return {
    id: 'evt_flow_qa',
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
        id: 'd_fast',
        title: 'Hızlı sevk',
        description: '',
        style: 'bold',
        decisionStyle: 'fast',
        effects: { publicSatisfaction: 2, budget: -1500, morale: -2, risk: -1, xp: 0 },
      },
      {
        id: 'd_balanced',
        title: 'Dengeli yönlendirme',
        description: '',
        style: 'balanced',
        recommended: true,
        effects: { publicSatisfaction: 3, budget: -1200, morale: -1, risk: -1, xp: 0 },
      },
    ],
  };
}

function sampleAssignment(): EventAssignmentState {
  return {
    eventId: 'evt_flow_qa',
    day: 2,
    status: 'confirmed',
    source: 'player',
    personnelType: 'field_response_team',
    vehicleType: 'standard_truck',
    approachType: 'balanced_response',
    compatibilityScore: 72,
    compatibilityLabel: 'Dengeli uyum',
    effects: [],
  };
}

function collectPresentationStrings(
  values: Array<string | undefined | null>,
): string {
  return values.filter(Boolean).join(' ');
}

export function verifyOperationFlowQaScenario(): VerifyOperationFlowQaOutcome {
  const checks: Check[] = [];
  const event = sampleEvent();
  const assignment = sampleAssignment();
  const strategyId: EventPlanStrategyId = 'balanced_plan';

  const subVerifies = [
    { name: 'verify:operation-inspect-ui', run: verifyOperationInspectUiScenario },
    { name: 'verify:operation-plan-ui', run: verifyOperationPlanUiScenario },
    { name: 'verify:operation-dispatch-motion', run: verifyOperationDispatchMotionScenario },
    { name: 'verify:operation-field-live', run: verifyOperationFieldLiveScenario },
    { name: 'verify:operation-result-reveal', run: verifyOperationResultRevealScenario },
    { name: 'verify:event-result-ui', run: verifyEventResultUiScenario },
    { name: 'verify:dispatch-field-ui', run: verifyDispatchFieldUiScenario },
    { name: 'verify:motion-foundation', run: verifyMotionFoundationScenario },
    { name: 'verify:main-operation-feel', run: verifyMainOperationFeelScenario },
  ] as const;

  for (const sub of subVerifies) {
    const outcome = sub.run();
    const failDetail =
      'failCount' in outcome && typeof outcome.failCount === 'number'
        ? String(outcome.failCount)
        : outcome.checks?.filter((line) => line.startsWith('FAIL')).length.toString() ?? '0';
    assert(checks, outcome.ok, `${sub.name} PASS`, failDetail);
  }

  assert(
    checks,
    OPERATION_WORKFLOW_STEPS.map((s) => s.id).join(',') ===
      'inspect,plan,assign,field,result',
    'workflow step sırası korunur',
    OPERATION_WORKFLOW_STEPS.map((s) => s.id).join(','),
  );

  const inspectIdle = buildEventInspectPhasePresentation({
    event,
    day: 2,
    interactionState: 'idle',
  });
  const inspectAnalyzing = buildEventInspectPhasePresentation({
    event,
    day: 2,
    interactionState: 'analyzing',
  });
  const inspectRevealed = buildEventInspectPhasePresentation({
    event,
    day: 2,
    interactionState: 'revealed',
  });
  const planModel = buildEventPlanPhasePresentation({
    event,
    day: 2,
    selectedStrategyId: strategyId,
  });
  const dispatchModel = buildEventDispatchPhasePresentation({
    event,
    assignment,
    compatibility: {
      score: 72,
      label: 'Dengeli uyum',
      summary: 'Ekip hazır',
      warnings: [],
      strengths: ['Ekip hazır'],
      effects: [],
    },
    selectedPlanStrategyId: strategyId,
    selectedPlanStrategyLabel: getPlanStrategyLabel(strategyId),
    assignmentReady: true,
    hasSelectedDecision: true,
  });
  const fieldModel = buildEventFieldPhasePresentation({
    event,
    assignment,
    selectedPlanStrategyId: strategyId,
    interactionState: 'running',
    timelineStepIndex: 2,
  });
  const fieldCompleted = buildEventFieldPhasePresentation({
    event,
    assignment,
    selectedPlanStrategyId: strategyId,
    interactionState: 'completed',
    timelineStepIndex: 4,
  });
  const resultModel = buildEventResultRevealPresentation({
    snapshot: {
      ...createEmptyDecisionResultFallback(),
      eventTitle: event.title,
      summaryTitle: 'Operasyon tamamlandı',
      summaryText: 'Karar uygulandı.',
      resultTone: 'positive',
      day: 2,
      neighborhoodName: 'Cumhuriyet',
    },
    event,
    selectedPlanStrategyId: strategyId,
    day: 2,
  });

  assert(checks, inspectIdle.primaryCta.enabled === true, 'İncele idle CTA başlat', inspectIdle.primaryCta.actionKey);
  assert(checks, inspectIdle.primaryCta.actionKey === 'start_inspection', 'İncele idle action', inspectIdle.primaryCta.actionKey);
  assert(checks, inspectAnalyzing.primaryCta.enabled === false, 'İncele analyzing CTA disabled', inspectAnalyzing.primaryCta.actionKey);
  assert(checks, inspectRevealed.primaryCta.enabled === true, 'İncele revealed CTA enabled', inspectRevealed.primaryCta.actionKey);
  assert(checks, inspectRevealed.primaryCta.actionKey === 'go_to_plan', 'İncele → Planla CTA', inspectRevealed.primaryCta.actionKey);
  assert(checks, planModel.primaryCta.actionKey === 'go_to_dispatch', 'Planla → Yönlendir CTA', planModel.primaryCta.actionKey);
  assert(checks, dispatchModel.primaryCta.actionKey === 'send_to_field', 'Yönlendir → Sahada CTA', dispatchModel.primaryCta.actionKey);
  assert(checks, fieldCompleted.primaryCta.actionKey === 'view_result', 'Sahada completed Sonucu Gör', fieldCompleted.primaryCta.actionKey);

  assert(
    checks,
    inspectRevealed.phaseTransition.primaryCta.label === OPERATION_PHASE_CTA_LABELS.inspect &&
      planModel.phaseTransition.primaryCta.label === OPERATION_PHASE_CTA_LABELS.plan &&
      dispatchModel.phaseTransition.primaryCta.label === OPERATION_PHASE_CTA_LABELS.dispatch &&
      fieldCompleted.phaseTransition.primaryCta.label === OPERATION_PHASE_CTA_LABELS.field &&
      resultModel.phaseTransition.primaryCta.label === OPERATION_PHASE_CTA_LABELS.result,
    'Faz CTA zinciri tutarlı',
    [
      inspectRevealed.phaseTransition.primaryCta.label,
      planModel.phaseTransition.primaryCta.label,
      dispatchModel.phaseTransition.primaryCta.label,
      fieldCompleted.phaseTransition.primaryCta.label,
      resultModel.phaseTransition.primaryCta.label,
    ].join(' | '),
  );

  const phaseTransitionModels = [
    { name: 'inspect', model: inspectRevealed.phaseTransition },
    { name: 'plan', model: planModel.phaseTransition },
    { name: 'dispatch', model: dispatchModel.phaseTransition },
    { name: 'field', model: fieldModel.phaseTransition },
    { name: 'result', model: resultModel.phaseTransition },
  ];
  for (const entry of phaseTransitionModels) {
    const issues = auditOperationPhaseTransitionPresentation(entry.model);
    const activeItem = entry.model.progress.items.find((item) => item.status === 'active');
    assert(
      checks,
      issues.length === 0,
      `phaseTransition audit: ${entry.name}`,
      issues.join(', ') || 'ok',
    );
    assert(
      checks,
      entry.model.progress.items.length === 5 && Boolean(activeItem),
      `phase progress rail: ${entry.name}`,
      activeItem?.id ?? 'missing active',
    );
    if (entry.name !== 'inspect') {
      assert(
        checks,
        Boolean(entry.model.bridge?.summary.trim()),
        `phase bridge summary: ${entry.name}`,
        entry.model.bridge?.summary ?? 'missing',
      );
    }
  }

  assert(
    checks,
    dispatchModel.selectedPlan.label.includes(getPlanStrategyLabel(strategyId)),
    'Dispatch seçili plan görünür',
    dispatchModel.selectedPlan.label,
  );
  assert(
    checks,
    fieldModel.selectedPlan.label.length > 0,
    'Field seçili plan korunur',
    fieldModel.selectedPlan.label,
  );
  assert(
    checks,
    Boolean(resultModel.selectedPlanContext?.label?.includes('sonucu')),
    'Result selectedPlanContext görünür',
    resultModel.selectedPlanContext?.label ?? 'missing',
  );

  const mappedDecision = suggestDecisionIdForPlanStrategy(event, strategyId);
  assert(checks, Boolean(mappedDecision), 'Plan strategy → decision bridge', mappedDecision ?? 'missing');

  assert(
    checks,
    inRange(operationMotionScanDurationMs(false), OPERATION_MOTION_SCAN_MIN_MS, OPERATION_MOTION_SCAN_MAX_MS),
    'İncele scan süresi policy',
    String(operationMotionScanDurationMs(false)),
  );
  assert(
    checks,
    operationMotionScanDurationMs(true) <= OPERATION_MOTION_REDUCED_MAX_MS,
    'İncele scan reduced motion',
    String(operationMotionScanDurationMs(true)),
  );
  assert(
    checks,
    inRange(OPERATION_MOTION_FINDING_REVEAL_MS, 160, 240),
    'İncele finding reveal süresi',
    String(OPERATION_MOTION_FINDING_REVEAL_MS),
  );
  assert(
    checks,
    inRange(operationMotionPlanSelectDurationMs(false), 160, 220),
    'Planla selection süresi',
    String(operationMotionPlanSelectDurationMs(false)),
  );
  assert(
    checks,
    operationMotionPlanSelectDurationMs(true) <= OPERATION_MOTION_REDUCED_MAX_MS,
    'Planla selection reduced',
    String(operationMotionPlanSelectDurationMs(true)),
  );
  assert(
    checks,
    inRange(operationMotionDispatchDurationMs(false), OPERATION_MOTION_DISPATCH_MIN_MS, OPERATION_MOTION_DISPATCH_MAX_MS),
    'Dispatch süresi policy',
    String(operationMotionDispatchDurationMs(false)),
  );
  assert(
    checks,
    inRange(
      operationMotionFieldAutoCompleteDurationMs(false),
      OPERATION_MOTION_FIELD_PROGRESS_MIN_MS,
      OPERATION_MOTION_FIELD_PROGRESS_MAX_MS,
    ),
    'Field auto-complete süresi',
    String(operationMotionFieldAutoCompleteDurationMs(false)),
  );
  assert(
    checks,
    inRange(operationMotionResultRevealTotalMs(false), 1200, 1800),
    'Result total reveal süresi',
    String(operationMotionResultRevealTotalMs(false)),
  );
  assert(
    checks,
    operationMotionResultRevealTotalMs(true) <= OPERATION_MOTION_REDUCED_MAX_MS,
    'Result reduced motion süresi',
    String(operationMotionResultRevealTotalMs(true)),
  );
  assert(
    checks,
    operationMotionResultRevealStaggerMs(true) === 0,
    'Result reduced stagger sıfır',
    'ok',
  );
  assert(
    checks,
    OPERATION_MOTION_PLAN_SELECT_MS === 180,
    'Plan select token sabit',
    String(OPERATION_MOTION_PLAN_SELECT_MS),
  );
  assert(
    checks,
    OPERATION_MOTION_RESULT_TOTAL_MS === 1500,
    'Result total token sabit',
    String(OPERATION_MOTION_RESULT_TOTAL_MS),
  );

  const phaseSources = OPERATION_PHASE_FILES.map(readRepo).join('\n');
  assert(checks, phaseSources.includes('OperationPhaseProgressRail'), 'phase progress rail bağlı', 'ok');
  assert(checks, phaseSources.includes('OperationPhaseBridgeCard'), 'phase bridge card bağlı', 'ok');
  assert(checks, !phaseSources.includes('setInterval'), 'setInterval kullanılmıyor', 'ok');
  assert(checks, !/withRepeat\([^,]+,\s*-1/.test(phaseSources), 'withRepeat(-1) yok', 'ok');
  assert(checks, phaseSources.includes('clearTimeout'), 'timer cleanup pattern var', 'ok');
  assert(checks, !readRepo('src/store/gamePersist.ts').includes('lastOperationPlanStrategyId'), 'plan strategy persist edilmez', 'ok');

  const presentationText = collectPresentationStrings([
    inspectRevealed.accessibilityLabel,
    inspectRevealed.title,
    planModel.accessibilityLabel,
    planModel.title,
    dispatchModel.accessibilityLabel,
    fieldModel.accessibilityLabel,
    resultModel.accessibilityLabel,
    resultModel.title,
    ...planModel.strategies.map((s) => s.title),
    ...resultModel.revealItems.map((i) => `${i.title} ${i.body}`),
    ...resultModel.finalActions.map((a) => a.label),
  ]);
  assert(
    checks,
    !TECHNICAL_ENUM_PATTERN.test(presentationText),
    'UI teknik enum göstermiyor',
    'ok',
  );

  for (const model of [inspectRevealed, planModel, dispatchModel, fieldModel, resultModel]) {
    const label = 'accessibilityLabel' in model ? model.accessibilityLabel : '';
    assert(checks, label.trim().length > 0, `${model.title} accessibilityLabel dolu`, label.slice(0, 30));
  }

  for (const action of resultModel.finalActions) {
    if (action.enabled && action.id !== 'next_day') {
      assert(checks, Boolean(action.route), `Result action route: ${action.id}`, action.route ?? '');
    }
  }

  const fieldNoMicro = buildEventFieldPhasePresentation({
    event,
    assignment,
    selectedPlanStrategyId: strategyId,
    interactionState: 'running',
    microDecision: null,
  });
  assert(checks, !fieldNoMicro.microDecision, 'MicroDecision fake üretilmez', 'ok');

  assert(
    checks,
    resultModel.advisorComment.tone !== 'warning' || resultModel.outcome.outcomeBand === 'risk',
    'Başarılı sonuçta gereksiz warning advisor yok',
    resultModel.advisorComment.tone,
  );

  assert(checks, !readRepo('src/features/events/screens/DecisionResultScreen.tsx').includes('function RewardHero'), 'Result RewardHero temizlendi', 'ok');
  assert(checks, readRepo('package.json').includes('verify:operation-flow-qa'), 'package script var', 'ok');
  assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-operation-flow-performance-qa.md')), 'QA doc var', 'ok');
  assert(checks, SAVE_VERSION > 0, 'SAVE_VERSION okunabilir', String(SAVE_VERSION));

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'OK' : 'FAIL'} ${c.name}: ${c.detail}`),
  };
}
