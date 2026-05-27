import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { HexagonBadgeIcon } from '@/features/progression/components/authorities/HexagonBadgeIcon';
import { AUTHORITY_THEME } from '@/features/progression/components/authorities/theme';
import type { AuthorityGridItem } from '@/features/progression/utils/authoritiesScreenModel';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type AuthorityBadgeCardProps = {
  item: AuthorityGridItem;
  index: number;
};

function CornerBadge({
  status,
}: {
  status: AuthorityGridItem['status'];
}) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (status !== 'active') return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 700 }),
        withTiming(1, { duration: 700 }),
      ),
      -1,
      false,
    );
  }, [pulse, status]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  if (status === 'active') {
    return (
      <Animated.View style={[styles.cornerBadge, styles.cornerActive, pulseStyle]}>
        <Ionicons name="checkmark" size={11} color={colors.textInverse} />
      </Animated.View>
    );
  }
  if (status === 'soon') {
    return (
      <View style={[styles.cornerBadge, styles.cornerSoon]}>
        <Ionicons name="time-outline" size={11} color={colors.authority} />
      </View>
    );
  }
  return (
    <View style={[styles.cornerBadge, styles.cornerLocked]}>
      <Ionicons name="lock-closed" size={10} color={colors.textSecondary} />
    </View>
  );
}

export function AuthorityBadgeCard({ item, index }: AuthorityBadgeCardProps) {
  const palette = AUTHORITY_THEME[item.theme];
  const muted = item.status === 'locked';

  return (
    <Animated.View
      entering={FadeInUp.delay(120 + index * 60)
        .duration(340)
        .springify()
        .damping(22)}
      style={[
        styles.card,
        shadows.card,
        muted && styles.cardMuted,
        item.status === 'active' && styles.cardActive,
      ]}>
      <CornerBadge status={item.status} />

      <View style={styles.hexWrap}>
        <HexagonBadgeIcon
          icon={item.icon}
          theme={item.theme}
          dimmed={muted}
          size={68}
        />
      </View>

      <Text style={[styles.title, muted && styles.titleMuted]} numberOfLines={2}>
        {item.title}
      </Text>

      <View style={[styles.statusPill, { backgroundColor: palette.pillBg }]}>
        <Text style={[styles.statusText, { color: palette.pillText }]}>
          {item.statusLabel}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    paddingTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 168,
    position: 'relative',
  },
  cardActive: {
    borderColor: `${colors.primary}44`,
  },
  cardMuted: {
    opacity: 0.9,
  },
  cornerBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  cornerActive: {
    backgroundColor: colors.primary,
  },
  cornerSoon: {
    backgroundColor: colors.authorityMuted,
  },
  cornerLocked: {
    backgroundColor: colors.backgroundAlt,
  },
  hexWrap: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: 19,
  },
  titleMuted: {
    color: colors.textPrimary,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginTop: 'auto',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
