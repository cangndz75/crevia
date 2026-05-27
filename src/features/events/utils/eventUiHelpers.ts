import { formatSourceDelta } from '@/core/economy/economyFormatter';
import type {
  EventCard,
  EventDecision,
  EventDecisionEffect,
  EventPreviewEffects,
} from '@/core/models/EventCard';

export type EventVisualType =
  | 'odor_complaint'
  | 'waste'
  | 'traffic'
  | 'maintenance'
  | 'opportunity'
  | 'default';

export type CompactEffectChip = {
  key: string;
  label: string;
  tone: 'positive' | 'negative' | 'neutral' | 'xp' | 'risk' | 'budget';
};

export function deriveVisualType(event: EventCard): EventVisualType {
  const haystack = `${event.title} ${event.category} ${event.contextTag}`.toLowerCase();
  if (haystack.includes('koku') || haystack.includes('şikayet')) {
    return 'odor_complaint';
  }
  if (
    haystack.includes('çöp') ||
    haystack.includes('temizlik') ||
    haystack.includes('kirlilik')
  ) {
    return 'waste';
  }
  if (haystack.includes('rota') || haystack.includes('trafik')) {
    return 'traffic';
  }
  if (haystack.includes('fırsat') || event.filterTags?.includes('opportunity')) {
    return 'opportunity';
  }
  if (haystack.includes('bakım') || haystack.includes('altyapı')) {
    return 'maintenance';
  }
  return 'default';
}

export function deriveRiskFocusLine(event: EventCard | null): string {
  if (!event) return 'Operasyon normal';
  const title = event.title.toLowerCase();
  if (title.includes('koku')) return 'Risk odağı: koku şikayeti';
  if (title.includes('rota') || title.includes('gecikme')) {
    return 'Risk odağı: rota gecikmesi';
  }
  if (title.includes('pazar') || title.includes('kirlilik')) {
    return 'Risk odağı: alan kirliliği';
  }
  if (title.includes('su')) return 'Risk odağı: altyapı baskısı';
  return `Risk odağı: ${event.contextTag.toLowerCase()}`;
}

export function deriveContextTags(event: EventCard): string[] {
  const tags = [event.district, event.contextTag];
  const title = event.title.toLowerCase();
  if (title.includes('koku') || title.includes('şikayet')) {
    tags.push('Şikayet sinyali');
  }
  if (title.includes('sosyal') || event.description.includes('sosyal')) {
    tags.push('Sosyal baskı riski');
  }
  if (event.day != null) {
    tags.push('Pilot Operasyon');
  }
  return [...new Set(tags.filter(Boolean))].slice(0, 4);
}

function formatBudgetShort(amount: number): string {
  return formatSourceDelta(amount);
}

export type PremiumEffectChip = CompactEffectChip & {
  friendlyLabel: string;
};

function friendlyPublicLabel(value: number): string {
  return `Halk Memnuniyeti ${value > 0 ? '+' : ''}${value}`;
}

function friendlyHygieneLabel(value: number): string {
  return `Hijyen ${value > 0 ? '+' : ''}${Math.abs(value)}`;
}

/** Öncelikli kart — referans etiketleri (Halk Memnuniyeti, Hijyen vb.). */
export function buildPremiumPreviewChips(
  effects: EventDecisionEffect | EventPreviewEffects,
  max = 3,
  event?: EventCard,
): PremiumEffectChip[] {
  const base = buildCompactEffectChips(effects, max);
  const chips = base.map((chip) => {
    let friendlyLabel = chip.label;
    if (chip.key === 'public') {
      const v = (effects as EventPreviewEffects).publicSatisfaction;
      friendlyLabel = friendlyPublicLabel(v);
    } else if (chip.key === 'risk' && (effects as EventPreviewEffects).risk < 0) {
      friendlyLabel = 'Sosyal Baskı Azalır';
    } else if (chip.key === 'budget') {
      const v = (effects as EventPreviewEffects).budget ?? 0;
      friendlyLabel =
        v >= 0 ? `Kaynak +${formatSourceDelta(v).replace('+', '')}` : formatSourceDelta(v);
    } else if (chip.key === 'xp') {
      friendlyLabel = `Deneyim +${(effects as EventPreviewEffects).xp}`;
    }
    return { ...chip, friendlyLabel };
  });

  const e = effects as EventDecisionEffect;
  if (
    chips.length < max &&
    e.cleanliness != null &&
    e.cleanliness !== 0 &&
    !chips.some((c) => c.key === 'hygiene')
  ) {
    chips.push({
      key: 'hygiene',
      label: `${e.cleanliness > 0 ? '+' : ''}${e.cleanliness}`,
      friendlyLabel: friendlyHygieneLabel(e.cleanliness),
      tone: e.cleanliness > 0 ? 'positive' : 'negative',
    });
  } else if (event && chips.length < max) {
    const haystack = `${event.category} ${event.title}`.toLowerCase();
    if (
      (haystack.includes('temiz') ||
        haystack.includes('hijyen') ||
        haystack.includes('çöp')) &&
      !chips.some((c) => c.key === 'hygiene')
    ) {
      const hygieneVal = Math.max(
        6,
        Math.round(Math.abs(effects.publicSatisfaction) || 8),
      );
      chips.push({
        key: 'hygiene',
        label: `+${hygieneVal}`,
        friendlyLabel: friendlyHygieneLabel(hygieneVal),
        tone: 'positive',
      });
    }
  }

  return chips.slice(0, max);
}

/** Görsel tutarlılık için olaydan türetilmiş etkilenen kişi sayısı. */
export function deriveAffectedPopulation(event: EventCard): string {
  let hash = 0;
  for (let i = 0; i < event.id.length; i += 1) {
    hash = (hash + event.id.charCodeAt(i) * 17) % 1000;
  }
  const base =
    event.riskLevel === 'critical'
      ? 2800
      : event.riskLevel === 'high'
        ? 2200
        : event.riskLevel === 'medium'
          ? 1400
          : 800;
  const total = base + hash * 3 + event.urgencyHours * 40;
  if (total >= 1000) {
    return `${(total / 1000).toFixed(1).replace('.0', '')}K`;
  }
  return String(total);
}

export type EventAccentKind = 'critical' | 'urgent' | 'opportunity' | 'resolved' | 'default';

export function getEventAccentKind(event: EventCard): EventAccentKind {
  if (event.filterTags?.includes('opportunity')) return 'opportunity';
  if (event.riskLevel === 'critical' || event.riskLevel === 'high') return 'critical';
  if (event.urgencyHours <= 6 || event.filterTags?.includes('urgent')) return 'urgent';
  return 'default';
}

export function buildCompactEffectChips(
  effects: EventDecisionEffect | EventPreviewEffects,
  max = 4,
): CompactEffectChip[] {
  const chips: CompactEffectChip[] = [];
  const e = effects as EventDecisionEffect;

  if ('publicSatisfaction' in effects && effects.publicSatisfaction !== 0) {
    const v = effects.publicSatisfaction;
    chips.push({
      key: 'public',
      label: `${v > 0 ? '+' : ''}${v} Halk`,
      tone: v > 0 ? 'positive' : 'negative',
    });
  }

  if ('budget' in effects && effects.budget != null && effects.budget !== 0) {
    chips.push({
      key: 'budget',
      label: formatBudgetShort(effects.budget),
      tone: effects.budget > 0 ? 'positive' : 'budget',
    });
  }

  if ('risk' in effects && effects.risk !== 0) {
    const v = effects.risk;
    chips.push({
      key: 'risk',
      label: `${v > 0 ? '+' : ''}${v} Risk`,
      tone: v > 0 ? 'risk' : 'positive',
    });
  }

  if ('xp' in effects && effects.xp > 0) {
    chips.push({
      key: 'xp',
      label: `+${effects.xp} XP`,
      tone: 'xp',
    });
  }

  if ('morale' in e && e.morale != null && e.morale !== 0) {
    const v = e.morale;
    chips.push({
      key: 'morale',
      label: `${v > 0 ? '+' : ''}${v} Moral`,
      tone: v > 0 ? 'positive' : 'negative',
    });
  }

  return chips.slice(0, max);
}

export function buildDecisionEffectChips(decision: EventDecision): CompactEffectChip[] {
  return buildCompactEffectChips(decision.effects, 3);
}
