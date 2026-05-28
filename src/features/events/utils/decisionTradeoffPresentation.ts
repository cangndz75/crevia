import type { DailyPriorityKey } from '@/core/dailyPriority/dailyPriorityTypes';
import { getDailyPriorityChoice } from '@/core/dailyPriority/dailyPriorityPresentation';
import type { DecisionAffordabilityCheck } from '@/core/economy/economyAffordability';
import {
  buildDecisionPriorityHint,
  getEventPriorityRelation,
} from '@/core/events/eventContentPresentation';
import { mapEventToContentCategory } from '@/core/events/eventVariationEngine';
import type { EventContentCategory } from '@/core/events/eventContentTypes';
import { isContainerRelevantEvent } from '@/core/containers/containerDecisionEffects';
import type { PersonnelImpactPreview } from '@/core/personnel/personnelPresentation';
import type { VehicleImpactPreview } from '@/core/vehicles/vehiclePresentation';
import type { EventCard, EventDecision } from '@/core/models/EventCard';

export type DecisionStrategyTone =
  | 'action'
  | 'balanced'
  | 'social'
  | 'resource'
  | 'long_term'
  | 'neutral'
  | 'risky'
  | 'supportive'
  | 'technical';

export type DecisionRiskLevel = 'low' | 'balanced' | 'caution' | 'high';

export type DecisionPriorityFit =
  | 'supports'
  | 'indirect'
  | 'resource_pressure'
  | 'risks'
  | 'neutral';

export type PrimaryImpactKey =
  | 'personnel'
  | 'vehicle'
  | 'container'
  | 'social'
  | 'budget'
  | 'priority'
  | 'goal';

export type PrimaryDecisionImpact = {
  key: PrimaryImpactKey;
  label: string;
  text: string;
  tone: 'good' | 'warning' | 'risk' | 'neutral';
  iconName?: string;
  priority: number;
};

export type BuildPrimaryImpactsInput = {
  event: EventCard;
  decision: EventDecision;
  dailyPriorityKey?: DailyPriorityKey;
  personnelPreview?: PersonnelImpactPreview | null;
  vehiclePreview?: VehicleImpactPreview | null;
  affordability?: DecisionAffordabilityCheck;
};

const TRADEOFF_MAX_CHARS = 95;

const STRATEGY_BY_LABEL: Record<
  string,
  { label: string; tone: DecisionStrategyTone }
> = {
  'Hızlı çözüm': { label: 'Hızlı Müdahale', tone: 'action' },
  'Dengeli plan': { label: 'Dengeli Plan', tone: 'balanced' },
  'Sosyal rahatlama': { label: 'İletişim', tone: 'social' },
  'Kaynak korur': { label: 'Kaynak Korur', tone: 'resource' },
  'Kalıcı çözüm': { label: 'Kalıcı Çözüm', tone: 'long_term' },
};

const STYLE_FALLBACK: Record<
  string,
  { label: string; tone: DecisionStrategyTone }
> = {
  fast: { label: 'Hızlı Müdahale', tone: 'action' },
  planned: { label: 'İzle', tone: 'neutral' },
  partial: { label: 'Dengeli Plan', tone: 'balanced' },
  communication: { label: 'İletişim', tone: 'social' },
  permanent: { label: 'Kalıcı Çözüm', tone: 'long_term' },
  resource_saving: { label: 'Kaynak Korur', tone: 'resource' },
  risk: { label: 'Dikkat', tone: 'risky' },
};

const TRADEOFF_FALLBACK: Record<string, string> = {
  fast: 'Hızlı rahatlama sağlar, ekip ve araç yükünü artırır.',
  planned: 'Kaynak korur, sorun yarına sarkabilir.',
  partial: 'Operasyonu dengeler, sonuç biraz daha yavaş gelir.',
  communication: 'Sosyal baskıyı azaltır, saha etkisi sınırlı kalır.',
  permanent: 'Kalıcı rahatlama sağlar, bugün bütçe baskısı yaratır.',
  resource_saving: 'Bütçeyi korur, sorun yarına sarkabilir.',
  risk: 'Riskli müdahale; sonuç belirsiz kalabilir.',
};

const CATEGORY_PRIMARY: Partial<
  Record<EventContentCategory, PrimaryImpactKey[]>
> = {
  waste_container: ['container', 'vehicle', 'personnel'],
  social_pressure: ['social', 'priority'],
  vehicle_route: ['vehicle', 'container'],
  personnel_morale: ['personnel'],
  opportunity: ['priority', 'social'],
  permanent_solution: ['budget', 'container', 'vehicle'],
  citizen_complaint: ['social', 'priority'],
  maintenance: ['vehicle', 'personnel'],
};

function truncateText(text: string, max = TRADEOFF_MAX_CHARS): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

export function getDecisionStrategyLabel(decision: EventDecision): string {
  const raw = decision.contentStrategyLabel?.trim();
  if (raw && STRATEGY_BY_LABEL[raw]) {
    return STRATEGY_BY_LABEL[raw]!.label;
  }
  if (raw) {
    return raw;
  }
  const style = decision.decisionStyle ?? decision.style;
  if (style && STYLE_FALLBACK[style]) {
    return STYLE_FALLBACK[style]!.label;
  }
  return 'Dengeli Plan';
}

export function getDecisionStrategyTone(
  decision: EventDecision,
): DecisionStrategyTone {
  const raw = decision.contentStrategyLabel?.trim();
  if (raw && STRATEGY_BY_LABEL[raw]) {
    return STRATEGY_BY_LABEL[raw]!.tone;
  }
  const style = decision.decisionStyle ?? decision.style;
  if (style && STYLE_FALLBACK[style]) {
    return STYLE_FALLBACK[style]!.tone;
  }
  return 'balanced';
}

export function getDecisionPriorityFit(
  decision: EventDecision,
  dailyPriorityKey?: DailyPriorityKey,
): DecisionPriorityFit | null {
  if (!dailyPriorityKey) return null;
  const hint = buildDecisionPriorityHint(decision, dailyPriorityKey);
  if (!hint) {
    const relation = getEventPriorityRelation(decision, dailyPriorityKey);
    if (relation === 'indirect') return 'indirect';
    if (relation === 'supports' || relation === 'social_relief' || relation === 'operational_gain') {
      return 'supports';
    }
    if (relation === 'risks') return 'risks';
    if (relation === 'resource_pressure') return 'resource_pressure';
    return 'neutral';
  }
  if (hint.includes('destekler')) return 'supports';
  if (hint.includes('riske')) return 'risks';
  if (hint.includes('Kaynak baskısı')) return 'resource_pressure';
  if (hint.includes('Dolaylı')) return 'indirect';
  if (hint.includes('Sosyal')) return 'supports';
  if (hint.includes('Operasyonel')) return 'supports';
  return 'neutral';
}

export function formatDecisionPriorityFitLabel(
  fit: DecisionPriorityFit | null,
): string | null {
  if (!fit || fit === 'neutral') return null;
  switch (fit) {
    case 'supports':
      return 'Önceliği destekler';
    case 'indirect':
      return 'Dolaylı katkı';
    case 'resource_pressure':
      return 'Kaynak baskısı';
    case 'risks':
      return 'Önceliği riske atar';
    default:
      return null;
  }
}

export function getDecisionRiskLevel(
  decision: EventDecision,
  input: {
    event: EventCard;
    dailyPriorityKey?: DailyPriorityKey;
    personnelPreview?: PersonnelImpactPreview | null;
    vehiclePreview?: VehicleImpactPreview | null;
    affordability?: DecisionAffordabilityCheck;
  },
): DecisionRiskLevel {
  let score = 0;
  const { personnelPreview, vehiclePreview, event, dailyPriorityKey, affordability } =
    input;

  if (personnelPreview?.riskLevel === 'high') score += 2;
  else if (personnelPreview?.riskLevel === 'medium') score += 1;
  if (vehiclePreview?.riskLevel === 'high') score += 2;
  else if (vehiclePreview?.riskLevel === 'medium') score += 1;
  if (personnelPreview?.mistakeRiskLevel === 'high') score += 2;

  const priorityFit = getDecisionPriorityFit(decision, dailyPriorityKey);
  if (priorityFit === 'risks') score += 2;
  if (priorityFit === 'resource_pressure') score += 1;

  const category = mapEventToContentCategory(event);
  const strategy = getDecisionStrategyTone(decision);
  if (
    (category === 'social_pressure' || event.eventType === 'social_media') &&
    (strategy === 'neutral' || strategy === 'resource')
  ) {
    score += 1;
  }

  if (affordability && affordability.cost > 0 && !affordability.canAfford) {
    score += 1;
  }

  const budgetCost = decision.costs?.budget ?? 0;
  if (budgetCost > 8000 && strategy === 'long_term') score += 1;

  if (score >= 4) return 'high';
  if (score >= 2) return 'caution';
  if (score === 0 && strategy === 'resource') return 'low';
  return 'balanced';
}

export function formatDecisionRiskLabel(level: DecisionRiskLevel): string {
  switch (level) {
    case 'low':
      return 'Düşük Risk';
    case 'caution':
      return 'Dikkat';
    case 'high':
      return 'Yüksek Risk';
    default:
      return 'Dengeli';
  }
}

export function buildDecisionShortTradeoff(
  decision: EventDecision,
  event: EventCard,
): string {
  const fromContent = decision.contentShortTradeoff?.trim();
  if (fromContent) {
    return truncateText(fromContent);
  }

  const style = decision.decisionStyle ?? decision.style;
  if (style && TRADEOFF_FALLBACK[style]) {
    return TRADEOFF_FALLBACK[style]!;
  }

  const strategyTone = getDecisionStrategyTone(decision);
  if (strategyTone === 'action') {
    return 'Hızlı rahatlama sağlar, ekip ve araç yükünü artırır.';
  }
  if (strategyTone === 'social') {
    return 'Sosyal baskıyı azaltır, saha etkisi sınırlı kalır.';
  }
  if (strategyTone === 'resource') {
    return 'Bütçeyi korur, sorun yarına sarkabilir.';
  }
  if (strategyTone === 'long_term') {
    return 'Kalıcı rahatlama sağlar, bugün bütçe baskısı yaratır.';
  }

  const category = mapEventToContentCategory(event);
  if (category === 'waste_container') {
    return 'Saha baskısını düşürür, kapasite ihtiyacı sürebilir.';
  }

  return truncateText(
    decision.contentRiskHint?.trim() ||
      'Operasyonu dengeler, kısa vadeli etki sınırlı olabilir.',
  );
}

function impactScoreTone(
  tone: 'good' | 'warning' | 'risk' | 'neutral',
): number {
  if (tone === 'risk') return 100;
  if (tone === 'warning') return 70;
  if (tone === 'good') return 40;
  return 20;
}

export function buildPrimaryDecisionImpacts(
  input: BuildPrimaryImpactsInput,
): PrimaryDecisionImpact[] {
  const impacts: PrimaryDecisionImpact[] = [];
  const { event, decision, dailyPriorityKey, personnelPreview, vehiclePreview, affordability } =
    input;

  if (personnelPreview?.decisionLine) {
    impacts.push({
      key: 'personnel',
      label: 'Personel',
      text: personnelPreview.decisionRiskLine
        ? personnelPreview.decisionRiskLine
        : personnelPreview.decisionLine,
      tone:
        personnelPreview.riskLevel === 'high' || personnelPreview.mistakeRiskLevel === 'high'
          ? 'risk'
          : personnelPreview.riskLevel === 'medium'
            ? 'warning'
            : 'neutral',
      iconName: 'people-outline',
      priority:
        impactScoreTone(
          personnelPreview.riskLevel === 'high' ? 'risk' : 'warning',
        ) + 10,
    });
  }

  if (vehiclePreview?.shouldShow && vehiclePreview.shortText) {
    impacts.push({
      key: 'vehicle',
      label: 'Araç',
      text: vehiclePreview.riskText ?? vehiclePreview.shortText,
      tone:
        vehiclePreview.riskLevel === 'high'
          ? 'risk'
          : vehiclePreview.riskLevel === 'medium'
            ? 'warning'
            : vehiclePreview.available
              ? 'neutral'
              : 'warning',
      iconName: 'car-outline',
      priority:
        impactScoreTone(
          vehiclePreview.riskLevel === 'high' ? 'risk' : 'warning',
        ) + 8,
    });
  }

  if (isContainerRelevantEvent(event)) {
    const containerTone =
      mapEventToContentCategory(event) === 'waste_container' ? 55 : 35;
    impacts.push({
      key: 'container',
      label: 'Konteyner',
      text:
        getDecisionStrategyTone(decision) === 'action'
          ? 'Doluluk baskısı kısa sürede azalır'
          : 'Kapasite baskısı sürer',
      tone: getDecisionStrategyTone(decision) === 'action' ? 'good' : 'warning',
      iconName: 'trash-outline',
      priority: containerTone,
    });
  }

  const socialCategory =
    mapEventToContentCategory(event) === 'social_pressure' ||
    event.eventType === 'social_media' ||
    event.eventType === 'citizen_complaint';
  if (socialCategory) {
    impacts.push({
      key: 'social',
      label: 'Sosyal',
      text:
        getDecisionStrategyTone(decision) === 'social'
          ? 'Şikayet baskısı azalır'
          : 'Görünürlük sınırlı kalabilir',
      tone: getDecisionStrategyTone(decision) === 'social' ? 'good' : 'warning',
      iconName: 'chatbubbles-outline',
      priority: 50,
    });
  }

  const budgetCost = decision.costs?.budget ?? 0;
  if (budgetCost > 0 || (decision.effects.budget ?? 0) !== 0) {
    impacts.push({
      key: 'budget',
      label: 'Kaynak',
      text:
        budgetCost > 0
          ? `Maliyet ${Math.round(budgetCost / 1000)}K`
          : decision.effects.budget > 0
            ? 'Bütçe artışı beklenir'
            : 'Bütçe korunur',
      tone:
        affordability && !affordability.canAfford
          ? 'risk'
          : budgetCost > 6000
            ? 'warning'
            : 'neutral',
      iconName: 'wallet-outline',
      priority:
        affordability && !affordability.canAfford ? 95 : budgetCost > 6000 ? 45 : 25,
    });
  }

  const priorityFit = getDecisionPriorityFit(decision, dailyPriorityKey);
  const priorityLabel = formatDecisionPriorityFitLabel(priorityFit);
  if (priorityLabel && dailyPriorityKey) {
    impacts.push({
      key: 'priority',
      label: 'Öncelik',
      text: priorityLabel,
      tone:
        priorityFit === 'risks' || priorityFit === 'resource_pressure'
          ? 'warning'
          : priorityFit === 'supports'
            ? 'good'
            : 'neutral',
      iconName: 'flag-outline',
      priority: priorityFit === 'risks' ? 80 : priorityFit === 'supports' ? 42 : 30,
    });
  }

  const category = mapEventToContentCategory(event);
  const preferred = CATEGORY_PRIMARY[category] ?? [];
  for (const key of preferred) {
    const found = impacts.find((i) => i.key === key);
    if (found) found.priority += 15;
  }

  impacts.sort((a, b) => b.priority - a.priority);
  return impacts;
}

export function buildCompactDecisionImpactSummary(
  impacts: PrimaryDecisionImpact[],
): string | null {
  if (impacts.length <= 2) return null;
  return `+${impacts.length - 2} etki daha`;
}

export type DecisionPrepLineInput = {
  fieldDutyLine?: string | null;
  routePreparationLine?: string | null;
  neighborhoodPatrolLine?: string | null;
};

export type DecisionPrepLineResult = {
  lines: string[];
  overflowLine?: string;
};

/** Karar kartında en fazla 2 hazırlık satırı — field > route > patrol. */
export function buildDecisionPrepLines(
  input: DecisionPrepLineInput,
): DecisionPrepLineResult {
  const ordered = [
    input.fieldDutyLine,
    input.routePreparationLine,
    input.neighborhoodPatrolLine,
  ].filter((line): line is string => typeof line === 'string' && line.length > 0);

  if (ordered.length <= 2) {
    return { lines: ordered };
  }

  return {
    lines: ordered.slice(0, 2),
    overflowLine: '+1 hazırlık etkisi',
  };
}

export function shouldShowDecisionDetailImpact(
  input: BuildPrimaryImpactsInput,
): boolean {
  if (input.affordability && !input.affordability.canAfford) {
    return false;
  }
  const personnel = input.personnelPreview;
  if (
    personnel?.decisionMistakeLine ||
    personnel?.competencyText ||
    personnel?.fieldDutyLine ||
    personnel?.neighborhoodPatrolLine ||
    input.vehiclePreview?.routePreparationLine
  ) {
    return true;
  }
  if (input.vehiclePreview?.riskText) {
    return true;
  }
  return false;
}

export function getUnavailableDecisionReason(
  affordability?: DecisionAffordabilityCheck,
): string | null {
  if (!affordability || affordability.canAfford) return null;
  return 'Kaynak yetersiz';
}

export type DecisionOptionCardVariant = 'full' | 'compact' | 'quick';

export type DecisionOptionVariantConfig = {
  maxPrimaryImpacts: number;
  maxTradeoffLines: number;
  showPriorityChip: boolean;
  showDetailImpact: boolean;
  titleMaxLines: number;
  compactPadding: boolean;
};

export function getDecisionOptionVariantConfig(
  variant: DecisionOptionCardVariant = 'full',
): DecisionOptionVariantConfig {
  switch (variant) {
    case 'quick':
      return {
        maxPrimaryImpacts: 1,
        maxTradeoffLines: 2,
        showPriorityChip: false,
        showDetailImpact: false,
        titleMaxLines: 2,
        compactPadding: true,
      };
    case 'compact':
      return {
        maxPrimaryImpacts: 1,
        maxTradeoffLines: 1,
        showPriorityChip: true,
        showDetailImpact: false,
        titleMaxLines: 2,
        compactPadding: true,
      };
    default:
      return {
        maxPrimaryImpacts: 2,
        maxTradeoffLines: 2,
        showPriorityChip: true,
        showDetailImpact: true,
        titleMaxLines: 2,
        compactPadding: false,
      };
  }
}

export function buildEventDetailHeaderChips(params: {
  event: EventCard;
  neighborhoodLabel?: string;
  dailyPriorityKey?: DailyPriorityKey;
  rhythmLabel?: string | null;
}): Array<{ key: string; label: string }> {
  const chips: Array<{ key: string; label: string }> = [];
  if (params.neighborhoodLabel?.trim()) {
    chips.push({ key: 'nh', label: params.neighborhoodLabel.trim() });
  }
  if (params.dailyPriorityKey) {
    chips.push({
      key: 'priority',
      label: getDailyPriorityChoice(params.dailyPriorityKey).shortTitle,
    });
  }
  if (params.rhythmLabel?.trim()) {
    chips.push({ key: 'rhythm', label: params.rhythmLabel.trim() });
  } else if (chips.length < 3) {
    const cat = mapEventToContentCategory(params.event);
    const catLabels: Record<string, string> = {
      waste_container: 'Atık',
      social_pressure: 'Sosyal',
      vehicle_route: 'Rota',
    };
    if (catLabels[cat]) {
      chips.push({ key: 'cat', label: catLabels[cat]! });
    }
  }
  return chips.slice(0, 3);
}
