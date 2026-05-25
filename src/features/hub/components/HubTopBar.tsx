import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useShallow } from 'zustand/react/shallow';

import { useHubDerivedInput } from '@/features/hub/hooks/useHubDerivedInput';
import { deriveHubMotto } from '@/features/hub/utils/hubDerived';
import { useGameStore } from '@/store/useGameStore';
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

function AnimatedXpBar({ progress }: { progress: number }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const fillWidth = useSharedValue(0);

  const play = useCallback(
    (width: number) => {
      if (width <= 0) return;
      fillWidth.value = 0;
      fillWidth.value = withTiming(width * progress, {
        duration: 1000,
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
  const { day, department, cityName, role, level, xp, xpToNextLevel, notificationCount } =
    useGameStore(
      useShallow((s) => ({
        day: s.gameState.city.day,
        department: s.gameState.city.department,
        cityName: s.gameState.city.name,
        role: s.gameState.player.role,
        level: s.gameState.player.level,
        xp: s.gameState.player.xp,
        xpToNextLevel: s.gameState.player.xpToNextLevel,
        notificationCount: s.gameState.player.notificationCount,
      })),
    );

  const xpProgress = xp / xpToNextLevel;
  const weekday = WEEKDAYS_TR[new Date().getDay()];

  const input = useHubDerivedInput();
  const motto = useMemo(() => deriveHubMotto(input), [input]);

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + spacing.md }]}>
      {/* Top Row */}
      <View style={styles.row}>
        <Pressable style={styles.iconBtn} accessibilityLabel="Menü">
          <Ionicons name="menu" size={22} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.dayBlock}>
          <Text style={styles.dayLabel}>GÜN {day}</Text>
          <Text style={styles.daySub}>{weekday}</Text>
        </View>

        <View style={styles.levelBlock}>
          <View style={styles.levelPill}>
            <Ionicons name="shield" size={13} color={colors.textInverse} />
            <Text style={styles.levelLabel}>SEVİYE {level}</Text>
          </View>
          <AnimatedXpBar progress={xpProgress} />
          <Text style={styles.xpText}>
            {xp.toLocaleString('tr-TR')}/{xpToNextLevel.toLocaleString('tr-TR')} XP
          </Text>
        </View>

        <View style={styles.rightActions}>
          <Pressable style={styles.iconBtn} accessibilityLabel="Bildirimler">
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

          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={18} color={colors.authority} />
            </View>
            <View style={styles.onlineDot} />
          </View>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>OPERASYON MERKEZİ</Text>
        <Text style={styles.roleTitle}>{role}</Text>
        <Text style={styles.subtitle}>
          {cityName} · {department}
        </Text>

        {/* Briefing Capsule */}
        <View style={styles.capsule}>
          <View style={styles.capsuleAccent} />
          <View style={styles.capsuleContent}>
            <View style={styles.capsuleHeader}>
              <Ionicons name="radio-outline" size={14} color={colors.primary} />
              <Text style={styles.capsuleLabel}>Güncel Durum</Text>
            </View>
            <Text style={styles.capsuleMotto}>{motto}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBlock: {
    minWidth: 54,
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  daySub: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  levelBlock: {
    flex: 1,
    minWidth: 0,
    gap: 3,
    alignItems: 'center',
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.authority,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  levelLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textInverse,
    letterSpacing: 0.5,
  },
  xpTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.authorityMuted,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.xpGold,
  },
  xpText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
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
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.purpleMuted,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background,
  },
  hero: {
    marginTop: spacing.xl,
    gap: 6,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.textSecondary,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
    color: colors.primary,
  },
  capsule: {
    flexDirection: 'row',
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.md,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  capsuleAccent: {
    width: 3,
    backgroundColor: colors.primary,
  },
  capsuleContent: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: 4,
  },
  capsuleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  capsuleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  capsuleMotto: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    lineHeight: 18,
  },
});
