import type {
  EventAdvisorNote,
  EventCard,
  EventDecision,
  EventDecisionEffect,
  PilotDecisionStyle,
} from '@/core/models/EventCard';
import type { GameChipTone } from '@/ui/components/GameChip';

import { getDecisionResultMessage } from '@/features/events/utils/decisionPresentation';

export type MetricEffectRow = {
  key: string;
  label: string;
  value: string;
  tone: 'positive' | 'negative' | 'neutral' | 'xp';
};

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
