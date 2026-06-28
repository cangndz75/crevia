import type { DecisionResultSnapshot } from '@/features/events/types/decisionResultTypes';
import {
  getPlanStrategyLabel,
  type EventPlanStrategyId,
} from '@/features/events/utils/eventPlanPhasePresentation';
import type { PostDecisionCityReactionPresentation } from '@/features/events/utils/postDecisionCityReactionPresentation';
import type {
  EventResultImpactCard,
  EventResultOutcomeSummary,
  EventResultResourceCostSection,
} from './eventResultRevealPresentation';
import { buildOperationNeighborhoodReactionPresentation } from './operationNeighborhoodReactionPresentation';
import type { MaintenanceBacklogRuntimeState } from '@/core/maintenanceBacklog/maintenanceBacklogRuntimeTypes';
import { buildMaintenanceEconomyResultRevealLine } from '@/core/maintenanceBacklog/maintenanceEconomySurfaceBridge';
import {
  resolveOperationResultRevealTone,
  type OperationResultRevealTone,
} from './operationResultToneModel';

export type OperationResultRevealHero = {
  statusLabel: string;
  title: string;
  districtName: string;
  operationLabel: string;
  badgeLabel: string;
  scoreLabel: string;
  tone: OperationResultRevealTone;
  iconKey: string;
};

export type OperationResultImpactChip = {
  id: 'trust' | 'resource' | 'readiness';
  label: string;
  valueText: string;
  hint?: string;
  tone: 'positive' | 'neutral' | 'warning';
  iconKey: string;
};

export type OperationResultImpactSummary = {
  scoreLabel: string;
  chips: OperationResultImpactChip[];
};

export type OperationResultDecisionImpact = {
  visibility: 'visible' | 'hidden';
  headline: string;
  summaryLine: string;
  impactLines: string[];
  planLabel?: string;
  tone: 'positive' | 'neutral' | 'warning';
};

export type OperationResultTomorrowRipple = {
  visibility: 'visible' | 'hidden';
  headline: string;
  summaryLine: string;
  hubHint?: string;
  reportHint?: string;
  tone: 'positive' | 'neutral' | 'warning';
};

export type OperationResultRevealDensityBand = 'day1' | 'openEnded';

export type OperationResultRevealSections = {
  densityBand: OperationResultRevealDensityBand;
  hero: OperationResultRevealHero;
  impactSummary: OperationResultImpactSummary;
  neighborhoodReaction: ReturnType<typeof buildOperationNeighborhoodReactionPresentation>;
  decisionImpact: OperationResultDecisionImpact;
  tomorrowRipple: OperationResultTomorrowRipple;
};

const DECISION_IMPACT_BY_STRATEGY: Record<
  EventPlanStrategyId,
  { summary: string; lines: [string, string] }
> = {
  rapid_response: {
    summary: 'Hızlı müdahale seçimin güven kaybını durdurdu.',
    lines: ['Görünür tempo mahallede fark edildi.', 'Ekip yorgunluğu yarına taşınabilir.'],
  },
  balanced_plan: {
    summary: 'Dengeli yaklaşım riski büyütmeden kontrol sağladı.',
    lines: ['Ne büyük kazanım ne sert kayıp.', 'Uzun vadeli güven daha stabil.'],
  },
  long_term_fix: {
    summary: 'Önleyici plan yarınki baskıyı azaltacak zemin oluşturdu.',
    lines: ['Risk daha kontrollü azaldı.', 'Müdahale süresi biraz uzadı.'],
  },
};

const RESOURCE_SAVER_LINES = {
  summary: 'Kaynak koruyucu plan maliyeti düşürdü.',
  lines: ['Bütçe baskısı sınırlı kaldı.', 'Müdahale süresi mahalle sabrını zorlayabilir.'],
} as const;

function categoryLabel(category?: string | null): string {
  switch (category) {
    case 'waste':
      return 'Atık operasyonu';
    case 'transport':
      return 'Ulaşım operasyonu';
    case 'social':
      return 'Sosyal operasyon';
    default:
      return 'Saha operasyonu';
  }
}

function buildImpactChips(
  impactCards: EventResultImpactCard[],
  resourceCost: EventResultResourceCostSection,
  day: number,
): OperationResultImpactChip[] {
  const trust = impactCards.find((card) => card.id === 'district_trust');
  const resource = impactCards.find((card) => card.id === 'resource_pressure');
  const readinessHint = resourceCost.maintenanceHint?.trim();

  const chips: OperationResultImpactChip[] = [
    {
      id: 'trust',
      label: 'Güven',
      valueText: trust?.deltaText && trust.deltaText !== 'Dengeli' ? trust.deltaText : trust?.valueLabel ?? 'Dengede',
      hint: trust?.body,
      tone: trust?.tone ?? 'neutral',
      iconKey: 'shield-checkmark-outline',
    },
    {
      id: 'resource',
      label: 'Kaynak',
      valueText: resource?.deltaText && resource.deltaText !== 'Dengeli' ? resource.deltaText : resource?.valueLabel ?? 'İzleniyor',
      hint: resource?.body,
      tone: resource?.tone ?? 'neutral',
      iconKey: 'wallet-outline',
    },
  ];

  if (day > 1 || readinessHint) {
    chips.push({
      id: 'readiness',
      label: day <= 1 ? 'Hazırlık' : 'Bakım',
      valueText: readinessHint ? 'İzlenmeli' : 'Dengede',
      hint: readinessHint ?? resourceCost.summary,
      tone:
        resourceCost.maintenanceHintTone === 'critical' ||
        resourceCost.maintenanceHintTone === 'warning'
          ? 'warning'
          : 'neutral',
      iconKey: 'construct-outline',
    });
  }

  return chips.slice(0, day <= 1 ? 2 : 3);
}

function hasGenuineTomorrowRisk(snapshot: DecisionResultSnapshot): boolean {
  if (snapshot.butterflyHint?.text?.trim()) return true;
  if (snapshot.dailyPriorityImpact?.tone === 'risky') return true;
  return snapshot.riskLines.some((line) => line.trim().length > 0);
}

export function buildOperationResultRevealSections(input: {
  snapshot: DecisionResultSnapshot;
  outcome: EventResultOutcomeSummary;
  impactCards: EventResultImpactCard[];
  resourceCost: EventResultResourceCostSection;
  day?: number;
  eventCategory?: string | null;
  strategyId?: EventPlanStrategyId | null;
  cityReaction?: PostDecisionCityReactionPresentation | null;
  socialEcho?: import('@/core/socialEcho').SocialEchoPresentation | null;
  advisorLine?: string;
  reportSummary?: string;
  maintenanceBacklogRuntime?: MaintenanceBacklogRuntimeState | null;
}): OperationResultRevealSections {
  const day = input.day ?? input.snapshot.day ?? 1;
  const densityBand: OperationResultRevealDensityBand = day <= 1 ? 'day1' : 'openEnded';
  const tomorrowRisk = hasGenuineTomorrowRisk(input.snapshot);
  const tone = resolveOperationResultRevealTone({
    snapshot: input.snapshot,
    outcomeBand: input.outcome.outcomeBand,
    strategyId: input.strategyId,
    maintenanceHint: input.resourceCost.maintenanceHint,
    hasTomorrowRisk: tomorrowRisk,
  });

  const neighborhoodReaction = buildOperationNeighborhoodReactionPresentation({
    snapshot: input.snapshot,
    outcomeBand: input.outcome.outcomeBand,
    day,
    strategyId: input.strategyId,
    cityReaction: input.cityReaction,
    socialEcho: input.socialEcho,
    avoidLines: [input.advisorLine ?? '', input.reportSummary ?? ''],
  });

  const hero: OperationResultRevealHero = {
    statusLabel: input.outcome.statusLabel,
    title: input.outcome.eventTitle,
    districtName: input.outcome.districtName,
    operationLabel: categoryLabel(input.eventCategory),
    badgeLabel: tone.heroBadge,
    scoreLabel: tone.scoreLabel,
    tone,
    iconKey: tone.iconKey,
  };

  const impactSummary: OperationResultImpactSummary = {
    scoreLabel: tone.scoreLabel,
    chips: buildImpactChips(input.impactCards, input.resourceCost, day),
  };

  let decisionImpact: OperationResultDecisionImpact = {
    visibility: 'hidden',
    headline: 'Kararın Etkisi',
    summaryLine: '',
    impactLines: [],
    tone: 'neutral',
  };

  if (input.strategyId) {
    const mapped = DECISION_IMPACT_BY_STRATEGY[input.strategyId];
    const budgetDelta =
      input.snapshot.metricChanges.find((metric) => metric.key === 'budget')?.delta ?? 0;
    const useResourceSaver = budgetDelta > -500 && input.strategyId === 'rapid_response';
    const pack = useResourceSaver ? RESOURCE_SAVER_LINES : mapped;
    decisionImpact = {
      visibility: 'visible',
      headline: 'Kararın Etkisi',
      summaryLine: pack.summary,
      impactLines: [...pack.lines],
      planLabel: getPlanStrategyLabel(input.strategyId),
      tone: input.strategyId === 'rapid_response' ? 'warning' : input.strategyId === 'long_term_fix' ? 'positive' : 'neutral',
    };
  } else if (densityBand === 'day1') {
    decisionImpact = {
      visibility: 'visible',
      headline: 'Kararın Etkisi',
      summaryLine: 'Verdiğin karar mahallede ilk izini bıraktı.',
      impactLines: ['Sonuç gün sonu raporuna işlenecek.'],
      tone: 'neutral',
    };
  }

  const maintenanceRevealLine = buildMaintenanceEconomyResultRevealLine(
    {
      day,
      runtime: input.maintenanceBacklogRuntime,
    },
    [
      input.advisorLine ?? '',
      input.reportSummary ?? '',
      decisionImpact.summaryLine,
      ...decisionImpact.impactLines,
    ],
  );
  if (maintenanceRevealLine && decisionImpact.visibility === 'visible') {
    decisionImpact = {
      ...decisionImpact,
      impactLines: [...decisionImpact.impactLines, maintenanceRevealLine].slice(0, 3),
    };
  } else if (maintenanceRevealLine && densityBand === 'openEnded') {
    decisionImpact = {
      visibility: 'visible',
      headline: 'Kararın Etkisi',
      summaryLine: maintenanceRevealLine,
      impactLines: [],
      tone: 'warning',
    };
  }

  const tomorrowLine =
    input.cityReaction?.nextRiskHint?.trim() ||
    input.snapshot.butterflyHint?.text?.trim() ||
    input.snapshot.dailyPriorityImpact?.text?.trim() ||
    input.snapshot.riskLines[0]?.trim();

  const tomorrowRipple: OperationResultTomorrowRipple = {
    visibility: tomorrowLine || densityBand === 'openEnded' ? 'visible' : 'hidden',
    headline: 'Yarına Yansıma',
    summaryLine: tomorrowLine
      ? tomorrowLine
      : densityBand === 'openEnded'
        ? 'Bu sonuç Merkez ve gün sonu raporunda görünecek.'
        : '',
    hubHint:
      densityBand === 'openEnded' && input.cityReaction?.shortSummary
        ? 'Ece bu sonucu yarınki planda dikkate alacak.'
        : undefined,
    reportHint: input.reportSummary,
    tone: tomorrowRisk ? 'warning' : 'neutral',
  };

  return {
    densityBand,
    hero,
    impactSummary,
    neighborhoodReaction,
    decisionImpact,
    tomorrowRipple,
  };
}

export function operationResultRevealSectionsHaveDuplicates(
  sections: OperationResultRevealSections,
): boolean {
  const lines = [
    sections.hero.scoreLabel,
    sections.neighborhoodReaction.message,
    sections.decisionImpact.summaryLine,
    sections.tomorrowRipple.summaryLine,
  ].map((line) => line.trim().toLowerCase());
  return new Set(lines).size !== lines.length;
}
