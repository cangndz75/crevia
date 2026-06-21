import type { AuthorityPermissionPreviewState } from '@/core/authority/authorityPermissionPreviewTypes';
import type { AuthorityPermissionDisplayState } from '@/features/progression/utils/authorityPermissionsTabPresentation';
import { colors } from '@/ui/theme/colors';
import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

export const AUTHORITY_PERMISSION_PREVIEW_THEME = {
  screenBg: '#F8F9F5',
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

export type AuthorityPermissionDisplayStyle = AuthorityPermissionStateStyle & {
  icon: ComponentProps<typeof Ionicons>['name'];
  cardOpacity: number;
};

export function resolveAuthorityPermissionDisplayStyle(
  state: AuthorityPermissionDisplayState,
): AuthorityPermissionDisplayStyle {
  switch (state) {
    case 'open':
      return {
        pillBg: '#E6F4F1',
        pillText: '#1A8F8A',
        border: 'rgba(26,143,138,0.22)',
        icon: 'checkmark-circle',
        cardOpacity: 1,
      };
    case 'ready':
      return {
        pillBg: '#FFF3E0',
        pillText: '#E65100',
        border: 'rgba(230,81,0,0.22)',
        icon: 'star',
        cardOpacity: 1,
      };
    case 'next':
      return {
        pillBg: '#E3F2FD',
        pillText: '#1565C0',
        border: 'rgba(33,150,243,0.22)',
        icon: 'time-outline',
        cardOpacity: 1,
      };
    default:
      return {
        pillBg: '#F0F2F0',
        pillText: '#8A9094',
        border: AUTHORITY_PERMISSION_PREVIEW_THEME.border,
        icon: 'lock-closed',
        cardOpacity: 0.72,
      };
  }
}

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
