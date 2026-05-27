import Ionicons from '@expo/vector-icons/Ionicons';

import { formatSourceDelta } from '@/core/economy/economyFormatter';
import {
  DecisionStyle,
  EventDecisionEffect,
  EventRiskLevel,
} from '@/core/models/EventCard';
import { colors } from '@/ui/theme/colors';

export function getCategoryIcon(
  category: string,
): keyof typeof Ionicons.glyphMap {
  const key = category.toLowerCase();
  if (key.includes('temizlik')) return 'trash-outline';
  if (key.includes('altyapı') || key.includes('altyapi')) {
    return 'construct-outline';
  }
  if (key.includes('iletişim') || key.includes('iletisim')) {
    return 'megaphone-outline';
  }
  return 'flash-outline';
}

export function getRiskLevelColor(level: EventRiskLevel): string {
  switch (level) {
    case 'low':
      return colors.success;
    case 'medium':
      return colors.warning;
    case 'high':
      return '#E07A35';
    case 'critical':
      return colors.critical;
    default:
      return colors.textSecondary;
  }
}

export function getRiskLevelMuted(level: EventRiskLevel): string {
  switch (level) {
    case 'low':
      return colors.successMuted;
    case 'medium':
      return colors.warningMuted;
    case 'high':
      return '#FFF0E6';
    case 'critical':
      return colors.criticalMuted;
    default:
      return colors.background;
  }
}

export function getDecisionStyleConfig(style: DecisionStyle) {
  const map = {
    bold: {
      accent: colors.primary,
      muted: colors.primaryMuted,
      icon: 'rocket-outline' as const,
      label: 'Cesur',
    },
    balanced: {
      accent: colors.secondary,
      muted: colors.secondaryMuted,
      icon: 'scale-outline' as const,
      label: 'Dengeli',
    },
    cautious: {
      accent: colors.purple,
      muted: colors.purpleMuted,
      icon: 'shield-outline' as const,
      label: 'Temkinli',
    },
    risky: {
      accent: colors.danger,
      muted: colors.dangerMuted,
      icon: 'flame-outline' as const,
      label: 'Riskli',
    },
  };
  return map[style];
}

export type EffectChipData = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tone: 'positive' | 'negative' | 'neutral' | 'xp';
};

export function buildEffectChips(
  effects: EventDecisionEffect,
): EffectChipData[] {
  const formatSigned = (n: number, suffix = '') => {
    const sign = n > 0 ? '+' : '';
    return `${sign}${n}${suffix}`;
  };

  return [
    {
      key: 'public',
      icon: 'happy-outline',
      label: 'Halk',
      value: formatSigned(effects.publicSatisfaction),
      tone:
        effects.publicSatisfaction > 0
          ? 'positive'
          : effects.publicSatisfaction < 0
            ? 'negative'
            : 'neutral',
    },
    {
      key: 'budget',
      icon: 'wallet-outline',
      label: 'Kaynak',
      value: formatCurrencyShort(effects.budget),
      tone:
        effects.budget > 0 ? 'positive' : effects.budget < 0 ? 'negative' : 'neutral',
    },
    {
      key: 'morale',
      icon: 'people-outline',
      label: 'Moral',
      value: formatSigned(effects.morale),
      tone:
        effects.morale > 0
          ? 'positive'
          : effects.morale < 0
            ? 'negative'
            : 'neutral',
    },
    {
      key: 'risk',
      icon: 'alert-circle-outline',
      label: 'Risk',
      value: formatSigned(effects.risk),
      tone:
        effects.risk < 0
          ? 'positive'
          : effects.risk > 0
            ? 'negative'
            : 'neutral',
    },
    {
      key: 'xp',
      icon: 'star',
      label: 'XP',
      value: `+${effects.xp}`,
      tone: 'xp',
    },
  ];
}

function formatCurrencyShort(amount: number) {
  return formatSourceDelta(amount);
}
