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

import { getDistrictProfile } from '@/core/content/districtProfiles';
import {
  DEFAULT_PILOT_DISTRICT_ID,
  type PilotDistrictId,
} from '@/core/models/DistrictProfile';
import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import { hubAssets } from '@/features/hub/utils/hubAssets';
import { getTimeGreeting } from '@/features/hub/utils/hubPresentation';
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
        duration: 800,
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
  const greeting = useMemo(() => getTimeGreeting(), []);

  const {
    level,
    xp,
    xpToNextLevel,
    notificationCount,
    streakDays,
    pilotDay,
    districtName,
  } = useGameStore(
    useShallow((s) => {
      const districtId: PilotDistrictId =
        s.gameState.pilot.selectedDistrictId ?? DEFAULT_PILOT_DISTRICT_ID;
      const district = getDistrictProfile(districtId);
      return {
        level: s.gameState.player.level,
        xp: s.gameState.player.xp,
        xpToNextLevel: s.gameState.player.xpToNextLevel,
        notificationCount: s.gameState.player.notificationCount,
        streakDays: s.gameState.player.streakDays,
        pilotDay: s.gameState.pilot.currentPilotDay,
        districtName: district?.name ?? 'Pilot Bölge',
      };
    }),
  );

  const xpProgress = xpToNextLevel > 0 ? xp / xpToNextLevel : 0;

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + 8 }]}>
      {/* Row 1: Avatar + greeting + bell */}
      <View style={styles.topRow}>
        <View style={styles.avatarWrap}>
          <HubAssetImage
            source={hubAssets.playerAvatar}
            containerStyle={styles.avatar}
            style={styles.avatarImage}
            contentFit="cover"
          />
          <View style={styles.avatarLevel}>
            <Text style={styles.avatarLevelText}>{level}</Text>
          </View>
        </View>

        <View style={styles.greetCol}>
          <Text style={styles.greetingText}>
            {greeting.title} Can {greeting.emoji}
          </Text>
          <Text style={styles.metaText}>
            {pilotDay}. Gün · Pilot Bölge: {districtName.split(' ')[0]}
          </Text>
        </View>

        <Pressable style={styles.bellBtn} accessibilityLabel="Bildirimler">
          <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
          {notificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {notificationCount > 9 ? '9+' : notificationCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Row 2: Level pill + XP bar + streak */}
      <View style={styles.levelRow}>
        <View style={styles.levelPill}>
          <Text style={styles.levelPillText}>Seviye {level}</Text>
        </View>
        <View style={styles.xpCol}>
          <View style={styles.xpLabelRow}>
            <Text style={styles.xpLabelText}>XP</Text>
            <Text style={styles.xpValueText}>
              {xp.toLocaleString('tr-TR')}/{xpToNextLevel.toLocaleString('tr-TR')}
            </Text>
          </View>
          <AnimatedXpBar progress={xpProgress} />
        </View>
        <View style={styles.streakPill}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakNum}>{Math.max(streakDays, 1)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: 10,
    backgroundColor: colors.hubCream,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  avatarImage: {
    borderRadius: 24,
  },
  avatarLevel: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.hubGold,
    borderWidth: 2,
    borderColor: colors.hubCream,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  avatarLevelText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
  },
  greetCol: {
    flex: 1,
    gap: 1,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  bellBtn: {
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
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.textInverse,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  levelPill: {
    backgroundColor: colors.hubGold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  levelPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  xpCol: {
    flex: 1,
    gap: 3,
  },
  xpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xpLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  xpValueText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  xpTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.hubGoldTrack,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.hubGold,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.warningMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  streakEmoji: {
    fontSize: 12,
  },
  streakNum: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.warning,
  },
});
