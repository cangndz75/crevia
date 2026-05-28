import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import type { HubQuickActionCardModel } from '@/core/hubQuickActions';
import { HUB_QUICK_ACTION_COMPACT_CARD_MAX_HEIGHT } from '@/features/hub/hubUiPresentation';
import { colors } from '@/ui/theme/colors';
import { shadows } from '@/ui/theme/shadows';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  card: HubQuickActionCardModel;
  onPress: () => void;
  variant?: 'compact';
};

export function HubQuickActionCard({
  card,
  onPress,
  variant = 'compact',
}: Props) {
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
            color={card.used ? colors.textSecondary : colors.primary}
          />
        </View>
        <View style={[styles.chip, chipTone]}>
          {card.used ? (
            <Ionicons
              name="checkmark"
              size={9}
              color={colors.textSecondary}
              style={styles.chipIcon}
            />
          ) : null}
          <Text style={styles.chipText} numberOfLines={1}>
            {card.statusLabel}
          </Text>
        </View>
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {card.title}
      </Text>
      <Text style={styles.subtitle} numberOfLines={variant === 'compact' ? 1 : 2}>
        {caption}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 148,
    maxHeight: HUB_QUICK_ACTION_COMPACT_CARD_MAX_HEIGHT,
    minHeight: 72,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(26, 143, 138, 0.1)',
    padding: 10,
    gap: 4,
    ...shadows.soft,
  },
  cardUsed: {
    backgroundColor: '#FAFAF8',
    borderColor: 'rgba(26, 143, 138, 0.12)',
  },
  cardDisabled: {
    backgroundColor: colors.backgroundAlt,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 4,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '58%',
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 2,
    gap: 2,
  },
  chipIcon: {
    marginRight: 1,
  },
  chipReady: {
    backgroundColor: colors.primaryMuted,
  },
  chipUsed: {
    backgroundColor: colors.backgroundAlt,
  },
  chipDisabled: {
    backgroundColor: colors.warningMuted,
  },
  chipText: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.textSecondary,
    flexShrink: 1,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 12,
  },
});
