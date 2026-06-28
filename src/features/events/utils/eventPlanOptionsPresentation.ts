import type {
  EventPlanAdvisorComment,
  EventPlanStrategyCard,
  EventPlanStrategyId,
} from '@/features/events/utils/eventPlanPhasePresentation';
import type { DominantStrategyDetectorInput } from '@/core/dominantStrategyDetector/dominantStrategyDetectorTypes';
import type { EventCard } from '@/core/models/EventCard';
import {
  buildPlanOptionDepthPresentation,
} from '@/features/events/utils/decisionTradeoffDepthPresentation';
import type { PlanOptionDepthPresentation } from '@/features/events/utils/decisionTradeoffTypes';

export type PlanOptionTone = 'urgent' | 'balanced' | 'preventive';

export type PlanOptionStats = {
  risk: string;
  cost: string;
  impact: string;
};

export type PlanOptionPresentation = {
  id: EventPlanStrategyId;
  title: string;
  description: string;
  chips: string[];
  stats: PlanOptionStats;
  tone: PlanOptionTone;
  recommended: boolean;
  selected: boolean;
  accessibilityLabel: string;
  depth: PlanOptionDepthPresentation;
};

export type EventPlanOptionsPresentation = {
  sectionTitle: string;
  sectionDescription: string;
  sectionAccessibilityLabel: string;
  options: PlanOptionPresentation[];
  eceRecommendation: {
    title: string;
    body: string;
    accessibilityLabel: string;
  };
  compareCta: {
    label: string;
    accessibilityLabel: string;
    actionKey: 'compare_risks';
  };
};

const OPTION_ORDER: EventPlanStrategyId[] = [
  'rapid_response',
  'balanced_plan',
  'long_term_fix',
];

const OPTION_COPY: Record<
  EventPlanStrategyId,
  Pick<PlanOptionPresentation, 'title' | 'description' | 'chips' | 'tone'> & {
    stats: PlanOptionStats;
  }
> = {
  rapid_response: {
    title: 'Hızlı Müdahale',
    description: 'Kısa sürede etkili temizlik ve görünür iyileşme sağlar.',
    chips: ['Hızlı Etki', 'Yüksek Görünürlük', 'Kısa Süre'],
    tone: 'urgent',
    stats: {
      risk: 'Orta',
      cost: 'Orta',
      impact: 'Yüksek',
    },
  },
  balanced_plan: {
    title: 'Dengeli Müdahale',
    description: 'Orta düzeyde riskleri azaltırken kalıcı iyileştirmeler sağlar.',
    chips: ['Dengeli Yaklaşım', 'Orta Maliyet', 'Hızlı Etki'],
    tone: 'balanced',
    stats: {
      risk: 'Orta',
      cost: 'Orta',
      impact: 'Yüksek',
    },
  },
  long_term_fix: {
    title: 'Önleyici Plan',
    description: 'Uzun vadede riskleri minimize eder ve sürdürülebilir bir çevre oluşturur.',
    chips: ['Düşük Risk', 'Uzun Vadeli Etki', 'Daha Yüksek Maliyet'],
    tone: 'preventive',
    stats: {
      risk: 'Düşük',
      cost: 'Yüksek',
      impact: 'Uzun Vadeli',
    },
  },
};

function simplifyCostLabel(costLabel: string): string {
  const lower = costLabel.toLocaleLowerCase('tr-TR');
  if (lower.includes('yüksek') || lower.includes('pahalı')) return 'Yüksek';
  if (lower.includes('düşük')) return 'Düşük';
  return 'Orta';
}

function simplifyRiskLabel(riskLabel: string): string {
  const lower = riskLabel.toLocaleLowerCase('tr-TR');
  if (lower.includes('yüksek') || lower.includes('stratejik')) return 'Yüksek';
  if (lower.includes('düşük')) return 'Düşük';
  return 'Orta';
}

function buildOptionAccessibilityLabel(
  option: Pick<PlanOptionPresentation, 'title' | 'description' | 'recommended' | 'selected' | 'depth'>,
): string {
  const parts = [
    option.depth.strategyBadge,
    option.depth.benefitChip.label,
    option.depth.costChip.label,
    option.depth.opportunityCost,
  ];
  if (option.recommended) parts.push('Önerilen plan');
  parts.push(option.selected ? 'Seçili' : 'Seçili değil');
  return parts.join('. ');
}

function resolveEceBody(
  selectedId: EventPlanStrategyId,
  recommendedId: EventPlanStrategyId,
  advisorComment: EventPlanAdvisorComment,
): string {
  if (selectedId === recommendedId && selectedId === 'balanced_plan') {
    return 'Dengeli plan bu mahalle için en güvenli başlangıç.';
  }
  if (selectedId === recommendedId) {
    const title = OPTION_COPY[selectedId].title;
    return `${title} bu mahalle için en kontrollü başlangıcı sunuyor.`;
  }
  if (selectedId === 'rapid_response') {
    return 'Hızlı müdahale görünür sonuç verir; kaynak temposunu izlemek gerekir.';
  }
  if (selectedId === 'long_term_fix') {
    return 'Önleyici plan uzun vadede güçlü; ilk etki daha kontrollü gelir.';
  }
  if (advisorComment.text.trim()) {
    return advisorComment.text;
  }
  return 'Mahallenin mevcut sinyallerine göre dengeli plan en kontrollü başlangıcı sunuyor.';
}

export type BuildEventPlanOptionsPresentationInput = {
  strategies: EventPlanStrategyCard[];
  selectedStrategyId: EventPlanStrategyId;
  recommendedStrategyId: EventPlanStrategyId;
  advisorComment: EventPlanAdvisorComment;
  event: EventCard;
  day?: number;
  isDay1LearningEvent?: boolean;
  operationsToday?: number;
  dominantStrategyInput?: DominantStrategyDetectorInput | null;
};

export function buildEventPlanOptionsPresentation(
  input: BuildEventPlanOptionsPresentationInput,
): EventPlanOptionsPresentation {
  const strategyById = new Map(input.strategies.map((strategy) => [strategy.id, strategy]));
  const eceBody = resolveEceBody(
    input.selectedStrategyId,
    input.recommendedStrategyId,
    input.advisorComment,
  );

  const options = OPTION_ORDER.map((id) => {
    const strategy = strategyById.get(id);
    const copy = OPTION_COPY[id];
    const selected = id === input.selectedStrategyId;
    const recommended = id === input.recommendedStrategyId;

    const stats: PlanOptionStats = {
      risk: strategy ? simplifyRiskLabel(strategy.riskLabel) : copy.stats.risk,
      cost: strategy ? simplifyCostLabel(strategy.costLabel) : copy.stats.cost,
      impact: copy.stats.impact,
    };

    const strategyCard =
      strategy ??
      ({
        id,
        title: copy.title,
        description: copy.description,
        tone: 'teal',
        priority: 'normal',
        isSelected: selected,
        pros: [],
        cons: [],
        costLabel: copy.stats.cost,
        riskLabel: copy.stats.risk,
        tradeoffs: [],
        gameplayTradeoffs: [],
        expectedImpact: [],
        sourceLabel: 'fallback',
        sourceIds: [id],
      } satisfies EventPlanStrategyCard);

    const depth = buildPlanOptionDepthPresentation({
      strategy: strategyCard,
      event: input.event,
      day: input.day,
      isDay1LearningEvent: input.isDay1LearningEvent,
      operationsToday: input.operationsToday,
      dominantStrategyInput: input.dominantStrategyInput,
      avoidLines: [eceBody],
    });

    const option: PlanOptionPresentation = {
      id,
      title: copy.title,
      description: depth.shortTermEffect,
      chips: [depth.benefitChip.label, depth.costChip.label],
      stats,
      tone: copy.tone,
      recommended,
      selected,
      depth,
      accessibilityLabel: buildOptionAccessibilityLabel({
        title: copy.title,
        description: depth.shortTermEffect,
        recommended,
        selected,
        depth,
      }),
    };

    return option;
  });

  return {
    sectionTitle: 'Plan Seçenekleri',
    sectionDescription: 'Mahalle ihtiyaçlarına uygun en iyi planı seç.',
    sectionAccessibilityLabel:
      'Plan seçenekleri. Mahalle ihtiyaçlarına uygun planı seç.',
    options,
    eceRecommendation: {
      title: 'Ece öneriyor',
      body: eceBody,
      accessibilityLabel: `Ece öneriyor. ${eceBody}`,
    },
    compareCta: {
      label: 'Seçenekleri karşılaştır',
      accessibilityLabel: 'Seçenekleri karşılaştır. Plan farklarını görür.',
      actionKey: 'compare_risks',
    },
  };
}

export function auditEventPlanOptionsPresentation(
  model: EventPlanOptionsPresentation,
): string[] {
  const issues: string[] = [];

  if (!model.sectionTitle.trim()) issues.push('options section title empty');
  if (!model.sectionDescription.trim()) issues.push('options section description empty');
  if (model.options.length !== 3) issues.push('options count');
  if (!model.options.some((option) => option.selected)) issues.push('no selected option');
  if (!model.options.some((option) => option.recommended)) issues.push('no recommended option');
  if (!model.eceRecommendation.body.trim()) issues.push('ece recommendation empty');
  if (!model.compareCta.label.trim()) issues.push('compare cta empty');

  for (const option of model.options) {
    if (!option.depth.benefitChip.label.trim()) issues.push(`benefit missing ${option.id}`);
    if (!option.depth.costChip.label.trim()) issues.push(`cost missing ${option.id}`);
    if (!option.depth.opportunityCost.trim()) issues.push(`opportunity missing ${option.id}`);
  }

  const ids = new Set(model.options.map((option) => option.id));
  if (ids.size !== model.options.length) issues.push('duplicate option ids');

  return issues;
}
