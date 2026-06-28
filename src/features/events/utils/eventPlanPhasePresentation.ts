import type { EventCard } from '@/core/models/EventCard';
import {
  buildEceMemorySnapshot,
  buildPlanEceLine,
  mapEceToneToPlanAdvisorTone,
  mapEceToneToToneLabel,
  type EceMemoryContextInput,
} from '@/core/eceTone';
import {
  getEventGameplayVarietyProfile,
  planStrategyVarietyNote,
} from '@/core/eventVariety/eventGameplayVarietyPresentation';
import { applyAuthorityToPlanStrategies } from '@/core/authority/authorityGameplayUnlockPresentation';
import {
  buildEventInspectFindings,
  type EventInspectFindingKind,
  type EventInspectFindingTone,
} from '@/features/events/utils/eventInspectPhasePresentation';
import {
  buildInspectToPlanBridge,
  buildOperationPhaseTransitionPresentation,
  type OperationPhaseTransitionPresentation,
} from '@/features/events/utils/operationPhaseTransitionPresentation';
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

export type EventPlanGameplayTradeoff = {
  id: 'gain' | 'risk' | 'cost' | 'system';
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
  pros: string[];
  cons: string[];
  costLabel: string;
  riskLabel: string;
  tradeoffs: EventPlanTradeoff[];
  gameplayTradeoffs: EventPlanGameplayTradeoff[];
  expectedImpact: EventPlanExpectedImpact[];
  sourceLabel: string;
  sourceIds: string[];
};

export type EventPlanContextChip = {
  label: string;
  value: string;
  tone: EventPlanInspectSummaryTone;
};

export type EventPlanContextSummary = {
  title: string;
  summary: string;
  chips: EventPlanContextChip[];
};

export type EventPlanSelectedImpactItem = {
  id: string;
  label: string;
  description: string;
  deltaLabel: string;
  tone: 'positive' | 'neutral' | 'warning';
};

export type EventPlanSelectedPreview = {
  title: string;
  items: EventPlanSelectedImpactItem[];
};

export type EventPlanResourceBalanceItem = {
  label: string;
  value: string;
  tone: EventPlanInspectSummaryTone;
};

export type EventPlanResourceBalance = {
  title: string;
  items: EventPlanResourceBalanceItem[];
};

export type EventPlanActionKey = 'compare_risks' | 'view_resources' | 'view_map' | 'open_note';

export type EventPlanAction = {
  id: string;
  label: string;
  iconKey: string;
  actionKey: EventPlanActionKey;
};

export type EventPlanPhaseContextChip = {
  label: string;
  value: string;
  tone: EventPlanInspectSummaryTone;
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
  toneLabel: string;
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
  phaseHeading: string;
  phaseDescription: string;
  phaseContextChips: EventPlanPhaseContextChip[];
  contextSummary: EventPlanContextSummary;
  inspectSummary: EventPlanInspectSummaryItem[];
  strategies: EventPlanStrategyCard[];
  selectedStrategyId: EventPlanStrategyId;
  recommendedStrategyId: EventPlanStrategyId;
  selectedPlanPreview: EventPlanSelectedPreview;
  impactPreview: EventPlanImpactPreview;
  resourceBalance: EventPlanResourceBalance;
  advisorComment: EventPlanAdvisorComment;
  actions: EventPlanAction[];
  primaryCta: EventPlanCta;
  accessibilityLabel: string;
  phaseTransition: OperationPhaseTransitionPresentation;
};

export type BuildEventPlanPhasePresentationInput = {
  event: EventCard;
  selectedStrategyId?: EventPlanStrategyId | null;
  day?: number;
  isDay1LearningEvent?: boolean;
  recentVarietyProfiles?: import('@/core/eventVariety/eventGameplayVarietyTypes').BuildEventGameplayVarietyProfileInput['recentProfiles'];
  authorityGameplayContext?: import('@/core/authority/authorityGameplayUnlockTypes').AuthorityGameplayPresentationContext;
  eceMemoryContext?: EceMemoryContextInput;
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

export function buildEventPlanInspectSummary(
  event: EventCard,
  varietyInput?: Pick<BuildEventPlanPhasePresentationInput, 'day' | 'isDay1LearningEvent' | 'recentVarietyProfiles'>,
): EventPlanInspectSummaryItem[] {
  const findings = buildEventInspectFindings(event, varietyInput);
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
  'isRecommended' | 'isSelected' | 'gameplayTradeoffs'
>;

const STRATEGY_TRADEOFF_COPY: Record<
  EventPlanStrategyId,
  Pick<EventPlanStrategyCard, 'pros' | 'cons' | 'costLabel' | 'riskLabel'>
> = {
  rapid_response: {
    pros: ['Güven hızlı toparlanır', 'Sosyal tepki düşebilir'],
    cons: ['Ekip yorgunluğu artar'],
    costLabel: 'Yüksek maliyet',
    riskLabel: 'Orta risk',
  },
  balanced_plan: {
    pros: ['Ekip temposu korunur', 'Risk kontrollü düşer'],
    cons: ['Sosyal tepki yavaş toparlanır'],
    costLabel: 'Dengeli maliyet',
    riskLabel: 'Düşük risk',
  },
  long_term_fix: {
    pros: ['Yarın riski azalır', 'Benzer olay tekrarı düşebilir'],
    cons: ['Daha fazla kaynak ister'],
    costLabel: 'Pahalı',
    riskLabel: 'Stratejik',
  },
};

function toneToBandLabel(tone: EventPlanInspectSummaryTone): string {
  switch (tone) {
    case 'urgent':
    case 'warning':
      return 'Yüksek';
    case 'positive':
      return 'Düşük';
    default:
      return 'Orta';
  }
}

function resolveRiskContextLabel(riskLevel: EventCard['riskLevel']): string {
  switch (riskLevel) {
    case 'critical':
    case 'high':
      return 'Yüksek';
    case 'low':
      return 'Düşük';
    default:
      return 'Orta';
  }
}

function resolveResourceContextLabel(event: EventCard): string {
  if (hasResourcePressure(event)) return 'Sınırlı';
  return 'Orta';
}

function buildPhaseContextChips(event: EventCard): EventPlanPhaseContextChip[] {
  const district = event.district?.trim() || 'Mahalle';
  return [
    {
      label: 'Risk',
      value: resolveRiskContextLabel(event.riskLevel),
      tone: event.riskLevel === 'low' ? 'positive' : event.riskLevel === 'critical' ? 'urgent' : 'warning',
    },
    {
      label: 'Kaynak',
      value: resolveResourceContextLabel(event),
      tone: hasResourcePressure(event) ? 'warning' : 'neutral',
    },
    {
      label: 'Mahalle',
      value: district,
      tone: 'neutral',
    },
  ];
}

function mapBridgeToneToPlanTone(
  tone: import('@/features/events/utils/operationPhaseTransitionPresentation').OperationPhaseBridgeChipTone,
): EventPlanInspectSummaryTone {
  if (tone === 'positive') return 'positive';
  if (tone === 'warning' || tone === 'critical') return 'warning';
  if (tone === 'mixed') return 'neutral';
  return 'neutral';
}

function buildContextSummary(
  event: EventCard,
  inspectSummary: EventPlanInspectSummaryItem[],
): EventPlanContextSummary {
  const bridge = buildInspectToPlanBridge(event);
  const chips: EventPlanContextChip[] = bridge.chips.map((chip) => ({
    label: chip.label,
    value: chip.value,
    tone: mapBridgeToneToPlanTone(chip.tone),
  }));

  if (chips.length === 0 && inspectSummary.length > 0) {
    inspectSummary.slice(0, 3).forEach((item) => {
      chips.push({
        label: item.label,
        value: toneToBandLabel(item.tone),
        tone: item.tone,
      });
    });
  }

  return {
    title: bridge.title,
    summary: bridge.summary,
    chips,
  };
}

function buildSelectedPlanPreview(strategy: EventPlanStrategyCard): EventPlanSelectedPreview {
  switch (strategy.id) {
    case 'rapid_response':
      return {
        title: 'Tahmini Etki',
        items: [
          {
            id: 'trust',
            label: 'Güven',
            description: 'Hızlı toparlanması beklenir.',
            deltaLabel: '+ Güven',
            tone: 'positive',
          },
          {
            id: 'risk',
            label: 'Risk',
            description: 'Kısa vadede düşebilir.',
            deltaLabel: '- Risk',
            tone: 'positive',
          },
          {
            id: 'resource',
            label: 'Kaynak',
            description: 'Baskı artabilir.',
            deltaLabel: 'Kaynak baskısı',
            tone: 'warning',
          },
          {
            id: 'team',
            label: 'Ekip',
            description: 'Yorgunluk artabilir.',
            deltaLabel: 'Ekip yorulur',
            tone: 'warning',
          },
        ],
      };
    case 'long_term_fix':
      return {
        title: 'Tahmini Etki',
        items: [
          {
            id: 'trust',
            label: 'Güven',
            description: 'Yavaş artış beklenir.',
            deltaLabel: '+ Güven',
            tone: 'neutral',
          },
          {
            id: 'risk',
            label: 'Risk',
            description: 'Yarın azalabilir.',
            deltaLabel: '- Risk',
            tone: 'positive',
          },
          {
            id: 'resource',
            label: 'Kaynak',
            description: 'Maliyetli olabilir.',
            deltaLabel: 'Maliyetli',
            tone: 'warning',
          },
          {
            id: 'team',
            label: 'Ekip',
            description: 'Planlı yük oluşabilir.',
            deltaLabel: 'Planlı yük',
            tone: 'neutral',
          },
        ],
      };
    default:
      return {
        title: 'Tahmini Etki',
        items: [
          {
            id: 'trust',
            label: 'Güven',
            description: 'Orta artış beklenir.',
            deltaLabel: '+ Güven',
            tone: 'positive',
          },
          {
            id: 'risk',
            label: 'Risk',
            description: 'Kontrollü düşüş beklenir.',
            deltaLabel: '- Risk',
            tone: 'positive',
          },
          {
            id: 'resource',
            label: 'Kaynak',
            description: 'Dengede kalabilir.',
            deltaLabel: 'Dengede',
            tone: 'neutral',
          },
          {
            id: 'team',
            label: 'Ekip',
            description: 'Temposu korunabilir.',
            deltaLabel: 'Tempo korunur',
            tone: 'positive',
          },
        ],
      };
  }
}

function buildResourceBalance(event: EventCard): EventPlanResourceBalance {
  const socialTone: EventPlanInspectSummaryTone = isSocialSensitive(event)
    ? 'warning'
    : 'neutral';
  const socialValue = isSocialSensitive(event) ? 'Yüksek' : 'Orta';
  const teamValue = hasResourcePressure(event) ? 'Sınırlı' : 'Hazır';
  const budgetValue = hasResourcePressure(event) ? 'Orta' : 'Rahat';

  return {
    title: 'Kaynak Dengesi',
    items: [
      {
        label: 'Ekip',
        value: teamValue,
        tone: teamValue === 'Sınırlı' ? 'warning' : 'positive',
      },
      {
        label: 'Araç',
        value: 'Hazır',
        tone: 'positive',
      },
      {
        label: 'Bütçe',
        value: budgetValue,
        tone: budgetValue === 'Orta' ? 'neutral' : 'positive',
      },
      {
        label: 'Sosyal Tepki',
        value: socialValue,
        tone: socialTone,
      },
    ],
  };
}

function buildPlanActions(): EventPlanAction[] {
  return [
    {
      id: 'compare_risks',
      label: 'Riskleri Karşılaştır',
      iconKey: 'warning-outline',
      actionKey: 'compare_risks',
    },
    {
      id: 'view_resources',
      label: 'Kaynakları Gör',
      iconKey: 'briefcase-outline',
      actionKey: 'view_resources',
    },
    {
      id: 'view_map',
      label: 'Haritada Kontrol Et',
      iconKey: 'map-outline',
      actionKey: 'view_map',
    },
    {
      id: 'open_note',
      label: 'Not Aç',
      iconKey: 'create-outline',
      actionKey: 'open_note',
    },
  ];
}

function resolveAdvisorToneLabel(tone: EventPlanAdvisorTone): string {
  switch (tone) {
    case 'warning':
      return 'Uyarı';
    case 'teaching':
      return 'Öğretici';
    case 'positive':
      return 'Önerilir';
    default:
      return 'Dengeli';
  }
}

function applyVarietyToStrategyTemplate(
  template: StrategyTemplate,
  event: EventCard,
  input: Pick<BuildEventPlanPhasePresentationInput, 'day' | 'isDay1LearningEvent' | 'recentVarietyProfiles'>,
): StrategyTemplate {
  const profile = getEventGameplayVarietyProfile(event, {
    day: input.day,
    isDay1LearningEvent: input.isDay1LearningEvent,
    recentProfiles: input.recentVarietyProfiles,
  });

  if (profile.primaryPressure === 'calm_standard') {
    return template;
  }

  const varietyNote = planStrategyVarietyNote(template.id, profile);
  if (!varietyNote) {
    return template;
  }

  const adjustedImpacts = template.expectedImpact.map((impact) => {
    if (template.id === 'rapid_response' && impact.id === 'resource_cost' && profile.domain === 'transport') {
      return { ...impact, band: 'high' as const, tone: 'warning' as const };
    }
    if (
      template.id === 'long_term_fix' &&
      impact.id === 'tomorrow_risk' &&
      (profile.domain === 'environment' || profile.domain === 'container')
    ) {
      return { ...impact, band: 'low' as const, tone: 'positive' as const };
    }
    if (
      template.id === 'rapid_response' &&
      impact.id === 'tomorrow_risk' &&
      profile.domain === 'maintenance'
    ) {
      return { ...impact, band: 'medium' as const, tone: 'warning' as const };
    }
    if (
      template.id === 'balanced_plan' &&
      impact.id === 'district_trust' &&
      profile.domain === 'social'
    ) {
      return { ...impact, band: 'medium' as const, tone: 'positive' as const };
    }
    return impact;
  });

  return {
    ...template,
    description: varietyNote,
    expectedImpact: adjustedImpacts,
    sourceIds: [...template.sourceIds, `variety:${profile.primaryPressure}`].filter(
      (id, idx, arr) => arr.indexOf(id) === idx,
    ),
  };
}

function buildStrategyTemplates(
  event: EventCard,
  input: Pick<BuildEventPlanPhasePresentationInput, 'day' | 'isDay1LearningEvent' | 'recentVarietyProfiles'>,
): Record<EventPlanStrategyId, StrategyTemplate> {
  const eventId = event.id;
  const base: Record<EventPlanStrategyId, StrategyTemplate> = {
    rapid_response: {
      id: 'rapid_response',
      title: 'Hızlı Müdahale',
      description: 'Görünür ekip etkisiyle güveni hızlı toparlar.',
      tone: 'teal',
      priority: 'high',
      ...STRATEGY_TRADEOFF_COPY.rapid_response,
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
      title: 'Dengeli Plan',
      description: 'Kaynakları kontrollü kullanır, riski kademeli azaltır.',
      tone: 'green',
      priority: 'normal',
      ...STRATEGY_TRADEOFF_COPY.balanced_plan,
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
      title: 'Önleyici Plan',
      description: 'Bugünkü müdahaleyi yarınki riski azaltacak şekilde genişletir.',
      tone: 'gold',
      priority: 'normal',
      ...STRATEGY_TRADEOFF_COPY.long_term_fix,
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

  return {
    rapid_response: applyVarietyToStrategyTemplate(base.rapid_response, event, input),
    balanced_plan: applyVarietyToStrategyTemplate(base.balanced_plan, event, input),
    long_term_fix: applyVarietyToStrategyTemplate(base.long_term_fix, event, input),
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
    title: 'Tahmini Etki',
    summary: `Olası etki — ${summaryParts.join(' · ')}`,
    impacts,
  };
}

function resolveTradeoffValue(
  template: StrategyTemplate,
  tradeoffId: EventPlanTradeoffId,
  fallback: string,
): string {
  return template.tradeoffs.find((tradeoff) => tradeoff.id === tradeoffId)?.valueText ?? fallback;
}

function buildGameplayTradeoffs(template: StrategyTemplate): EventPlanGameplayTradeoff[] {
  switch (template.id) {
    case 'rapid_response':
      return [
        {
          id: 'gain',
          label: 'Kazanç',
          valueText: 'Güven hızlı toparlanır',
          tone: 'positive',
          iconKey: 'trending-up-outline',
        },
        {
          id: 'risk',
          label: 'Risk',
          valueText: resolveTradeoffValue(template, 'risk', 'Yarın baskısı artabilir'),
          tone: 'warning',
          iconKey: 'alert-circle-outline',
        },
        {
          id: 'cost',
          label: 'Maliyet',
          valueText: resolveTradeoffValue(template, 'resource', 'Kaynak yüksek'),
          tone: 'warning',
          iconKey: 'wallet-outline',
        },
        {
          id: 'system',
          label: 'Sistem',
          valueText: 'Ekip temposu',
          tone: 'neutral',
          iconKey: 'people-outline',
        },
      ];
    case 'long_term_fix':
      return [
        {
          id: 'gain',
          label: 'Kazanç',
          valueText: 'Yarın riski azalır',
          tone: 'positive',
          iconKey: 'calendar-outline',
        },
        {
          id: 'risk',
          label: 'Risk',
          valueText: resolveTradeoffValue(template, 'time', 'Yavaş'),
          tone: 'warning',
          iconKey: 'time-outline',
        },
        {
          id: 'cost',
          label: 'Maliyet',
          valueText: resolveTradeoffValue(template, 'resource', 'Planlama'),
          tone: 'warning',
          iconKey: 'wallet-outline',
        },
        {
          id: 'system',
          label: 'Sistem',
          valueText: 'Operasyon baskısı',
          tone: 'neutral',
          iconKey: 'pulse-outline',
        },
      ];
    default:
      return [
        {
          id: 'gain',
          label: 'Kazanç',
          valueText: resolveTradeoffValue(template, 'trust', 'Güven dengeli'),
          tone: 'positive',
          iconKey: 'shield-checkmark-outline',
        },
        {
          id: 'risk',
          label: 'Risk',
          valueText: 'Düşük risk',
          tone: 'neutral',
          iconKey: 'alert-circle-outline',
        },
        {
          id: 'cost',
          label: 'Maliyet',
          valueText: resolveTradeoffValue(template, 'resource', 'Dengeli'),
          tone: 'neutral',
          iconKey: 'wallet-outline',
        },
        {
          id: 'system',
          label: 'Sistem',
          valueText: resolveTradeoffValue(template, 'social', 'Sosyal denge'),
          tone: 'neutral',
          iconKey: 'chatbubbles-outline',
        },
      ];
  }
}

export function buildEventPlanAdvisorComment(
  strategy: EventPlanStrategyCard | null,
  input: Pick<
    BuildEventPlanPhasePresentationInput,
    'event' | 'isDay1LearningEvent' | 'day' | 'recentVarietyProfiles' | 'eceMemoryContext'
  >,
): EventPlanAdvisorComment {
  const day = input.day ?? input.event.day ?? 1;
  const memoryContext: EceMemoryContextInput = {
    day,
    event: input.event,
    eventId: input.event.id,
    districtName: input.event.district,
    selectedPlanId: strategy?.id,
    selectedPlanLabel: strategy?.title,
    resourcePressure: hasResourcePressure(input.event),
    socialPressure: (input.event.previewEffects?.publicSatisfaction ?? 0) <= -3,
    ...input.eceMemoryContext,
  };

  if (strategy) {
    const profile = getEventGameplayVarietyProfile(input.event, {
      day: input.day,
      isDay1LearningEvent: input.isDay1LearningEvent,
      recentProfiles: input.recentVarietyProfiles,
    });
    const varietyNote = planStrategyVarietyNote(strategy.id, profile);
    if (varietyNote && profile.planHintLine && day > 1 && !input.isDay1LearningEvent) {
      const tone =
        strategy.id === 'rapid_response' && profile.domain === 'maintenance' ? 'warning' : 'calm';
      return {
        title: 'Ece',
        text: varietyNote,
        tone,
        toneLabel: resolveAdvisorToneLabel(tone),
      };
    }
  }

  const memory = buildEceMemorySnapshot(memoryContext);
  const inspectAvoid = input.eceMemoryContext?.avoidLines ?? [];
  const line = buildPlanEceLine({
    memory,
    context: memoryContext,
    seed: `${input.event.id}:plan:${strategy?.id ?? 'none'}:${day}`,
    selectedPlanId: strategy?.id ?? null,
    avoidLines: inspectAvoid,
  });

  if (input.isDay1LearningEvent || day === 1) {
    return {
      title: 'Ece',
      text: line.message,
      tone: 'teaching',
      toneLabel: 'Öğretici',
    };
  }

  const tone = mapEceToneToPlanAdvisorTone(line.tone);
  return {
    title: 'Ece',
    text: line.message,
    tone,
    toneLabel: mapEceToneToToneLabel(line.tone),
  };
}

function buildStrategies(
  event: EventCard,
  selectedStrategyId: EventPlanStrategyId,
  recommendedStrategyId: EventPlanStrategyId,
  input: Pick<BuildEventPlanPhasePresentationInput, 'day' | 'isDay1LearningEvent' | 'recentVarietyProfiles'>,
): EventPlanStrategyCard[] {
  const templates = buildStrategyTemplates(event, input);
  return STRATEGY_ORDER.map((id) => {
    const template = templates[id];
    return {
      ...template,
      isRecommended: id === recommendedStrategyId,
      isSelected: id === selectedStrategyId,
      gameplayTradeoffs: buildGameplayTradeoffs(template),
    };
  });
}

function buildPlanCta(selectedStrategyId: EventPlanStrategyId | null | undefined): EventPlanCta {
  if (!selectedStrategyId) {
    return {
      label: 'Önce Plan Seç',
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
  const explicitSelection = input.selectedStrategyId ?? null;
  const selectedStrategyId = explicitSelection ?? recommendedStrategyId;
  const inspectSummary = buildEventPlanInspectSummary(event, {
    day: input.day,
    isDay1LearningEvent: input.isDay1LearningEvent,
    recentVarietyProfiles: input.recentVarietyProfiles,
  });
  const contextSummary = buildContextSummary(event, inspectSummary);
  const phaseContextChips = buildPhaseContextChips(event);
  const strategiesRaw = buildStrategies(event, selectedStrategyId, recommendedStrategyId, {
    day: input.day,
    isDay1LearningEvent: input.isDay1LearningEvent,
    recentVarietyProfiles: input.recentVarietyProfiles,
  });
  const varietyProfile = getEventGameplayVarietyProfile(event, {
    day: input.day,
    isDay1LearningEvent: input.isDay1LearningEvent,
    recentProfiles: input.recentVarietyProfiles,
  });
  const strategies = applyAuthorityToPlanStrategies(
    strategiesRaw,
    input.authorityGameplayContext,
    varietyProfile,
  );
  const selectedStrategy =
    strategies.find((strategy) => strategy.id === selectedStrategyId) ?? strategies[1]!;
  const selectedPlanPreview = buildSelectedPlanPreview(selectedStrategy);
  const impactPreview = buildImpactPreview(selectedStrategy);
  const resourceBalance = buildResourceBalance(event);
  const advisorComment = buildEventPlanAdvisorComment(selectedStrategy, {
      event,
      day: input.day,
      isDay1LearningEvent: input.isDay1LearningEvent,
      recentVarietyProfiles: input.recentVarietyProfiles,
      eceMemoryContext: {
        ...input.eceMemoryContext,
        avoidLines: [
          ...(input.eceMemoryContext?.avoidLines ?? []),
        ],
      },
    });
  const actions = buildPlanActions();
  const primaryCta = buildPlanCta(explicitSelection ?? selectedStrategyId);
  const phaseTransition = buildOperationPhaseTransitionPresentation({
    phase: 'plan',
    event,
    planLabel: selectedStrategy.title,
    planId: selectedStrategy.id,
    planImpactLabel: selectedPlanPreview.items[0]?.label,
    planCostLabel: selectedStrategy.costLabel,
    ctaEnabled: primaryCta.enabled,
    ctaActionKey: primaryCta.actionKey,
    avoidSummaries: [advisorComment.text],
  });

  return {
    title: phaseTransition.shell.title,
    subtitle: phaseTransition.shell.subtitle,
    phaseHeading: 'Strateji Seçimi',
    phaseDescription: 'İncelemede toplanan sinyallere göre bir müdahale yaklaşımı seç.',
    phaseContextChips,
    contextSummary,
    inspectSummary,
    strategies,
    selectedStrategyId,
    recommendedStrategyId,
    selectedPlanPreview,
    impactPreview,
    resourceBalance,
    advisorComment,
    actions,
    primaryCta,
    phaseTransition,
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
    if (strategy.gameplayTradeoffs.length !== 4) {
      issues.push(`gameplayTradeoffs incomplete for ${strategy.id}`);
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
  if (!model.advisorComment.toneLabel.trim()) issues.push('advisorComment toneLabel empty');
  if (!model.contextSummary.summary.trim()) issues.push('contextSummary empty');
  if (model.selectedPlanPreview.items.length !== 4) issues.push('selectedPlanPreview items count');
  if (model.resourceBalance.items.length < 3) issues.push('resourceBalance incomplete');
  if (model.actions.length < 2) issues.push('actions incomplete');

  for (const strategy of model.strategies) {
    if (strategy.pros.length < 1) issues.push(`pros empty for ${strategy.id}`);
    if (strategy.cons.length < 1) issues.push(`cons empty for ${strategy.id}`);
  }

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
      return 'Önleyici Plan';
    default:
      return 'Dengeli Plan';
  }
}
