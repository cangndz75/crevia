import type { DistrictUnlockBindingState } from '@/core/progression/districtOperationUnlockBindingTypes';

export const DISTRICT_EXPANSION_THEME = {
  cardBg: 'rgba(8, 43, 39, 0.84)',
  textPrimary: '#F6F1DF',
  textSecondary: '#B7C8C2',
  border: 'rgba(110, 235, 200, 0.16)',
  tealDark: '#40D7B0',
  mintSoft: 'rgba(64, 215, 176, 0.16)',
} as const;

export function resolveDistrictExpansionStateStyle(state: DistrictUnlockBindingState) {
  switch (state) {
    case 'active':
      return {
        pillBg: DISTRICT_EXPANSION_THEME.mintSoft,
        pillText: DISTRICT_EXPANSION_THEME.tealDark,
        border: 'rgba(64, 215, 176, 0.28)',
      };
    case 'next':
      return {
        pillBg: 'rgba(214, 180, 90, 0.18)',
        pillText: '#D6B45A',
        border: 'rgba(214, 180, 90, 0.30)',
      };
    default:
      return {
        pillBg: 'rgba(255, 255, 255, 0.06)',
        pillText: DISTRICT_EXPANSION_THEME.textSecondary,
        border: DISTRICT_EXPANSION_THEME.border,
      };
  }
}
