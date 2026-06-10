import type { BadgeRarity } from '@/core/badges/badgeTypes';
import type { BadgeShowcaseState } from '@/core/badges/badgeShowcaseTypes';
import { colors } from '@/ui/theme/colors';

export const BADGE_SHOWCASE_THEME = {
  screenBg: '#F8F4EA',
  cardBg: '#FFFEFA',
  mintSoft: '#E8F8F5',
  gold: '#F4B51F',
  goldDark: '#E7A90E',
  teal: '#1A8F8A',
  tealDark: '#07564F',
  textPrimary: '#202428',
  textSecondary: '#6F7478',
  border: 'rgba(20, 30, 30, 0.08)',
} as const;

export type BadgeShowcaseRarityStyle = {
  glow: string;
  border: string;
  iconBg: string;
  iconColor: string;
};

export type BadgeShowcaseStateStyle = {
  pillBg: string;
  pillText: string;
};

export function resolveBadgeShowcaseRarityStyle(
  rarity: BadgeRarity,
  state: BadgeShowcaseState,
): BadgeShowcaseRarityStyle {
  if (state !== 'earned') {
    return {
      glow: 'transparent',
      border: BADGE_SHOWCASE_THEME.border,
      iconBg: colors.backgroundAlt,
      iconColor: colors.textSecondary,
    };
  }

  switch (rarity) {
    case 'uncommon':
      return {
        glow: 'rgba(26,143,138,0.12)',
        border: 'rgba(26,143,138,0.22)',
        iconBg: colors.primaryMuted,
        iconColor: colors.primary,
      };
    case 'rare':
      return {
        glow: 'rgba(245,183,49,0.16)',
        border: 'rgba(212,160,23,0.28)',
        iconBg: colors.hubGoldMuted,
        iconColor: colors.hubGoldDark,
      };
    case 'epic':
      return {
        glow: 'rgba(123,91,184,0.14)',
        border: 'rgba(123,91,184,0.24)',
        iconBg: colors.purpleMuted,
        iconColor: colors.purple,
      };
    default:
      return {
        glow: 'rgba(26,143,138,0.08)',
        border: BADGE_SHOWCASE_THEME.border,
        iconBg: colors.surface,
        iconColor: colors.textPrimary,
      };
  }
}

export function resolveBadgeShowcaseStateStyle(state: BadgeShowcaseState): BadgeShowcaseStateStyle {
  switch (state) {
    case 'earned':
      return { pillBg: colors.primaryMuted, pillText: colors.primary };
    case 'in_progress':
      return { pillBg: colors.hubGoldMuted, pillText: colors.hubGoldDark };
    default:
      return { pillBg: colors.backgroundAlt, pillText: colors.textSecondary };
  }
}
