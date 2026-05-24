import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatCurrency, mockGameData } from '@/core/content/mockGameData';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

const WEEKDAYS_TR = [
  'Pazar',
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
];

function XpBar({ progress }: { progress: number }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const fillWidth = useSharedValue(0);

  const play = useCallback(
    (w: number) => {
      if (w <= 0) return;
      fillWidth.value = 0;
      fillWidth.value = withTiming(w * progress, {
        duration: 900,
        easing: Easing.out(Easing.cubic),
      });
    },
    [fillWidth, progress],
  );

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const w = e.nativeEvent.layout.width;
      setTrackWidth(w);
      play(w);
    },
    [play],
  );

  useFocusEffect(
    useCallback(() => {
      play(trackWidth);
    }, [play, trackWidth]),
  );

  const fillStyle = useAnimatedStyle(() => ({ width: fillWidth.value }));

  return (
    <View style={styles.xpTrack} onLayout={onLayout}>
      <Animated.View style={[styles.xpFill, fillStyle]} />
    </View>
  );
}

export function EventsStatusHeader() {
  const insets = useSafeAreaInsets();
  const { city, player } = mockGameData;
  const xpProgress = player.xp / player.xpToNextLevel;
  const weekday = WEEKDAYS_TR[new Date().getDay()];
  const budgetDelta = '+8.500';

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topRow}>
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Ionicons name="business" size={18} color={colors.textInverse} />
          </View>
          <Text style={styles.brandText}>Crevia</Text>
        </View>

        <View style={styles.pill}>
          <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.pillText}>
            Gün {city.day} · {weekday}
          </Text>
        </View>

        <View style={[styles.pill, styles.levelPill]}>
          <Ionicons name="heart" size={12} color={colors.authority} />
          <Text style={[styles.pillText, styles.levelText]}>
            Seviye {player.level}
          </Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.xpBlock}>
          <View style={styles.xpLabels}>
            <Text style={styles.xpLabel}>XP</Text>
            <Text style={styles.xpValue}>
              {player.xp.toLocaleString('tr-TR')} /{' '}
              {player.xpToNextLevel.toLocaleString('tr-TR')}
            </Text>
          </View>
          <XpBar progress={xpProgress} />
        </View>

        <Pressable style={styles.notifyBtn} accessibilityLabel="Bildirimler">
          <Ionicons
            name="notifications-outline"
            size={20}
            color={colors.textPrimary}
          />
          {player.notificationCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{player.notificationCount}</Text>
            </View>
          ) : null}
        </Pressable>

        <View style={styles.currencyPill}>
          <Ionicons name="logo-bitcoin" size={14} color={colors.xpGold} />
          <Text style={styles.currencyMain}>{formatCurrency(city.budget)}</Text>
          <Text style={styles.currencyDelta}>{budgetDelta}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginRight: spacing.xs,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  levelPill: {
    backgroundColor: colors.authorityMuted,
    borderColor: `${colors.authority}33`,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  levelText: {
    color: colors.authority,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  xpBlock: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  xpLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.authority,
  },
  xpValue: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  xpTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.authorityMuted,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.authority,
  },
  notifyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: colors.background,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textInverse,
  },
  currencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.xpGold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.full,
    maxWidth: 130,
  },
  currencyMain: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  currencyDelta: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
});
