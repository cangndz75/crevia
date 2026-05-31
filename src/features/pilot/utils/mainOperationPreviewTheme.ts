import { Platform, type ViewStyle } from 'react-native';

export const MAIN_OP_PREVIEW_COLORS = {
  bg: '#FFFDF6',
  card: '#FFFDF9',
  cream: '#F7F1E6',
  tealDark: '#075E57',
  teal: '#0F8F86',
  mint: '#DDF4EC',
  gold: '#C99A24',
  goldSoft: '#F7E7B8',
  blue: '#3B73D9',
  blueSoft: '#EAF2FF',
  purpleSoft: '#F5F0FF',
  text: '#17212B',
  muted: '#68717D',
  border: '#E8DECA',
  divider: '#ECE6D8',
  title: '#1E293B',
  heroTitle: '#5B3D17',
  heroBody: '#6B7280',
} as const;

export const MAIN_OP_PREVIEW_RADIUS = {
  small: 12,
  card: 20,
  hero: 22,
  chip: 999,
} as const;

export const cardShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  android: { elevation: 3 },
  default: {},
}) ?? {};
