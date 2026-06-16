/** Merkez alt dashboard — paylaşılan renk ve layout sabitleri. */

export const CENTER_LOWER_TWO_COLUMN_BREAKPOINT = 380;

export const centerLowerPalette = {
  tealDeep: '#053E39',
  tealPanel: '#07564F',
  tealBright: '#21BFA8',
  mint: '#9DF2D2',
  cream: '#FFFCF5',
  creamSoft: '#F8F0DF',
  gold: '#D8A72E',
  goldSoft: '#F5E3AF',
  purpleDeep: '#2A1749',
  purple: '#5B2B7A',
  violet: '#8261D8',
  plum: '#3D1F59',
  textLight: '#F5FFF9',
  mutedLight: 'rgba(245,255,249,0.72)',
  mutedDark: '#65716B',
  borderGold: 'rgba(245,227,175,0.26)',
  borderTeal: 'rgba(157,242,210,0.20)',
  shadow: '#043A36',
} as const;

export const centerLowerPanelShadow = {
  shadowColor: centerLowerPalette.shadow,
  shadowOpacity: 0.14,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 9 },
  elevation: 4,
} as const;
