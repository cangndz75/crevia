import type { AuthorityTheme } from '@/features/progression/content/authoritiesDisplay';
import { colors } from '@/ui/theme/colors';

export const AUTHORITY_THEME = {
  teal: {
    main: colors.primary,
    muted: colors.primaryMuted,
    pillBg: colors.primaryMuted,
    pillText: colors.primary,
    hex: ['#2BB5AE', '#1A8F8A'] as const,
    glow: 'rgba(26,143,138,0.22)',
  },
  purple: {
    main: colors.authority,
    muted: colors.authorityMuted,
    pillBg: colors.authorityMuted,
    pillText: colors.authority,
    hex: ['#9B7FD4', '#7B5BB8'] as const,
    glow: 'rgba(123,91,184,0.22)',
  },
  gold: {
    main: colors.hubGoldDark,
    muted: colors.hubGoldMuted,
    pillBg: colors.hubGoldMuted,
    pillText: colors.hubGoldDark,
    hex: ['#F5C84A', '#D4A017'] as const,
    glow: 'rgba(212,160,23,0.22)',
  },
} as const satisfies Record<
  AuthorityTheme,
  {
    main: string;
    muted: string;
    pillBg: string;
    pillText: string;
    hex: readonly [string, string];
    glow: string;
  }
>;
