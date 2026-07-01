import type { DominantStrategyDetectorInput } from '@/core/dominantStrategyDetector/dominantStrategyDetectorTypes';
import type { EventCard, EventDecision } from '@/core/models/EventCard';
import type {
  EventPlanStrategyCard,
  EventPlanStrategyId,
} from '@/features/events/utils/eventPlanPhasePresentation';
import {
  getDecisionStrategyLabel,
  getDecisionStrategyTone,
} from '@/features/events/utils/decisionTradeoffPresentation';
import { resolveContextFitBadgeForArchetype, resolveContextFitBadgeForPlanStrategy } from '@/features/events/utils/decisionContextFitModel';
import {
  buildDecisionMemoryChip,
  buildDominantStrategyWarningForPlan,
} from '@/features/events/utils/decisionDominantStrategyWarningPresentation';
import {
  buildArchetypeOpportunityCost,
  buildPlanOpportunityCost,
} from '@/features/events/utils/decisionOpportunityCostPresentation';
import {
  buildArchetypeOutcomePreview,
  buildPlanOutcomePreview,
} from '@/features/events/utils/decisionOutcomePreviewModel';
import {
  buildDecisionExpectedImpactPreview,
  expectedImpactToTradeoffMeter,
} from '@/features/events/utils/decisionPreviewDimensionsModel';
import { buildMaintenanceEconomyPlanHint } from '@/core/maintenanceBacklog/maintenanceEconomySurfaceBridge';
import type { MaintenanceBacklogRuntimeState } from '@/core/maintenanceBacklog/maintenanceBacklogRuntimeTypes';
import { buildOperationReadinessSnapshot } from '@/core/operationReadiness/operationReadinessModel';
import { buildMaintenanceBacklogFromReadiness } from '@/core/maintenanceBacklog/maintenanceBacklogPresentation';
import { buildReadinessPlanFitPresentation } from '@/core/readinessStrategicPriority/readinessFitPresentation';
import {
  ARCHETYPE_BADGE_LABELS,
  PLAN_STRATEGY_TO_ARCHETYPE,
  type DecisionArchetypeId,
  type DecisionOptionDepthPresentation,
  type DecisionTradeoffChip,
  type DecisionTradeoffDensityBand,
  type PlanOptionDepthPresentation,
  type TradeoffMeterSegment,
} from '@/features/events/utils/decisionTradeoffTypes';

const FORBIDDEN_BASIC_PATTERNS = [
  /^\+ güven$/i,
  /^\- kaynak$/i,
  /^Sonuç$/i,
  /^Durum$/i,
  /^Bilgi$/i,
  /^Etki$/i,
  /^Özet$/i,
] as const;

const ARCHETYPE_COPY: Record<
  DecisionArchetypeId,
  {
    benefit: string;
    cost: string;
    shortTerm: string;
    longTerm: string;
    risk: string | null;
    meter: TradeoffMeterSegment[];
  }
> = {
  rapid_response: {
    benefit: 'Güven hızlı toparlanır',
    cost: 'Kaynak tüketimi artar',
    shortTerm: 'Sosyal baskı hızlı yumuşar',
    longTerm: 'Ekip yorgunluğu birikebilir',
    risk: 'Zincirleme yorgunluk riski',
    meter: [
      { dimensionId: 'trust', label: 'Güven', direction: 'up', emphasis: 'strong' },
      { dimensionId: 'resource', label: 'Kaynak', direction: 'down', emphasis: 'medium' },
      { dimensionId: 'readiness', label: 'Hazırlık', direction: 'down', emphasis: 'light' },
      { dimensionId: 'tomorrow_risk', label: 'Yarın', direction: 'up', emphasis: 'medium' },
    ],
  },
  preventive: {
    benefit: 'Yarın riski azalır',
    cost: 'İlk tepki yavaşlar',
    shortTerm: 'Mahalle sabrı zorlanabilir',
    longTerm: 'Bakım ve güven güçlenir',
    risk: 'Anlık memnuniyet düşük kalabilir',
    meter: [
      { dimensionId: 'trust', label: 'Güven', direction: 'up', emphasis: 'medium' },
      { dimensionId: 'readiness', label: 'Hazırlık', direction: 'up', emphasis: 'strong' },
      { dimensionId: 'patience', label: 'Sabır', direction: 'down', emphasis: 'medium' },
      { dimensionId: 'tomorrow_risk', label: 'Yarın', direction: 'down', emphasis: 'strong' },
    ],
  },
  resource_saving: {
    benefit: 'Maliyet baskısı düşer',
    cost: 'Müdahale yavaşlar',
    shortTerm: 'Ekip temposu korunur',
    longTerm: 'Bazı olaylar yarına taşınır',
    risk: 'Sosyal tepki büyüyebilir',
    meter: [
      { dimensionId: 'resource', label: 'Kaynak', direction: 'up', emphasis: 'strong' },
      { dimensionId: 'readiness', label: 'Hazırlık', direction: 'up', emphasis: 'medium' },
      { dimensionId: 'patience', label: 'Sabır', direction: 'down', emphasis: 'strong' },
      { dimensionId: 'trust', label: 'Güven', direction: 'steady', emphasis: 'light' },
    ],
  },
  social_trust: {
    benefit: 'Mahalle tepkisi yumuşar',
    cost: 'Operasyon maliyeti artar',
    shortTerm: 'Güven toparlanması hızlanır',
    longTerm: 'Kaynak verimliliği düşebilir',
    risk: 'Operasyonel verimlilik baskılanır',
    meter: [
      { dimensionId: 'trust', label: 'Güven', direction: 'up', emphasis: 'strong' },
      { dimensionId: 'patience', label: 'Sabır', direction: 'up', emphasis: 'medium' },
      { dimensionId: 'resource', label: 'Kaynak', direction: 'down', emphasis: 'medium' },
      { dimensionId: 'readiness', label: 'Hazırlık', direction: 'steady', emphasis: 'light' },
    ],
  },
  balanced: {
    benefit: 'Büyük risk almaz',
    cost: 'Büyük kazanım yaratmaz',
    shortTerm: 'Birden çok sistem korunur',
    longTerm: 'Kritik durumlarda sınırlı kalabilir',
    risk: null,
    meter: [
      { dimensionId: 'trust', label: 'Güven', direction: 'up', emphasis: 'light' },
      { dimensionId: 'resource', label: 'Kaynak', direction: 'steady', emphasis: 'light' },
      { dimensionId: 'readiness', label: 'Hazırlık', direction: 'steady', emphasis: 'medium' },
      { dimensionId: 'patience', label: 'Sabır', direction: 'steady', emphasis: 'light' },
    ],
  },
};

function resolveDensityBand(day?: number, isDay1LearningEvent?: boolean): DecisionTradeoffDensityBand {
  if (isDay1LearningEvent || day === 1) return 'day1';
  return 'openEnded';
}

function decisionStyleToArchetype(decision: EventDecision): DecisionArchetypeId {
  const tone = getDecisionStrategyTone(decision);
  switch (tone) {
    case 'action':
      return 'rapid_response';
    case 'long_term':
      return 'preventive';
    case 'resource':
      return 'resource_saving';
    case 'social':
      return 'social_trust';
    default:
      return 'balanced';
  }
}

function buildChips(copy: (typeof ARCHETYPE_COPY)[DecisionArchetypeId]): {
  benefitChip: DecisionTradeoffChip;
  costChip: DecisionTradeoffChip;
} {
  return {
    benefitChip: { id: 'benefit', label: copy.benefit, tone: 'gain' },
    costChip: { id: 'cost', label: copy.cost, tone: 'cost' },
  };
}

function simplifyForDay1<T extends PlanOptionDepthPresentation | DecisionOptionDepthPresentation>(
  depth: T,
): T {
  return {
    ...depth,
    tradeoffMeter: depth.tradeoffMeter.slice(0, 2),
    expectedImpact: {
      ...depth.expectedImpact,
      lines: depth.expectedImpact.lines.slice(0, 3),
      visibleCount: Math.min(depth.expectedImpact.visibleCount, 3),
      sideEffectLine: null,
    },
    longTermEffect: '',
    riskWarning: null,
    contextFitBadge: null,
    readinessFitBadge: 'readinessFitBadge' in depth ? null : undefined,
    decisionMemoryChip: null,
    dominantStrategyWarning: null,
    portfolioConflictHint: 'portfolioConflictHint' in depth ? null : undefined,
    maintenanceEconomyHint: 'maintenanceEconomyHint' in depth ? null : undefined,
  } as T;
}

function buildPortfolioConflictHint(
  strategyId: EventPlanStrategyId,
  operationsToday: number,
  densityBand: DecisionTradeoffDensityBand,
): string | null {
  if (densityBand === 'day1' || operationsToday < 2) return null;
  if (strategyId === 'rapid_response' && operationsToday >= 2) {
    return 'Bugün birden fazla operasyon var; hızlı plan ekip gücünü böler.';
  }
  if (strategyId === 'long_term_fix' && operationsToday >= 3) {
    return 'Portföy yoğun; önleyici plan bugünkü tempo ile çatışabilir.';
  }
  return null;
}

function buildReadinessFitChipForPlan(
  input: BuildPlanOptionDepthInput,
  densityBand: DecisionTradeoffDensityBand,
): PlanOptionDepthPresentation['readinessFitBadge'] {
  if (densityBand === 'day1') return null;

  const day = input.day ?? input.event.day ?? 8;
  const readinessSnapshot = buildOperationReadinessSnapshot({
    phase: 'dispatch',
    day,
    planStrategyId: input.strategy.id,
    publicSatisfactionPreview: input.event.previewEffects?.publicSatisfaction,
    eventRiskLevel: input.event.riskLevel,
    compatibilityBand:
      input.strategy.id === 'rapid_response' ? 'medium' : input.strategy.id === 'long_term_fix' ? 'high' : 'medium',
  });

  const planFit = buildReadinessPlanFitPresentation({
    day,
    readinessSnapshot,
    maintenanceBacklog: buildMaintenanceBacklogFromReadiness(readinessSnapshot),
    maintenanceRuntime: input.maintenanceBacklogRuntime,
    planStrategyId: input.strategy.id,
    eventRiskLevel: input.event.riskLevel,
    operationsToday: input.operationsToday,
    operationTitle: input.event.title,
    socialPressure: (input.event.previewEffects?.publicSatisfaction ?? 0) <= -3,
  });

  const badge = planFit.strategyFits[input.strategy.id];
  if (!badge) return null;

  return {
    id: badge.id,
    label: badge.label,
    tone: badge.tone,
  };
}

export type BuildPlanOptionDepthInput = {
  strategy: EventPlanStrategyCard;
  event: EventCard;
  day?: number;
  isDay1LearningEvent?: boolean;
  operationsToday?: number;
  dominantStrategyInput?: DominantStrategyDetectorInput | null;
  avoidLines?: string[];
  maintenanceBacklogRuntime?: MaintenanceBacklogRuntimeState | null;
};

export function buildPlanOptionDepthPresentation(
  input: BuildPlanOptionDepthInput,
): PlanOptionDepthPresentation {
  const archetypeId = PLAN_STRATEGY_TO_ARCHETYPE[input.strategy.id];
  const copy = ARCHETYPE_COPY[archetypeId];
  const densityBand = resolveDensityBand(input.day, input.isDay1LearningEvent);
  const chips = buildChips(copy);
  const expectedImpact = buildDecisionExpectedImpactPreview({
    event: input.event,
    archetypeId,
    strategyId: input.strategy.id,
    densityBand,
  });

  const depth: PlanOptionDepthPresentation = {
    archetypeId,
    strategyBadge: ARCHETYPE_BADGE_LABELS[archetypeId],
    benefitChip: chips.benefitChip,
    costChip: chips.costChip,
    shortTermEffect: copy.shortTerm,
    longTermEffect: copy.longTerm,
    riskWarning: copy.risk,
    contextFitBadge: resolveContextFitBadgeForPlanStrategy(input.strategy.id, {
      event: input.event,
      day: input.day,
      operationsToday: input.operationsToday,
    }),
    tradeoffMeter: expectedImpactToTradeoffMeter(expectedImpact),
    opportunityCost: buildPlanOpportunityCost(input.strategy.id),
    outcomePreview: buildPlanOutcomePreview(input.strategy.id),
    decisionMemoryChip: buildDecisionMemoryChip({
      day: input.day,
      dominantStrategyInput: input.dominantStrategyInput,
      strategyId: input.strategy.id,
      avoidLines: input.avoidLines,
    }),
    dominantStrategyWarning: buildDominantStrategyWarningForPlan({
      day: input.day,
      dominantStrategyInput: input.dominantStrategyInput,
      strategyId: input.strategy.id,
      avoidLines: input.avoidLines,
    }),
    portfolioConflictHint: buildPortfolioConflictHint(
      input.strategy.id,
      input.operationsToday ?? 1,
      densityBand,
    ),
    maintenanceEconomyHint: buildMaintenanceEconomyPlanHint({
      strategyId: input.strategy.id,
      day: input.day ?? 8,
      runtime: input.maintenanceBacklogRuntime,
      operationsToday: input.operationsToday,
    }),
    readinessFitBadge: buildReadinessFitChipForPlan(input, densityBand),
    expectedImpact,
  };

  if (densityBand === 'day1') {
    return simplifyForDay1(depth);
  }

  return depth;
}

export type BuildDecisionOptionDepthInput = {
  event: EventCard;
  decision: EventDecision;
  day?: number;
  isDay1LearningEvent?: boolean;
  dominantStrategyInput?: DominantStrategyDetectorInput | null;
  avoidLines?: string[];
};

export function buildDecisionOptionDepthPresentation(
  input: BuildDecisionOptionDepthInput,
): DecisionOptionDepthPresentation {
  const archetypeId = decisionStyleToArchetype(input.decision);
  const copy = ARCHETYPE_COPY[archetypeId];
  const densityBand = resolveDensityBand(input.day, input.isDay1LearningEvent);
  const chips = buildChips(copy);
  const expectedImpact = buildDecisionExpectedImpactPreview({
    event: input.event,
    archetypeId,
    decision: input.decision,
    densityBand,
  });

  const depth: DecisionOptionDepthPresentation = {
    archetypeId,
    strategyBadge: getDecisionStrategyLabel(input.decision),
    benefitChip: chips.benefitChip,
    costChip: chips.costChip,
    shortTermEffect: copy.shortTerm,
    longTermEffect: copy.longTerm,
    riskWarning: copy.risk,
    contextFitBadge: resolveContextFitBadgeForArchetype(archetypeId, {
      event: input.event,
      day: input.day,
    }),
    tradeoffMeter: expectedImpactToTradeoffMeter(expectedImpact),
    opportunityCost: buildArchetypeOpportunityCost(archetypeId),
    outcomePreview: buildArchetypeOutcomePreview(archetypeId),
    decisionMemoryChip: buildDecisionMemoryChip({
      day: input.day,
      dominantStrategyInput: input.dominantStrategyInput,
      archetypeId,
      avoidLines: input.avoidLines,
    }),
    dominantStrategyWarning: buildDominantStrategyWarningForPlan({
      day: input.day,
      dominantStrategyInput: input.dominantStrategyInput,
      archetypeId,
      avoidLines: input.avoidLines,
    }),
    expectedImpact,
  };

  if (densityBand === 'day1') {
    return simplifyForDay1(depth);
  }

  return depth;
}

export function auditPlanOptionDepthPresentation(
  depth: PlanOptionDepthPresentation,
): string[] {
  const issues: string[] = [];
  if (!depth.strategyBadge.trim()) issues.push('strategyBadge empty');
  if (!depth.benefitChip.label.trim()) issues.push('benefitChip empty');
  if (!depth.costChip.label.trim()) issues.push('costChip empty');
  if (!depth.shortTermEffect.trim()) issues.push('shortTermEffect empty');
  if (!depth.opportunityCost.trim()) issues.push('opportunityCost empty');
  if (!depth.outcomePreview.trim()) issues.push('outcomePreview empty');
  if (depth.tradeoffMeter.length < 2) issues.push('tradeoffMeter too short');
  if (depth.expectedImpact.visibleCount < 2) issues.push('expectedImpact too short');
  if (!depth.expectedImpact.title.includes('Beklenen')) issues.push('expectedImpact title');

  const blob = [
    depth.benefitChip.label,
    depth.costChip.label,
    depth.opportunityCost,
    depth.outcomePreview,
  ].join(' ');
  if (FORBIDDEN_BASIC_PATTERNS.some((p) => p.test(blob))) {
    issues.push('basic fallback pattern');
  }
  return issues;
}

export function auditDecisionOptionDepthPresentation(
  depth: DecisionOptionDepthPresentation,
): string[] {
  const issues = auditPlanOptionDepthPresentation(depth as PlanOptionDepthPresentation);
  return issues;
}

export function collectDistinctArchetypePreviews(
  strategyIds: EventPlanStrategyId[],
  input: Omit<BuildPlanOptionDepthInput, 'strategy'> & {
    strategies: EventPlanStrategyCard[];
  },
): Map<DecisionArchetypeId, PlanOptionDepthPresentation> {
  const map = new Map<DecisionArchetypeId, PlanOptionDepthPresentation>();
  for (const strategy of input.strategies) {
    const depth = buildPlanOptionDepthPresentation({ ...input, strategy });
    map.set(depth.archetypeId, depth);
  }
  return map;
}

export function dedupeTradeoffCopyLines(lines: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    const key = line.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(line.trim());
  }
  return result;
}
