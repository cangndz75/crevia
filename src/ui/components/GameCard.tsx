import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type GameCardProps = {
  children: ReactNode;
  padding?: keyof typeof spacing | number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  soft?: boolean;
};

export function GameCard({
  children,
  padding = 'lg',
  onPress,
  style,
  soft = false,
}: GameCardProps) {
  const paddingValue = typeof padding === 'number' ? padding : spacing[padding];

  const cardStyle = [
    styles.card,
    soft && styles.cardSoft,
    shadows.card,
    { padding: paddingValue },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardSoft: {
    backgroundColor: colors.surfaceSoft,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
