import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { teamDispatch } from '@/features/hub/theme/teamDispatchTokens';
import { spacing } from '@/ui/theme/spacing';

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

type TeamDispatchHeaderProps = {
  title: string;
  subtitle: string;
  onBack: () => void;
  onNotifications?: () => void;
};

export function TeamDispatchHeader({
  title,
  subtitle,
  onBack,
  onNotifications,
}: TeamDispatchHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      entering={FadeInDown.duration(360)}
      style={[styles.wrap, { paddingTop: insets.top + spacing.xs }]}>
      <Pressable
        onPress={onBack}
        hitSlop={HIT_SLOP}
        style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Geri dön">
        <Ionicons name="chevron-back" size={22} color={teamDispatch.textDark} />
      </Pressable>

      <View style={styles.center}>
        <View style={styles.titleIcon}>
          <Ionicons name="people" size={16} color={teamDispatch.teal} />
        </View>
        <View style={styles.titleCopy}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onNotifications}
        hitSlop={HIT_SLOP}
        style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Bildirimler">
        <Ionicons name="notifications-outline" size={20} color={teamDispatch.textDark} />
        <View style={styles.notifDot} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: teamDispatch.bg,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: teamDispatch.card,
    borderWidth: 1,
    borderColor: teamDispatch.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pressed: {
    opacity: 0.88,
  },
  center: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 0,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 143, 134, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleCopy: {
    alignItems: 'flex-start',
    gap: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: teamDispatch.textDark,
    letterSpacing: -0.35,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: teamDispatch.textMuted,
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: teamDispatch.gold,
    borderWidth: 1.5,
    borderColor: teamDispatch.card,
  },
});
