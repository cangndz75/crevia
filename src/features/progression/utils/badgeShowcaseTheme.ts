import type { BadgeRarity } from '@/core/badges/badgeTypes';
import type { BadgeShowcaseState } from '@/core/badges/badgeShowcaseTypes';
import { colors } from '@/ui/theme/colors';

export const BADGE_SHOWCASE_THEME = {
  screenBg: '#041918',
  cardBg: 'rgba(8, 43, 39, 0.84)',
  mintSoft: 'rgba(64, 215, 176, 0.16)',
  gold: '#D6B45A',
  goldDark: '#9B741D',
  teal: '#40D7B0',
  tealDark: '#0C332F',
  textPrimary: '#F6F1DF',
  textSecondary: '#B7C8C2',
  border: 'rgba(110, 235, 200, 0.16)',
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
      return { pillBg: BADGE_SHOWCASE_THEME.mintSoft, pillText: BADGE_SHOWCASE_THEME.teal };
    case 'in_progress':
      return { pillBg: 'rgba(214, 180, 90, 0.18)', pillText: BADGE_SHOWCASE_THEME.gold };
    default:
      return { pillBg: 'rgba(255, 255, 255, 0.06)', pillText: BADGE_SHOWCASE_THEME.textSecondary };
  }
}
