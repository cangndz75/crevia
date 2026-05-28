import { useWindowDimensions } from 'react-native';

/** ~360px cihazlar dahil dar ekran eşiği */
export const SOCIAL_COMPACT_WIDTH = 390;

export const SOCIAL_CARD_BORDER = 'rgba(228,226,221,0.9)';

export const RISK_CAROUSEL_CARD_WIDTH = 130;
export const OUTCOME_MINI_CARD_WIDTH = 116;

export function useSocialCompact(): boolean {
  const { width } = useWindowDimensions();
  return width < SOCIAL_COMPACT_WIDTH;
}
