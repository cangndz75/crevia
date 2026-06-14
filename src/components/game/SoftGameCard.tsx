import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { gameUi } from '@/ui/theme/gameUiTokens';

type SoftGameCardProps = {
  children: ReactNode;
  variant?: 'default' | 'warm' | 'mint';
  style?: ViewStyle;
  accessibilityLabel?: string;
};

const variantBg = {
  default: gameUi.colors.cardWhite,
  warm: gameUi.colors.cardWarmTint,
  mint: gameUi.colors.cardMintTint,
} as const;

export function SoftGameCard({
  children,
  variant = 'default',
  style,
  accessibilityLabel,
}: SoftGameCardProps) {
  return (
    <View
      style={[styles.card, { backgroundColor: variantBg[variant] }, style]}
      accessibilityLabel={accessibilityLabel}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: gameUi.radius.card,
    borderWidth: 1,
    borderColor: gameUi.colors.borderSoft,
    padding: 14,
    gap: gameUi.spacing.cardGap,
    minWidth: 0,
    ...gameUi.shadow.card,
  },
});
