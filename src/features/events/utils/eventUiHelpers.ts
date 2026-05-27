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
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  if (abs >= 1000) {
    return `${sign}₺${Math.round(abs / 1000)}K`;
  }
  return `${sign}₺${abs.toLocaleString('tr-TR')}`;
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
