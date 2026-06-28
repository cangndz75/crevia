import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import type { EventCard } from '@/core/models/EventCard';
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
import type { DecisionResultSnapshot } from '@/features/events/types/decisionResultTypes';
import { buildPostDecisionCityReactionPresentation } from '@/features/events/utils/postDecisionCityReactionPresentation';
import {
  buildOperationWorkflowClarityPresentation,
} from '@/features/events/utils/operationWorkflowClarityPresentation';
import type { OperationFieldRiskTendency } from '@/features/events/utils/operationFieldLivePresentation';
import {
  OPERATION_PHASE_CTA_LABELS,
  type OperationPhaseKey,
} from '@/features/events/utils/operationPhaseTransitionPresentation';
import {
  resolveOperationResultRevealTone,
  type OperationResultRevealToneId,
} from '@/features/events/utils/operationResultToneModel';

export const OPERATION_WORKFLOW_CONCEPT_LABELS = {
  operationRisk: 'Operasyon riski',
  neighborhoodReaction: 'Mahalle tepkisi',
  trustImpact: 'Güven etkisi',
  resourcePressure: 'Kaynak baskısı',
  readinessMaintenance: 'Hazırlık',
  teamFatigue: 'Ekip yorgunluğu',
  tomorrowRipple: 'Yarına yansıma',
  decisionStyle: 'Karar tarzı',
  outcomeTone: 'Sonuç tonu',
} as const;

export type OperationWorkflowDensityBand = 'day1' | 'openEnded';

export type OperationDecisionImpactChain = {
  strategyId: EventPlanStrategyId;
  planPreview: string;
  planTradeoffHint: string;
  dispatchReadiness: string;
  fieldImpact: string;
  resultSummary: string;
  dayEndStyle: string;
  keywords: string[];
  compatibleResultTones: OperationResultRevealToneId[];
};

export const DECISION_IMPACT_CHAIN: Record<
  EventPlanStrategyId,
  Omit<OperationDecisionImpactChain, 'strategyId'>
> = {
  rapid_response: {
    planPreview: 'Hızlı müdahale güven kaybını durdurabilir; kaynak baskısı artabilir.',
    planTradeoffHint: 'Kaynak yüksek · Ekip temposu',
    dispatchReadiness: 'Hazır ekip hızlı müdahaleyi destekliyor.',
    fieldImpact: 'Hızlı kontrol sağlandı; kaynak ve ekip temposu zorlanıyor olabilir.',
    resultSummary: 'Hızlı müdahale seçimin güven kaybını durdurdu.',
    dayEndStyle: 'Bugünün tarzı: hızlı müdahale odaklı.',
    keywords: ['hızlı', 'güven', 'kaynak', 'yorgunluk'],
    compatibleResultTones: [
      'clear_success',
      'controlled_success',
      'costly_success',
      'trust_recovery',
      'tomorrow_risk',
      'resource_pressure',
    ],
  },
  balanced_plan: {
    planPreview: 'Dengeli yaklaşım riski büyütmeden kontrol sağlar.',
    planTradeoffHint: 'Dengeli maliyet · Düşük risk',
    dispatchReadiness: 'Ekip dengeli tempo ile plana uyumlu.',
    fieldImpact: 'Dengeli ilerleme sürüyor; kaynak ve süre plan sınırlarında.',
    resultSummary: 'Dengeli yaklaşım riski büyütmeden kontrol sağladı.',
    dayEndStyle: 'Bugünün tarzı: dengeli müdahale.',
    keywords: ['dengeli', 'kontrol', 'risk', 'güven'],
    compatibleResultTones: [
      'controlled_success',
      'partial_success',
      'clear_success',
      'trust_recovery',
      'maintenance_shadow',
    ],
  },
  long_term_fix: {
    planPreview: 'Önleyici plan yarınki baskıyı azaltacak zemin oluşturur.',
    planTradeoffHint: 'Pahalı · Yarın riski düşük',
    dispatchReadiness: 'Ekip önleyici adımlar için hazır.',
    fieldImpact: 'Güven etkisi güçleniyor; müdahale süresi ve maliyet baskısı izleniyor.',
    resultSummary: 'Önleyici plan yarınki baskıyı azaltacak zemin oluşturdu.',
    dayEndStyle: 'Bugünün tarzı: önleyici plan odaklı.',
    keywords: ['önleyici', 'yarın', 'güven', 'maliyet'],
    compatibleResultTones: [
      'controlled_success',
      'partial_success',
      'delayed_response',
      'maintenance_shadow',
      'costly_success',
      'tomorrow_risk',
    ],
  },
};

export function buildOperationDecisionImpactChain(
  strategyId: EventPlanStrategyId,
): OperationDecisionImpactChain {
  const pack = DECISION_IMPACT_CHAIN[strategyId];
  return { strategyId, ...pack };
}

export type OperationWorkflowPhaseSnapshot = {
  phase: OperationPhaseKey;
  intentLabel: string;
  primaryCtaLabel: string;
  primaryCtaActionKey: string;
  primaryCtaEnabled: boolean;
  heroTitle: string;
  insightLineCount: number;
  chipCount: number;
  decisionImpactLine?: string;
  outcomeSignal?: string;
};

export type OperationWorkflowConsistencyPresentation = {
  eventId: string;
  day: number;
  strategyId: EventPlanStrategyId;
  densityBand: OperationWorkflowDensityBand;
  decisionChain: OperationDecisionImpactChain;
  phases: OperationWorkflowPhaseSnapshot[];
  ctaLabels: string[];
  toneCoherence: {
    fieldRiskTrend: OperationFieldRiskTendency;
    fieldRiskLabel: string;
    fieldOutcomeLabel: string;
    resultToneId: OperationResultRevealToneId;
    coherent: boolean;
  };
  hubAlignedTerms: string[];
  motionBudgetMs: number;
};

function clampCount(value: number, max: number): number {
  return Math.min(Math.max(0, value), max);
}

function countPlanInsights(plan: ReturnType<typeof buildEventPlanPhasePresentation>): number {
  const selected = plan.strategies.find((strategy) => strategy.isSelected);
  const tradeoffs = selected?.gameplayTradeoffs.length ?? selected?.tradeoffs.length ?? 0;
  return clampCount(1 + (selected ? 1 : 0) + tradeoffs, 6);
}

function buildSnapshotForStrategy(input: {
  event: EventCard;
  day: number;
  strategyId: EventPlanStrategyId;
  assignment: EventAssignmentState;
  isDay1LearningEvent?: boolean;
}): OperationWorkflowConsistencyPresentation {
  const { event, day, strategyId, assignment } = input;
  const densityBand: OperationWorkflowDensityBand = day <= 1 ? 'day1' : 'openEnded';
  const chain = buildOperationDecisionImpactChain(strategyId);
  const planLabel = getPlanStrategyLabel(strategyId);

  const inspectRevealed = buildEventInspectPhasePresentation({
    event,
    day,
    interactionState: 'revealed',
    isDay1LearningEvent: input.isDay1LearningEvent,
  });
  const inspectClarity = buildOperationWorkflowClarityPresentation({
    event,
    day,
    interactionState: 'revealed',
    confirmedSignalIds: ['field', 'citizen', 'social'],
    findings: inspectRevealed.findings,
    advisorComment: inspectRevealed.advisorComment,
    phaseHeader: inspectRevealed.phaseTransition.shell,
    isDay1LearningEvent: input.isDay1LearningEvent,
  });

  const plan = buildEventPlanPhasePresentation({
    event,
    day,
    selectedStrategyId: strategyId,
    isDay1LearningEvent: input.isDay1LearningEvent,
  });

  const dispatch = buildEventDispatchPhasePresentation({
    event,
    assignment,
    compatibility: {
      score: 78,
      label: 'Güçlü uyum',
      summary: chain.dispatchReadiness,
      warnings: [],
      strengths: ['Ekip hazır'],
      effects: [],
    },
    selectedPlanStrategyId: strategyId,
    selectedPlanStrategyLabel: planLabel,
    assignmentReady: true,
    hasSelectedDecision: true,
    day,
    isDay1LearningEvent: input.isDay1LearningEvent,
  });

  const fieldCompleted = buildEventFieldPhasePresentation({
    event,
    assignment,
    selectedPlanStrategyId: strategyId,
    selectedPlanStrategyLabel: planLabel,
    interactionState: 'completed',
    timelineStepIndex: 4,
    day,
    isDay1LearningEvent: input.isDay1LearningEvent,
  });

  const snapshot: DecisionResultSnapshot = {
    ...createEmptyDecisionResultFallback(),
    eventId: event.id,
    eventTitle: event.title,
    summaryTitle: 'Operasyon tamamlandı',
    summaryText: chain.resultSummary,
    resultTone: strategyId === 'rapid_response' ? 'positive' : 'mixed',
    day,
    neighborhoodName: event.district ?? 'Mahalle',
    decisionTitle: planLabel,
    metricChanges:
      strategyId === 'rapid_response'
        ? [
            {
              key: 'publicSatisfaction' as const,
              delta: 4,
              label: 'Güven',
              direction: 'up' as const,
              isGood: true,
            },
            {
              key: 'budget' as const,
              delta: -1400,
              label: 'Bütçe',
              direction: 'down' as const,
              isGood: false,
            },
            {
              key: 'personnelMorale' as const,
              delta: -3,
              label: 'Moral',
              direction: 'down' as const,
              isGood: false,
            },
          ]
        : [
            {
              key: 'publicSatisfaction' as const,
              delta: 2,
              label: 'Güven',
              direction: 'up' as const,
              isGood: true,
            },
            {
              key: 'budget' as const,
              delta: -900,
              label: 'Bütçe',
              direction: 'down' as const,
              isGood: false,
            },
          ],
    subsystemOutcomes: [
      {
        key: 'social',
        title: 'Sosyal',
        status: strategyId === 'rapid_response' ? 'good' : 'warning',
        primaryText: 'Mahalle tepkisi izlendi',
      },
    ],
  };

  const cityReaction = buildPostDecisionCityReactionPresentation(snapshot);
  const result = buildEventResultRevealPresentation({
    snapshot,
    event,
    selectedPlanStrategyId: strategyId,
    day,
    cityReaction,
  });

  const resultTone = resolveOperationResultRevealTone({
    snapshot,
    outcomeBand: result.outcome.outcomeBand,
    strategyId,
    maintenanceHint: result.resourceCost.maintenanceHint,
    hasTomorrowRisk: Boolean(snapshot.butterflyHint?.text || snapshot.riskLines.length),
  });

  const fieldRisk = fieldCompleted.liveOperation.riskTendency;
  const coherent = fieldOutcomeAlignsWithResultTone({
    fieldRiskTrend: fieldRisk,
    fieldOutcomeLabel: fieldCompleted.liveOperation.outcomeDirectionLabel,
    resultToneId: resultTone.id,
    strategyId,
  });

  const phases: OperationWorkflowPhaseSnapshot[] = [
    {
      phase: 'inspect',
      intentLabel: 'Ne oluyor, risk ne, mahalle ne hissediyor?',
      primaryCtaLabel: inspectRevealed.primaryCta.label,
      primaryCtaActionKey: inspectRevealed.primaryCta.actionKey,
      primaryCtaEnabled: inspectRevealed.primaryCta.enabled,
      heroTitle: inspectClarity.investigationBrief.title,
      insightLineCount: clampCount(
        inspectClarity.investigationChecklist.length + inspectClarity.planningImpact.lines.length,
        5,
      ),
      chipCount: inspectClarity.investigationBrief.topChips.length,
      outcomeSignal: inspectClarity.investigationBrief.riskLine,
      decisionImpactLine: inspectClarity.planningImpact.lines[0],
    },
    {
      phase: 'plan',
      intentLabel: 'Hangi yaklaşımı seçiyorum ve bedeli ne?',
      primaryCtaLabel: plan.primaryCta.label,
      primaryCtaActionKey: plan.primaryCta.actionKey,
      primaryCtaEnabled: plan.primaryCta.enabled,
      heroTitle: plan.contextSummary.summary || plan.strategies.find((s) => s.isSelected)?.title || event.title,
      insightLineCount: countPlanInsights(plan),
      chipCount: plan.phaseContextChips.length,
      decisionImpactLine: plan.impactPreview.summary,
      outcomeSignal: chain.planPreview,
    },
    {
      phase: 'dispatch',
      intentLabel: 'Bu plana hangi ekip/kaynak uygun?',
      primaryCtaLabel: dispatch.primaryCta.label,
      primaryCtaActionKey: dispatch.primaryCta.actionKey,
      primaryCtaEnabled: dispatch.primaryCta.enabled,
      heroTitle: dispatch.readiness.title,
      insightLineCount: clampCount(dispatch.readiness.items.length + 1, 5),
      chipCount: dispatch.readiness.items.length,
      decisionImpactLine: dispatch.selectedPlan.label,
      outcomeSignal: dispatch.readiness.overallLabel,
    },
    {
      phase: 'field',
      intentLabel: 'Operasyon şu an nasıl gidiyor?',
      primaryCtaLabel: fieldCompleted.primaryCta.label,
      primaryCtaActionKey: fieldCompleted.primaryCta.actionKey,
      primaryCtaEnabled: fieldCompleted.primaryCta.enabled,
      heroTitle: fieldCompleted.statusHero.title,
      insightLineCount: clampCount(
        fieldCompleted.fieldSignals.items.length + 2,
        5,
      ),
      chipCount: fieldCompleted.fieldSignals.items.length,
      decisionImpactLine: fieldCompleted.decisionImpact.body,
      outcomeSignal: fieldCompleted.liveOperation.summary,
    },
    {
      phase: 'result',
      intentLabel: 'Kararım şehirde ne değiştirdi?',
      primaryCtaLabel: result.primaryCta.label,
      primaryCtaActionKey: result.primaryCta.actionKey,
      primaryCtaEnabled: result.primaryCta.enabled,
      heroTitle: result.revealSections.hero.title,
      insightLineCount: clampCount(
        result.revealSections.impactSummary.chips.length +
          result.revealSections.neighborhoodReaction.tags.length +
          2,
        7,
      ),
      chipCount: result.revealSections.impactSummary.chips.length,
      decisionImpactLine: result.revealSections.decisionImpact.summaryLine,
      outcomeSignal: result.revealSections.hero.tone.scoreLabel,
    },
  ];

  const hubAlignedTerms = [
    cityReaction?.socialEcho.line ?? '',
    cityReaction?.reportMemoryLine ?? '',
    result.revealSections.neighborhoodReaction.message,
    result.revealSections.tomorrowRipple.summaryLine,
  ].filter(Boolean);

  return {
    eventId: event.id,
    day,
    strategyId,
    densityBand,
    decisionChain: chain,
    phases,
    ctaLabels: phases.map((phase) => phase.primaryCtaLabel),
    toneCoherence: {
      fieldRiskTrend: fieldRisk,
      fieldRiskLabel: fieldCompleted.liveOperation.riskTendencyLabel,
      fieldOutcomeLabel: fieldCompleted.liveOperation.outcomeDirectionLabel,
      resultToneId: resultTone.id,
      coherent,
    },
    hubAlignedTerms,
    motionBudgetMs: 1500,
  };
}

export function fieldOutcomeAlignsWithResultTone(input: {
  fieldRiskTrend: OperationFieldRiskTendency;
  fieldOutcomeLabel: string;
  resultToneId: OperationResultRevealToneId;
  strategyId: EventPlanStrategyId;
}): boolean {
  const riskIncreasing = input.fieldRiskTrend === 'increasing';
  const positiveResultTones: OperationResultRevealToneId[] = [
    'clear_success',
    'trust_recovery',
    'controlled_success',
  ];

  if (riskIncreasing && positiveResultTones.includes(input.resultToneId)) {
    return false;
  }

  if (
    input.resultToneId === 'tomorrow_risk' &&
    input.fieldRiskTrend === 'decreasing' &&
    input.fieldOutcomeLabel.toLocaleLowerCase('tr-TR').includes('kontrol')
  ) {
    return input.strategyId === 'rapid_response' || input.strategyId === 'long_term_fix';
  }

  return chainIncludesResultTone(input.strategyId, input.resultToneId);
}

function chainIncludesResultTone(
  strategyId: EventPlanStrategyId,
  toneId: OperationResultRevealToneId,
): boolean {
  return DECISION_IMPACT_CHAIN[strategyId].compatibleResultTones.includes(toneId);
}

export function buildOperationWorkflowConsistencyPresentation(input: {
  event: EventCard;
  day: number;
  strategyId: EventPlanStrategyId;
  assignment: EventAssignmentState;
  isDay1LearningEvent?: boolean;
}): OperationWorkflowConsistencyPresentation {
  return buildSnapshotForStrategy(input);
}

export function buildOperationWorkflowConsistencyMatrix(input: {
  event: EventCard;
  assignment: EventAssignmentState;
  strategies?: EventPlanStrategyId[];
  days?: number[];
}): OperationWorkflowConsistencyPresentation[] {
  const strategies = input.strategies ?? ['rapid_response', 'balanced_plan', 'long_term_fix'];
  const days = input.days ?? [1, 8];
  const models: OperationWorkflowConsistencyPresentation[] = [];

  for (const day of days) {
    for (const strategyId of strategies) {
      models.push(
        buildSnapshotForStrategy({
          event: { ...input.event, day },
          day,
          strategyId,
          assignment: { ...input.assignment, day },
          isDay1LearningEvent: day <= 1,
        }),
      );
    }
  }

  return models;
}

export function getExpectedWorkflowCtaChain(): string[] {
  return [
    OPERATION_PHASE_CTA_LABELS.inspect,
    OPERATION_PHASE_CTA_LABELS.plan,
    OPERATION_PHASE_CTA_LABELS.dispatch,
    OPERATION_PHASE_CTA_LABELS.field,
  ];
}

export function auditOperationWorkflowConsistencyPresentation(
  model: OperationWorkflowConsistencyPresentation,
): string[] {
  const issues: string[] = [];

  if (model.phases.length !== 5) issues.push('phase count');
  for (const phase of model.phases) {
    if (!phase.intentLabel.trim()) issues.push(`${phase.phase} intent empty`);
    if (!phase.primaryCtaLabel.trim()) issues.push(`${phase.phase} CTA empty`);
    if (!phase.heroTitle.trim()) issues.push(`${phase.phase} hero empty`);
    const maxInsights = model.densityBand === 'day1' ? 6 : 8;
    const maxChips = model.densityBand === 'day1' ? 4 : 5;
    if (phase.insightLineCount > maxInsights) {
      issues.push(`${phase.phase} density overflow`);
    }
    if (phase.chipCount > maxChips) {
      issues.push(`${phase.phase} chip overflow`);
    }
  }

  const inspect = model.phases.find((phase) => phase.phase === 'inspect');
  const plan = model.phases.find((phase) => phase.phase === 'plan');
  const field = model.phases.find((phase) => phase.phase === 'field');
  const result = model.phases.find((phase) => phase.phase === 'result');

  if (!inspect?.decisionImpactLine?.trim()) issues.push('inspect decision hint missing');
  if (!plan?.decisionImpactLine?.trim()) issues.push('plan impact preview missing');
  if (!field?.decisionImpactLine?.trim()) issues.push('field decision impact missing');
  if (!result?.decisionImpactLine?.trim()) issues.push('result decision impact missing');

  const chain = model.decisionChain;
  const chainHaystack = [
    plan?.decisionImpactLine ?? '',
    field?.decisionImpactLine ?? '',
    result?.decisionImpactLine ?? '',
  ]
    .join(' ')
    .toLocaleLowerCase('tr-TR');

  for (const keyword of chain.keywords.slice(0, 2)) {
    if (!chainHaystack.includes(keyword)) {
      issues.push(`decision chain keyword missing: ${keyword}`);
    }
  }

  if (!model.toneCoherence.coherent) {
    issues.push('field/result tone mismatch');
  }

  if (model.motionBudgetMs > 1800) issues.push('motion budget high');

  const duplicateHero = new Set(
    model.phases.map((phase) => phase.heroTitle.toLocaleLowerCase('tr-TR')),
  );
  if (duplicateHero.size < 4) issues.push('hero titles too duplicate');

  return issues;
}

export function suggestDecisionIdForWorkflow(
  event: EventCard,
  strategyId: EventPlanStrategyId,
): string | null {
  return suggestDecisionIdForPlanStrategy(event, strategyId);
}
