import type { AuthorityPermissionPreviewState } from '@/core/authority/authorityPermissionPreviewTypes';
import { colors } from '@/ui/theme/colors';

export const AUTHORITY_PERMISSION_PREVIEW_THEME = {
  screenBg: '#F8F4EA',
  cardBg: '#FFFEFA',
  mintSoft: '#E8F8F5',
  gold: '#F4B51F',
  teal: '#1A8F8A',
  tealDark: '#07564F',
  textPrimary: '#202428',
  textSecondary: '#6F7478',
  border: 'rgba(20, 30, 30, 0.08)',
} as const;

export type AuthorityPermissionStateStyle = {
  pillBg: string;
  pillText: string;
  border: string;
};

export function resolveAuthorityPermissionStateStyle(
  state: AuthorityPermissionPreviewState,
): AuthorityPermissionStateStyle {
  switch (state) {
    case 'active':
      return {
        pillBg: colors.primaryMuted,
        pillText: colors.primary,
        border: 'rgba(26,143,138,0.22)',
      };
    case 'next':
      return {
        pillBg: colors.hubGoldMuted,
        pillText: colors.hubGoldDark,
        border: 'rgba(212,160,23,0.28)',
      };
    default:
      return {
        pillBg: colors.backgroundAlt,
        pillText: colors.textSecondary,
        border: AUTHORITY_PERMISSION_PREVIEW_THEME.border,
      };
  }
}
