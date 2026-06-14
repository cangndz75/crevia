/**
 * Final UI visual unification tokens — premium light mobile game language.
 * Bind shared surfaces to src/ui/theme/* instead of ad-hoc hex values.
 */

import { colors } from './colors';
import { radius } from './radius';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { typography } from './typography';

export const gameUi = {
  colors: {
    backgroundCream: '#F8F1E4',
    cardWhite: '#FFFCF5',
    cardMintTint: '#EAF5EE',
    cardWarmTint: '#FFF6E6',
    primaryTeal: '#07564F',
    primaryTealMid: '#0D7168',
    primaryTealDark: '#043A36',
    mintPositive: '#3E9E6A',
    amberCaution: '#C78925',
    goldAccent: '#D8A72E',
    goldLight: '#FFE5A2',
    textPrimary: '#173D3A',
    textMuted: '#68746E',
    borderSoft: 'rgba(7, 86, 79, 0.10)',
    white: '#FFFFFF',
    navActive: colors.hubGold,
    navInactive: '#B8A06A',
  },
  radius: {
    badge: radius.sm,
    chip: 10,
    card: radius.lg,
    cardHero: radius.xl,
    heroContainer: radius.xxl,
    cta: radius.full,
  },
  shadow: {
    card: shadows.card,
    soft: shadows.soft,
    hero: {
      shadowColor: '#043A36',
      shadowOpacity: 0.1,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
    navActiveGlow: {
      shadowColor: '#D8A72E',
      shadowOpacity: 0.28,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
  },
  typography: {
    screenTitle: { ...typography.title, color: '#07564F', fontSize: 20 },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '900' as const,
      letterSpacing: 0.7,
      color: '#07564F',
    },
    cardTitle: { fontSize: 15, fontWeight: '900' as const, color: '#173D3A' },
    body: { fontSize: 11, fontWeight: '700' as const, lineHeight: 15, color: '#68746E' },
    microLabel: {
      fontSize: 9,
      fontWeight: '900' as const,
      letterSpacing: 0.4,
      color: '#68746E',
    },
    badgeLabel: { fontSize: 9, fontWeight: '900' as const, color: '#07564F' },
  },
  spacing: {
    screenHorizontal: spacing.lg,
    cardGap: spacing.md,
    sectionGap: spacing.lg,
    denseListGap: spacing.sm,
    ctaHeight: 44,
    minTouch: 44,
  },
  motion: {
    subtlePulse: true,
    reducedMotionStatic: true,
  },
} as const;

export type GameUiColorToken = keyof typeof gameUi.colors;
