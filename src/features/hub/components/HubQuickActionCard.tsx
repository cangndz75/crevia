import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import type { HubQuickActionCardModel } from '@/core/hubQuickActions';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  card: HubQuickActionCardModel;
  onPress: () => void;
};

export function HubQuickActionCard({ card, onPress }: Props) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const disabled = card.status === 'disabled' || card.status === 'used';
  const caption = card.helperLine ?? card.subtitle;
  const chipTone =
    card.status === 'used'
      ? styles.chipUsed
      : card.status === 'disabled'
        ? styles.chipDisabled
        : styles.chipReady;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        if (!disabled) {
          scale.value = withSpring(0.97, { damping: 16, stiffness: 320 });
        }
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 320 });
      }}
      style={[
        styles.card,
        animStyle,
        card.used ? styles.cardUsed : null,
        card.status === 'disabled' ? styles.cardDisabled : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={card.title}
      accessibilityState={{ disabled }}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={card.iconName as keyof typeof Ionicons.glyphMap}
            size={16}
            color={colors.primary}
          />
        </View>
        <View style={[styles.chip, chipTone]}>
          <Text style={styles.chipText}>{card.statusLabel}</Text>
        </View>
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {card.title}
      </Text>
      <Text style={styles.subtitle} numberOfLines={2}>
        {caption}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 148,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    gap: 6,
    ...shadows.soft,
  },
  cardUsed: {
    opacity: 0.72,
  },
  cardDisabled: {
    opacity: 0.85,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chipReady: {
    backgroundColor: colors.primaryMuted,
  },
  chipUsed: {
    backgroundColor: colors.border,
  },
  chipDisabled: {
    backgroundColor: colors.warningMuted,
  },
  chipText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 13,
    minHeight: 26,
  },
});
