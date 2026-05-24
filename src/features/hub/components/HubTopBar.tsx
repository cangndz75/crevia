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

import { mockGameData } from '@/core/content/mockGameData';
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
  const { city, player } = mockGameData;
  const xpProgress = player.xp / player.xpToNextLevel;
  const weekday = WEEKDAYS_TR[new Date().getDay()];

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        <Pressable style={styles.iconBtn} accessibilityLabel="Menü">
          <Ionicons name="menu" size={22} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.dayBlock}>
          <Text style={styles.dayLabel}>GÜN {city.day}</Text>
          <Text style={styles.daySub}>{weekday}</Text>
        </View>

        <View style={styles.levelBlock}>
          <View style={styles.levelTitleRow}>
            <Ionicons name="shield" size={14} color={colors.authority} />
            <Text style={styles.levelLabel}>SEVİYE {player.level}</Text>
          </View>
          <AnimatedXpBar progress={xpProgress} />
          <Text style={styles.xpText}>
            {player.xp.toLocaleString('tr-TR')} /{' '}
            {player.xpToNextLevel.toLocaleString('tr-TR')} XP
          </Text>
        </View>

        <View style={styles.rightActions}>
          <Pressable style={styles.iconBtn} accessibilityLabel="Bildirimler">
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.textPrimary}
            />
            {player.notificationCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{player.notificationCount}</Text>
              </View>
            ) : null}
          </Pressable>

          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={18} color={colors.authority} />
            </View>
            <View style={styles.onlineDot} />
          </View>
        </View>
      </View>

      <View style={styles.identity}>
        <Text style={styles.identityEyebrow}>Operasyon merkezi</Text>
        <Text style={styles.roleTitle}>
          <Text style={styles.roleStrong}>{player.role}</Text>
          <Text style={styles.roleMutedSecondary}> · {city.department}</Text>
        </Text>
        <Text style={styles.cityTag}>{city.name} · Seviye {player.level}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBlock: {
    minWidth: 52,
  },
  dayLabel: {
    fontSize: 13,
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
    gap: 4,
  },
  levelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  levelLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.authority,
    letterSpacing: 0.3,
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
  xpText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  identity: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 6,
  },
  identityEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.25,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  roleTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  cityTag: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.15,
    fontStyle: 'italic',
  },
  roleStrong: {
    fontWeight: '800',
    color: colors.textPrimary,
  },
  roleMutedSecondary: {
    fontWeight: '600',
    color: colors.textSecondary,
    fontSize: 14,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.authorityMuted,
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
});
