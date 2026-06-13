import type { EventCard } from '@/core/models/EventCard';
import {
  buildEventInspectFindings,
  type EventInspectFindingKind,
  type EventInspectFindingTone,
} from '@/features/events/utils/eventInspectPhasePresentation';
import type { PlanOptionId } from '@/features/events/utils/eventWorkflowPlanPresentation';

export type EventPlanStrategyId = 'rapid_response' | 'balanced_plan' | 'long_term_fix';

export type EventPlanInspectSummaryTone = 'positive' | 'neutral' | 'warning' | 'urgent';

export type EventPlanInspectSummaryItem = {
  id: string;
  label: string;
  tone: EventPlanInspectSummaryTone;
  iconKey: string;
  sourceFindingId?: string;
};

export type EventPlanStrategyTone = 'teal' | 'green' | 'gold' | 'warning' | 'neutral';

export type EventPlanImpactBand = 'low' | 'medium' | 'high';

export type EventPlanTradeoffId = 'time' | 'resource' | 'social' | 'trust' | 'risk' | 'team';

export type EventPlanTradeoff = {
  id: EventPlanTradeoffId;
  label: string;
  valueText: string;
  tone: 'positive' | 'neutral' | 'warning';
  iconKey: string;
};

export type EventPlanExpectedImpact = {
  id:
    | 'duration'
    | 'resource_cost'
    | 'happiness'
    | 'district_trust'
    | 'tomorrow_risk'
    | 'success_chance';
  label: string;
  band: EventPlanImpactBand;
  tone: 'positive' | 'neutral' | 'warning';
};

export type EventPlanStrategyCard = {
  id: EventPlanStrategyId;
  title: string;
  description: string;
  tone: EventPlanStrategyTone;
  priority: 'low' | 'normal' | 'high';
  isRecommended?: boolean;
  isSelected: boolean;
  tradeoffs: EventPlanTradeoff[];
  expectedImpact: EventPlanExpectedImpact[];
  sourceLabel: string;
  sourceIds: string[];
};

export type EventPlanImpactPreview = {
  title: string;
  summary: string;
  impacts: EventPlanExpectedImpact[];
};

export type EventPlanAdvisorTone = 'calm' | 'teaching' | 'warning' | 'positive';

export type EventPlanAdvisorComment = {
  title: string;
  text: string;
  tone: EventPlanAdvisorTone;
};

export type EventPlanCtaActionKey = 'select_plan' | 'go_to_dispatch' | 'disabled';

export type EventPlanCta = {
  label: string;
  actionKey: EventPlanCtaActionKey;
  enabled: boolean;
};

export type EventPlanPhasePresentation = {
  title: string;
  subtitle?: string;
  inspectSummary: EventPlanInspectSummaryItem[];
  strategies: EventPlanStrategyCard[];
  selectedStrategyId: EventPlanStrategyId;
  recommendedStrategyId: EventPlanStrategyId;
  impactPreview: EventPlanImpactPreview;
  advisorComment: EventPlanAdvisorComment;
  primaryCta: EventPlanCta;
  accessibilityLabel: string;
};

export type BuildEventPlanPhasePresentationInput = {
  event: EventCard;
  selectedStrategyId?: EventPlanStrategyId | null;
  day?: number;
  isDay1LearningEvent?: boolean;
};

const STRATEGY_ORDER: EventPlanStrategyId[] = [
  'rapid_response',
  'balanced_plan',
  'long_term_fix',
];

const FORBIDDEN_PLAN_UI_PATTERNS = [
  /%\d+/,
  /başarı\s*%/i,
  /success\s*%/i,
  /\d+%\s*başarı/i,
] as const;

const SUMMARY_LABEL_BY_KIND: Partial<
  Record<EventInspectFindingKind, { label: string; iconKey: string }>
> = {
  risk: { label: 'Risk izleniyor', iconKey: 'pulse-outline' },
  district: { label: 'Mahalle etkisi', iconKey: 'location-outline' },
  resource: { label: 'Kaynak baskısı', iconKey: 'briefcase-outline' },
  social: { label: 'Sosyal hassas', iconKey: 'chatbubbles-outline' },
  route: { label: 'Rota kritik', iconKey: 'git-network-outline' },
  team: { label: 'Ekip temposu', iconKey: 'people-outline' },
  opportunity: { label: 'Plan etkisi', iconKey: 'analytics-outline' },
  general: { label: 'Olay bağlamı', iconKey: 'document-text-outline' },
};

function mapFindingTone(tone: EventInspectFindingTone): EventPlanInspectSummaryTone {
  if (tone === 'urgent') return 'urgent';
  if (tone === 'warning') return 'warning';
  if (tone === 'positive') return 'positive';
  return 'neutral';
}

export function mapStrategyIdToPlanOptionId(strategyId: EventPlanStrategyId): PlanOptionId {
  switch (strategyId) {
    case 'rapid_response':
      return 'fast';
    case 'long_term_fix':
      return 'economy';
    default:
      return 'balanced';
  }
}

export function mapPlanOptionIdToStrategyId(planId: PlanOptionId): EventPlanStrategyId {
  switch (planId) {
    case 'fast':
      return 'rapid_response';
    case 'economy':
      return 'long_term_fix';
    default:
      return 'balanced_plan';
  }
}

function hasResourcePressure(event: EventCard): boolean {
  return event.decisions.some((decision) => {
    const costs = decision.costs;
    if (!costs) return false;
    return (
      (costs.budget ?? 0) > 0 ||
      (costs.staffHours ?? 0) > 0 ||
      (costs.vehicleUsage ?? 0) > 0
    );
  });
}

function isSocialSensitive(event: EventCard): boolean {
  return (event.previewEffects?.publicSatisfaction ?? 0) <= -5;
}

export function resolveRecommendedPlanStrategyId(
  event: EventCard,
  input: Pick<BuildEventPlanPhasePresentationInput, 'day' | 'isDay1LearningEvent'>,
): EventPlanStrategyId {
  if (input.isDay1LearningEvent || input.day === 1) {
    return 'balanced_plan';
  }

  const resourcePressure = hasResourcePressure(event);
  const socialSensitive = isSocialSensitive(event);
  const { riskLevel } = event;

  if (riskLevel === 'critical' && !resourcePressure) {
    return 'rapid_response';
  }

  if (riskLevel === 'critical' || riskLevel === 'high' || socialSensitive || resourcePressure) {
    return 'balanced_plan';
  }

  if (riskLevel === 'low' && event.urgencyHours >= 6) {
    return 'long_term_fix';
  }

  return 'balanced_plan';
}

export function buildEventPlanInspectSummary(event: EventCard): EventPlanInspectSummaryItem[] {
  const findings = buildEventInspectFindings(event);
  const items: EventPlanInspectSummaryItem[] = [];

  for (const finding of findings) {
    if (items.length >= 3) break;
    const mapped = SUMMARY_LABEL_BY_KIND[finding.kind];
    items.push({
      id: `summary-${finding.id}`,
      label: mapped?.label ?? finding.title.split(' ').slice(0, 2).join(' '),
      tone: mapFindingTone(finding.tone),
      iconKey: mapped?.iconKey ?? finding.iconKey,
      sourceFindingId: finding.id,
    });
  }

  if (items.length === 0) {
    const fallback: EventPlanInspectSummaryItem[] = [
      {
        id: 'summary-context',
        label: 'Olay bağlamı',
        tone: 'neutral',
        iconKey: 'document-text-outline',
      },
      {
        id: 'summary-impact',
        label: 'Plan etkisi',
        tone: 'neutral',
        iconKey: 'analytics-outline',
      },
    ];
    return fallback.slice(0, 3);
  }

  if (items.length === 1) {
    items.push({
      id: 'summary-impact-fallback',
      label: 'Plan etkisi',
      tone: 'neutral',
      iconKey: 'analytics-outline',
    });
  }

  return items.slice(0, 3);
}

type StrategyTemplate = Omit<
  EventPlanStrategyCard,
  'isRecommended' | 'isSelected'
>;

function buildStrategyTemplates(event: EventCard): Record<EventPlanStrategyId, StrategyTemplate> {
  const eventId = event.id;
  return {
    rapid_response: {
      id: 'rapid_response',
      title: 'Hızlı Müdahale',
      description: 'Kısa sürede sahaya müdahale; kaynak tüketimi artabilir.',
      tone: 'teal',
      priority: 'high',
      tradeoffs: [
        {
          id: 'time',
          label: 'Süre',
          valueText: 'Hızlı',
          tone: 'positive',
          iconKey: 'time-outline',
        },
        {
          id: 'resource',
          label: 'Kaynak',
          valueText: 'Yüksek',
          tone: 'warning',
          iconKey: 'briefcase-outline',
        },
        {
          id: 'social',
          label: 'Sosyal',
          valueText: 'Hızlı tepki',
          tone: 'positive',
          iconKey: 'chatbubbles-outline',
        },
        {
          id: 'risk',
          label: 'Yarın riski',
          valueText: 'Artabilir',
          tone: 'warning',
          iconKey: 'pulse-outline',
        },
      ],
      expectedImpact: [
        { id: 'duration', label: 'Süre', band: 'low', tone: 'positive' },
        { id: 'resource_cost', label: 'Kaynak', band: 'high', tone: 'warning' },
        { id: 'happiness', label: 'Sosyal etki', band: 'medium', tone: 'positive' },
        { id: 'tomorrow_risk', label: 'Yarın riski', band: 'medium', tone: 'warning' },
      ],
      sourceLabel: 'Hızlı müdahale şablonu',
      sourceIds: [eventId, 'strategy:rapid_response'],
    },
    balanced_plan: {
      id: 'balanced_plan',
      title: 'Dengeli Çözüm',
      description: 'Kaynak ve sosyal etkiyi dengeleyen güvenli yaklaşım.',
      tone: 'green',
      priority: 'normal',
      tradeoffs: [
        {
          id: 'time',
          label: 'Süre',
          valueText: 'Orta',
          tone: 'neutral',
          iconKey: 'time-outline',
        },
        {
          id: 'resource',
          label: 'Kaynak',
          valueText: 'Dengeli',
          tone: 'neutral',
          iconKey: 'briefcase-outline',
        },
        {
          id: 'trust',
          label: 'Güven',
          valueText: 'Güven +',
          tone: 'positive',
          iconKey: 'shield-checkmark-outline',
        },
        {
          id: 'social',
          label: 'Sosyal',
          valueText: 'Dengeli',
          tone: 'neutral',
          iconKey: 'chatbubbles-outline',
        },
      ],
      expectedImpact: [
        { id: 'duration', label: 'Süre', band: 'medium', tone: 'neutral' },
        { id: 'resource_cost', label: 'Kaynak', band: 'medium', tone: 'neutral' },
        { id: 'district_trust', label: 'Güven', band: 'medium', tone: 'positive' },
        { id: 'tomorrow_risk', label: 'Yarın riski', band: 'low', tone: 'positive' },
      ],
      sourceLabel: 'Dengeli çözüm şablonu',
      sourceIds: [eventId, 'strategy:balanced_plan'],
    },
    long_term_fix: {
      id: 'long_term_fix',
      title: 'Kalıcı Yatırım',
      description: 'Uzun vadeli güven için planlama; acil olayda yavaş kalabilir.',
      tone: 'gold',
      priority: 'normal',
      tradeoffs: [
        {
          id: 'time',
          label: 'Süre',
          valueText: 'Yavaş',
          tone: 'warning',
          iconKey: 'time-outline',
        },
        {
          id: 'resource',
          label: 'Kaynak',
          valueText: 'Planlama',
          tone: 'warning',
          iconKey: 'briefcase-outline',
        },
        {
          id: 'trust',
          label: 'Güven',
          valueText: 'Artabilir',
          tone: 'positive',
          iconKey: 'shield-checkmark-outline',
        },
        {
          id: 'risk',
          label: 'Yarın riski',
          valueText: 'Azalır',
          tone: 'positive',
          iconKey: 'pulse-outline',
        },
      ],
      expectedImpact: [
        { id: 'duration', label: 'Süre', band: 'high', tone: 'warning' },
        { id: 'resource_cost', label: 'Kaynak', band: 'high', tone: 'warning' },
        { id: 'district_trust', label: 'Güven', band: 'high', tone: 'positive' },
        { id: 'tomorrow_risk', label: 'Yarın riski', band: 'low', tone: 'positive' },
      ],
      sourceLabel: 'Kalıcı yatırım şablonu',
      sourceIds: [eventId, 'strategy:long_term_fix'],
    },
  };
}

function buildImpactPreview(strategy: EventPlanStrategyCard): EventPlanImpactPreview {
  const bandLabel = (band: EventPlanImpactBand): string => {
    switch (band) {
      case 'low':
        return 'düşük';
      case 'high':
        return 'yüksek';
      default:
        return 'orta';
    }
  };

  const impacts = strategy.expectedImpact.slice(0, 4);
  const summaryParts = impacts.map((impact) => `${impact.label}: ${bandLabel(impact.band)}`);

  return {
    title: 'Beklenen etki',
    summary: `Tahmini etki — ${summaryParts.join(' · ')}`,
    impacts,
  };
}

export function buildEventPlanAdvisorComment(
  strategy: EventPlanStrategyCard,
  input: Pick<BuildEventPlanPhasePresentationInput, 'isDay1LearningEvent' | 'day'>,
): EventPlanAdvisorComment {
  if (input.isDay1LearningEvent || input.day === 1) {
    return {
      title: 'Ece',
      text: 'Dengeli çözüm, kaynak baskısını büyütmeden sosyal tepkiyi kontrol etmeye yardımcı olur.',
      tone: 'teaching',
    };
  }

  switch (strategy.id) {
    case 'rapid_response':
      return {
        title: 'Ece',
        text: 'Hızlı müdahale iyi görünse de araç yorgunluğu varsa sonraki görevi zorlayabilir.',
        tone: 'warning',
      };
    case 'long_term_fix':
      return {
        title: 'Ece',
        text: 'Kalıcı yatırım güveni artırabilir ama acil riskte yavaş kalabilir.',
        tone: 'calm',
      };
    default:
      return {
        title: 'Ece',
        text: 'Dengeli çözüm, kaynak baskısını büyütmeden sosyal tepkiyi kontrol etmeye yardımcı olur.',
        tone: 'positive',
      };
  }
}

function buildStrategies(
  event: EventCard,
  selectedStrategyId: EventPlanStrategyId,
  recommendedStrategyId: EventPlanStrategyId,
): EventPlanStrategyCard[] {
  const templates = buildStrategyTemplates(event);
  return STRATEGY_ORDER.map((id) => {
    const template = templates[id];
    return {
      ...template,
      isRecommended: id === recommendedStrategyId,
      isSelected: id === selectedStrategyId,
    };
  });
}

function buildPlanCta(selectedStrategyId: EventPlanStrategyId | null | undefined): EventPlanCta {
  if (!selectedStrategyId) {
    return {
      label: 'Yaklaşım seç',
      actionKey: 'select_plan',
      enabled: false,
    };
  }

  return {
    label: 'Yönlendirmeye Geç',
    actionKey: 'go_to_dispatch',
    enabled: true,
  };
}

export function buildEventPlanPhasePresentation(
  input: BuildEventPlanPhasePresentationInput,
): EventPlanPhasePresentation {
  const { event } = input;
  const recommendedStrategyId = resolveRecommendedPlanStrategyId(event, input);
  const selectedStrategyId = input.selectedStrategyId ?? recommendedStrategyId;
  const inspectSummary = buildEventPlanInspectSummary(event);
  const strategies = buildStrategies(event, selectedStrategyId, recommendedStrategyId);
  const selectedStrategy =
    strategies.find((strategy) => strategy.id === selectedStrategyId) ?? strategies[1]!;
  const impactPreview = buildImpactPreview(selectedStrategy);
  const advisorComment = buildEventPlanAdvisorComment(selectedStrategy, input);

  return {
    title: 'Planla',
    subtitle: 'İnceleme bulgularına göre bir yaklaşım seç.',
    inspectSummary,
    strategies,
    selectedStrategyId,
    recommendedStrategyId,
    impactPreview,
    advisorComment,
    primaryCta: buildPlanCta(selectedStrategyId),
    accessibilityLabel: `${event.title} planlama, ${selectedStrategy.title} seçili`,
  };
}

export function planPresentationTextContainsForbiddenPatterns(text: string): boolean {
  return FORBIDDEN_PLAN_UI_PATTERNS.some((pattern) => pattern.test(text));
}

export function auditEventPlanPhasePresentation(model: EventPlanPhasePresentation): string[] {
  const issues: string[] = [];

  if (!model.title.trim()) issues.push('title empty');
  if (!model.accessibilityLabel.trim()) issues.push('accessibilityLabel empty');
  if (model.inspectSummary.length > 3) issues.push('inspectSummary above max');
  if (model.strategies.length < 2 || model.strategies.length > 3) {
    issues.push('strategies count out of range');
  }

  const strategyIds = new Set<string>();
  let recommendedCount = 0;

  for (const strategy of model.strategies) {
    if (strategyIds.has(strategy.id)) issues.push(`duplicate strategy id ${strategy.id}`);
    strategyIds.add(strategy.id);
    if (strategy.isRecommended) recommendedCount += 1;
    if (strategy.tradeoffs.length === 0) {
      issues.push(`tradeoffs empty for ${strategy.id}`);
    }
    if (strategy.expectedImpact.length > 4) {
      issues.push(`expectedImpact above max for ${strategy.id}`);
    }

    const blob = [
      strategy.title,
      strategy.description,
      ...strategy.tradeoffs.map((t) => t.valueText),
      ...strategy.expectedImpact.map((i) => i.label),
      model.impactPreview.summary,
    ].join(' ');

    if (planPresentationTextContainsForbiddenPatterns(blob)) {
      issues.push(`forbidden percent language in ${strategy.id}`);
    }
  }

  if (recommendedCount > 1) issues.push('multiple recommended strategies');
  if (recommendedCount === 0) issues.push('no recommended strategy');

  if (!model.strategies.some((s) => s.id === model.selectedStrategyId)) {
    issues.push('selectedStrategyId not in strategies');
  }

  for (const impact of model.impactPreview.impacts) {
    if (!['low', 'medium', 'high'].includes(impact.band)) {
      issues.push(`invalid impact band ${impact.id}`);
    }
  }

  if (!model.advisorComment.text.trim()) issues.push('advisorComment empty');

  if (model.primaryCta.actionKey !== 'go_to_dispatch' || !model.primaryCta.enabled) {
    issues.push('CTA should be go_to_dispatch enabled when strategy selected');
  }

  return issues;
}

export function getPlanStrategyLabel(strategyId: EventPlanStrategyId): string {
  switch (strategyId) {
    case 'rapid_response':
      return 'Hızlı Müdahale';
    case 'long_term_fix':
      return 'Kalıcı Yatırım';
    default:
      return 'Dengeli Çözüm';
  }
}
