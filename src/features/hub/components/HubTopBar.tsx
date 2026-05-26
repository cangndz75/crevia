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
import { useShallow } from 'zustand/react/shallow';

import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

function AnimatedXpBar({ progress }: { progress: number }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const fillWidth = useSharedValue(0);

  const play = useCallback(
    (width: number) => {
      if (width <= 0) return;
      fillWidth.value = 0;
      fillWidth.value = withTiming(width * progress, {
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

  const fillStyle = useAnimatedStyle(() => ({
    width: fillWidth.value,
  }));

  return (
    <View style={styles.xpTrack} onLayout={onLayout}>
      <Animated.View style={[styles.xpFill, fillStyle]} />
    </View>
  );
}

export function HubTopBar() {
  const insets = useSafeAreaInsets();
  const {
    day,
    level,
    xp,
    xpToNextLevel,
    notificationCount,
    streakDays,
    pilotRegion,
  } = useGameStore(
    useShallow((s) => ({
      day: s.gameState.city.day,
      level: s.gameState.player.level,
      xp: s.gameState.player.xp,
      xpToNextLevel: s.gameState.player.xpToNextLevel,
      notificationCount: s.gameState.player.notificationCount,
      streakDays: s.gameState.player.streakDays,
      pilotRegion:
        s.neighborhoods[0]?.name.split(' ')[0] ?? s.gameState.city.name,
    })),
  );

  const xpProgress = xpToNextLevel > 0 ? xp / xpToNextLevel : 0;

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topRow}>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={22} color={colors.hubGoldDark} />
          </View>
          <View style={styles.greetingBlock}>
            <Text style={styles.greeting}>Günaydın ☀️</Text>
            <Text style={styles.meta}>
              {day}. Gün · Pilot Bölge: {pilotRegion}
            </Text>
          </View>
        </View>

        <Pressable style={styles.bellBtn} accessibilityLabel="Bildirimler">
          <Ionicons
            name="notifications-outline"
            size={22}
            color={colors.textPrimary}
          />
          {notificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notificationCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.levelRow}>
        <View style={styles.levelPill}>
          <Text style={styles.levelPillText}>Seviye {level}</Text>
        </View>
        <View style={styles.xpBlock}>
          <Text style={styles.xpLabel}>
            XP {xp.toLocaleString('tr-TR')} /{' '}
            {xpToNextLevel.toLocaleString('tr-TR')}
          </Text>
          <AnimatedXpBar progress={xpProgress} />
        </View>
        <View style={styles.streakPill}>
          <Ionicons name="flame" size={14} color={colors.warning} />
          <Text style={styles.streakText}>{Math.max(streakDays, 1)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.hubCream,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.hubGoldMuted,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingBlock: {
    flex: 1,
    gap: 2,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  meta: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textInverse,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  levelPill: {
    backgroundColor: colors.hubGold,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  levelPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  xpBlock: {
    flex: 1,
    gap: 4,
  },
  xpLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  xpTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.hubGoldTrack,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.hubGold,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.warning,
  },
});
