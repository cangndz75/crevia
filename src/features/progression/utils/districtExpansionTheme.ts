import type { DistrictUnlockBindingState } from '@/core/progression/districtOperationUnlockBindingTypes';
import { colors } from '@/ui/theme/colors';

export const DISTRICT_EXPANSION_THEME = {
  cardBg: '#FFFEFA',
  textPrimary: '#202428',
  textSecondary: '#6F7478',
  border: 'rgba(20, 30, 30, 0.08)',
  tealDark: '#07564F',
  mintSoft: '#E8F8F5',
} as const;

export function resolveDistrictExpansionStateStyle(state: DistrictUnlockBindingState) {
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
        border: DISTRICT_EXPANSION_THEME.border,
      };
  }
}
