import type { ImageSource } from 'expo-image';

/** Merkez premium light-theme yerel stil tokenları */
export const HUB_PREMIUM_COLORS = {
  tealDark: '#075E57',
  teal: '#0F8F86',
  tealCta: '#0F766E',
  tealCtaDark: '#0B5F59',
  mint: '#BDEFE7',
  cream: '#F7F1E6',
  card: '#FFFDF7',
  cardWarm: '#FFFDF6',
  cardGold: '#FFF9EA',
  gold: '#D8B44A',
  goldSoft: '#F6E7B6',
  textDark: '#1D2939',
  textMuted: '#667085',
  borderSoft: '#E9E2D2',
  borderGold: 'rgba(216, 180, 74, 0.35)',
  chipBg: 'rgba(255,255,255,0.18)',
  chipBorder: 'rgba(255,255,255,0.25)',
  creamText: '#F7F1E6',
  mintText: 'rgba(189, 239, 231, 0.88)',
} as const;

export const HUB_PREMIUM_RADIUS = {
  card: 22,
  cardLg: 24,
  goal: 20,
  quick: 20,
  pill: 999,
  icon: 14,
  headerBottom: 30,
} as const;

export const HUB_PREMIUM_LAYOUT = {
  /** İçerik satırı hedefi — safe area hariç */
  headerContentHeight: 72,
  headerContentGap: 10,
  scrollBottomMin: 96,
  quickActionGridGap: 12,
  quickActionMinHeight: 86,
  quickActionMaxHeight: 92,
  districtCardWidth: 118,
  districtCardHeight: 122,
} as const;

export type HubAssetSlot = {
  imageSource?: ImageSource;
  fallbackIcon: string;
};

export function hubPremiumShadowCard() {
  return {
    shadowColor: '#1C2838',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  } as const;
}
