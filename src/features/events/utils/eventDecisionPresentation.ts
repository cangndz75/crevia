import type {
  EventAdvisorNote,
  EventCard,
  EventDecision,
  EventDecisionCost,
  EventDecisionEffect,
  EventFilterTag,
  PilotDecisionStyle,
} from '@/core/models/EventCard';
import type { GameChipTone } from '@/ui/components/GameChip';
import { getActiveDistrictBonusLabels } from '@/core/xp/districtBonusLabels';
import type { DistrictBonusFlags } from '@/core/xp/types';

import { getDecisionResultMessage } from '@/features/events/utils/decisionPresentation';

export type MetricEffectRow = {
  key: string;
  label: string;
  value: string;
  tone: 'positive' | 'negative' | 'neutral' | 'xp';
};

export type DecisionEffectPill = {
  key: string;
  label: string;
  tone: 'positive' | 'negative' | 'neutral' | 'gold' | 'teal';
};

const DISTRICT_EVENT_TYPE_LABELS: Record<string, string> = {
  waste_overflow: 'Atık taşması',
  delayed_collection: 'Gecikmiş toplama',
  sidewalk_blocked: 'Kaldırım',
  market_crowding: 'Pazar yoğunluğu',
  vehicle_breakdown_risk: 'Araç riski',
  noise_complaint: 'Gürültü şikayeti',
  social_media_complaint: 'Sosyal medya',
  park_cleanliness: 'Park temizliği',
  route_delay: 'Rota gecikmesi',
  staff_fatigue_pressure: 'Ekip yorgunluğu',
  public_trust_drop: 'Güven kaybı',
};

const FILTER_TAG_LABELS: Record<EventFilterTag, string> = {
  urgent: 'Acil',
  crisis: 'Kriz',
  opportunity: 'Fırsat',
};

function formatEffectDelta(value: number, suffix: string): string {
  const sign = value > 0 ? '+' : '';
  const abs = Math.abs(value);
  const formatted =
    abs > 0 && abs <= 1.5 ? abs.toFixed(1) : String(Math.round(abs));
  return `${sign}${formatted} ${suffix}`;
}

function formatBudgetAmount(amount: number): string {
  return `₺${Math.abs(amount).toLocaleString('tr-TR')}`;
}

export function getDistrictEventTypeLabel(
  districtEventType?: string,
): string | null {
  if (!districtEventType?.trim()) {
    return null;
  }
  return (
    DISTRICT_EVENT_TYPE_LABELS[districtEventType] ??
    districtEventType.replace(/_/g, ' ')
  );
}

export function getEventContextTags(event: EventCard): string[] {
  const tags: string[] = [];
  if (event.contextTag?.trim()) {
    tags.push(event.contextTag.trim());
  }
  const districtTypeLabel = getDistrictEventTypeLabel(event.districtEventType);
  if (districtTypeLabel) {
    tags.push(districtTypeLabel);
  }
  for (const tag of event.filterTags ?? []) {
    const label = FILTER_TAG_LABELS[tag];
    if (label && !tags.includes(label)) {
      tags.push(label);
    }
  }
  return tags;
}

export function buildDecisionEffectPills(
  effects: EventDecisionEffect,
  costs?: EventDecisionCost,
): DecisionEffectPill[] {
  const pills: DecisionEffectPill[] = [];

  if (effects.publicSatisfaction !== 0) {
    pills.push({
      key: 'sat',
      label: formatEffectDelta(effects.publicSatisfaction, 'Halk'),
      tone: effects.publicSatisfaction > 0 ? 'positive' : 'negative',
    });
  }

  if (effects.risk !== 0) {
    pills.push({
      key: 'risk',
      label: formatEffectDelta(effects.risk, 'Risk'),
      tone: effects.risk < 0 ? 'positive' : 'negative',
    });
  }

  const budgetSpend =
    (costs?.budget ?? 0) > 0
      ? costs!.budget!
      : effects.budget < 0
        ? Math.abs(effects.budget)
        : 0;
  if (budgetSpend > 0) {
    pills.push({
      key: 'budget',
      label: formatBudgetAmount(budgetSpend),
      tone: 'neutral',
    });
  }

  const staffHours = costs?.staffHours;
  if (staffHours != null && staffHours > 0) {
    const fatigue = Math.ceil(staffHours / 4);
    pills.push({
      key: 'fatigue',
      label: `+${fatigue} Yorgunluk`,
      tone: 'negative',
    });
  } else {
    const moraleDelta = effects.morale ?? effects.staffMorale ?? 0;
    if (moraleDelta !== 0) {
      pills.push({
        key: 'morale',
        label: formatEffectDelta(moraleDelta, 'Moral'),
        tone: moraleDelta > 0 ? 'positive' : 'negative',
      });
    }
  }

  if (costs?.vehicleUsage != null && costs.vehicleUsage > 0) {
    pills.push({
      key: 'vehicle',
      label: `${costs.vehicleUsage} Araç`,
      tone: 'teal',
    });
  }

  if (effects.trust != null && effects.trust !== 0) {
    pills.push({
      key: 'trust',
      label: formatEffectDelta(effects.trust, 'Güven'),
      tone: effects.trust > 0 ? 'positive' : 'negative',
    });
  }

  if (effects.cleanliness != null && effects.cleanliness !== 0) {
    pills.push({
      key: 'clean',
      label: formatEffectDelta(effects.cleanliness, 'Temizlik'),
      tone: effects.cleanliness > 0 ? 'positive' : 'negative',
    });
  }

  return pills;
}

export function buildBonusPotentialPills(
  flags?: DistrictBonusFlags,
): DecisionEffectPill[] {
  return getActiveDistrictBonusLabels(flags).map((label, index) => ({
    key: `bonus-${index}`,
    label,
    tone: 'gold' as const,
  }));
}

const DECISION_STYLE_LABELS: Record<PilotDecisionStyle, string> = {
  fast: 'Hızlı Müdahale',
  planned: 'Planlı Çözüm',
  partial: 'Kısmi Müdahale',
  communication: 'İletişim',
  permanent: 'Kalıcı Çözüm',
  resource_saving: 'Kaynak Koruma',
  risk: 'Riskli Tercih',
};

type EventFieldNoteSource = EventCard & {
  characterMessage?: string;
  characterName?: string;
  advisorNote?: string;
};

export type EventFieldNote = {
  title: string;
  body: string;
  attribution?: string;
};

function formatSigned(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}`;
}

function formatBudget(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}₺${Math.abs(value).toLocaleString('tr-TR')}`;
}

export function getDecisionStyleLabel(
  decisionStyle?: PilotDecisionStyle,
): string | null {
  if (!decisionStyle) {
    return null;
  }
  return DECISION_STYLE_LABELS[decisionStyle] ?? 'Karar';
}

export function getDecisionStyleChipTone(
  decisionStyle: PilotDecisionStyle,
): GameChipTone {
  switch (decisionStyle) {
    case 'fast':
      return 'info';
    case 'planned':
      return 'purple';
    case 'partial':
      return 'neutral';
    case 'communication':
      return 'success';
    case 'permanent':
      return 'success';
    case 'resource_saving':
      return 'warning';
    case 'risk':
      return 'danger';
    default: {
      const _exhaustive: never = decisionStyle;
      return _exhaustive;
    }
  }
}

export function getDecisionResultTitle(decision: EventDecision): string {
  if (decision.resultText?.trim()) {
    return decision.resultText.trim();
  }
  return 'Karar Uygulandı';
}

export function getDecisionResultDescription(decision: EventDecision): string {
  if (decision.resultText?.trim()) {
    const description = decision.description?.trim();
    if (description) {
      return description;
    }
    return getDecisionResultMessage(decision);
  }

  const fallback = getDecisionResultMessage(decision);
  if (fallback) {
    return fallback;
  }

  return decision.description?.trim() || 'Karar kaydedildi ve etkiler uygulandı.';
}

export function getMetricLabel(metricKey: string): string {
  const labels: Record<string, string> = {
    publicSatisfaction: 'Halk Memnuniyeti',
    budget: 'Bütçe',
    morale: 'Personel Morali',
    staffMorale: 'Personel Morali',
    risk: 'Operasyon Riski',
    riskScore: 'Operasyon Riski',
    operationRisk: 'Operasyon Riski',
    trust: 'Mahalle Güveni',
    districtTrust: 'Mahalle Güveni',
    cleanliness: 'Temizlik',
    staffFatigue: 'Personel Yorgunluğu',
    xp: 'Deneyim (XP)',
  };
  return labels[metricKey] ?? metricKey;
}

function pushRow(
  rows: MetricEffectRow[],
  key: string,
  label: string,
  rawValue: number | undefined,
  format: (n: number) => string,
  toneForValue: (n: number) => MetricEffectRow['tone'],
): void {
  if (rawValue == null || rawValue === 0) {
    return;
  }
  rows.push({
    key,
    label,
    value: format(rawValue),
    tone: toneForValue(rawValue),
  });
}

export function getMetricEffectRows(
  effects: EventDecisionEffect,
): MetricEffectRow[] {
  const rows: MetricEffectRow[] = [];

  pushRow(
    rows,
    'publicSatisfaction',
    getMetricLabel('publicSatisfaction'),
    effects.publicSatisfaction,
    formatSigned,
    (n) => (n > 0 ? 'positive' : n < 0 ? 'negative' : 'neutral'),
  );

  pushRow(
    rows,
    'budget',
    getMetricLabel('budget'),
    effects.budget,
    formatBudget,
    (n) => (n > 0 ? 'positive' : n < 0 ? 'negative' : 'neutral'),
  );

  const moraleValue = effects.staffMorale ?? effects.morale;
  pushRow(
    rows,
    'morale',
    getMetricLabel('morale'),
    moraleValue,
    formatSigned,
    (n) => (n > 0 ? 'positive' : n < 0 ? 'negative' : 'neutral'),
  );

  pushRow(
    rows,
    'risk',
    getMetricLabel('risk'),
    effects.risk,
    formatSigned,
    (n) => (n > 0 ? 'negative' : n < 0 ? 'positive' : 'neutral'),
  );

  pushRow(
    rows,
    'trust',
    getMetricLabel('trust'),
    effects.trust,
    formatSigned,
    (n) => (n > 0 ? 'positive' : n < 0 ? 'negative' : 'neutral'),
  );

  pushRow(
    rows,
    'cleanliness',
    getMetricLabel('cleanliness'),
    effects.cleanliness,
    formatSigned,
    (n) => (n > 0 ? 'positive' : n < 0 ? 'negative' : 'neutral'),
  );

  pushRow(
    rows,
    'xp',
    getMetricLabel('xp'),
    effects.xp,
    (n) => `+${n}`,
    () => 'xp',
  );

  return rows;
}

export function hasButterflyHint(decision: EventDecision): boolean {
  if (!decision.setFlags) {
    return false;
  }
  return Object.keys(decision.setFlags).length > 0;
}

export function getButterflyHintBody(decision: EventDecision): string {
  if (decision.setFlags?.day1ResponseStyle != null) {
    return 'Bu ilk müdahale tercihi ilerleyen günlerde tekrar karşına çıkabilir.';
  }
  return 'Bugünkü tercihin ilerleyen günlerde yeni bir olayın tonunu değiştirebilir.';
}

export function getFieldNoteForEvent(
  event: EventCard,
  eventAdvisor: EventAdvisorNote,
): EventFieldNote | null {
  const source = event as EventFieldNoteSource;

  if (source.characterMessage?.trim()) {
    return {
      title: source.characterName?.trim()
        ? `Saha Notu — ${source.characterName.trim()}`
        : 'Saha Notu',
      body: source.characterMessage.trim(),
    };
  }

  if (source.advisorNote?.trim()) {
    return {
      title: 'Danışman Yorumu',
      body: source.advisorNote.trim(),
    };
  }

  if (eventAdvisor.body?.trim()) {
    return {
      title: 'Danışman Yorumu',
      body: eventAdvisor.body.trim(),
      attribution: eventAdvisor.attribution?.trim() || undefined,
    };
  }

  return null;
}
