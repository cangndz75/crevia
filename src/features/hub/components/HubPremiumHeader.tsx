import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  HUB_PREMIUM_COLORS,
  HUB_PREMIUM_LAYOUT,
  HUB_PREMIUM_RADIUS,
  hubPremiumShadowCard,
} from '@/features/hub/utils/hubPremiumPresentation';
import { creviaAssets } from '@/core/assets/creviaAssets';
import { getPilotDistrictHeroImage } from '@/features/hub/utils/hubAssets';
import { getTimeGreeting } from '@/core/utils/timeGreeting';
import { useGameStatus } from '@/store/gameSelectors';
import { HeaderAvatar } from '@/ui/components/game-header/HeaderAvatar';
import { spacing } from '@/ui/theme/spacing';

function buildPilotMetaLine(
  day: number,
  districtName: string,
  level: number,
): string {
  const short = districtName.split(' ')[0] ?? districtName;
  return `${day}. Gün · ${short} · Sv.${level}`;
}

export function HubPremiumHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const status = useGameStatus();
  const greeting = useMemo(() => getTimeGreeting(), []);
  const metaLine = useMemo(
    () =>
      buildPilotMetaLine(
        status.currentDay,
        status.selectedDistrictName,
        status.level,
      ),
    [status.currentDay, status.selectedDistrictName, status.level],
  );
  const skylineSource = useMemo(
    () =>
      status.currentDay <= 1
        ? creviaAssets.buildings.municipalHall3d
        : getPilotDistrictHeroImage(status.selectedDistrictId),
    [status.currentDay, status.selectedDistrictId],
  );
  const greetingLine = `${greeting.title}, ${status.playerName}`;

  return (
    <View style={[styles.outer, hubPremiumShadowCard()]}>
      <LinearGradient
        colors={[
          HUB_PREMIUM_COLORS.tealDark,
          HUB_PREMIUM_COLORS.teal,
          '#1A9A92',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { paddingTop: insets.top + 2 }]}>
        <View style={styles.mintOverlay} pointerEvents="none" />
        <Image
          source={skylineSource}
          style={styles.skyline}
          contentFit="cover"
          contentPosition="bottom"
        />

        <View style={styles.content}>
          <View style={styles.mainRow}>
            <Pressable
              onPress={() => router.push('/profile' as Href)}
              accessibilityRole="button"
              accessibilityLabel="Profili aç"
              style={styles.avatarPress}>
              <HeaderAvatar
                size={46}
                level={status.level}
                showLevelBadge
                borderColor="rgba(255,255,255,0.9)"
              />
            </Pressable>

            <View style={styles.greetCol}>
              <Text
                style={styles.greeting}
                numberOfLines={1}
                ellipsizeMode="tail">
                {greetingLine}
                <Text style={styles.greetingEmoji}> {greeting.emoji}</Text>
              </Text>
              <Text
                style={styles.meta}
                numberOfLines={1}
                ellipsizeMode="tail">
                {metaLine}
              </Text>
            </View>

            <View style={styles.rightCol}>
              <View style={styles.resourceRow}>
                <View style={styles.chip}>
                  <Ionicons
                    name="briefcase"
                    size={10}
                    color={HUB_PREMIUM_COLORS.goldSoft}
                  />
                  <Text
                    style={styles.chipText}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {status.sourceShort}
                  </Text>
                </View>
                <View style={styles.chip}>
                  <Ionicons
                    name="star"
                    size={10}
                    color={HUB_PREMIUM_COLORS.goldSoft}
                  />
                  <Text
                    style={styles.chipText}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {status.xp}/{status.xpTarget}
                  </Text>
                </View>
              </View>
              <View style={styles.shortcutRow}>
                <Pressable
                  onPress={() => router.push('/reports' as Href)}
                  style={({ pressed }) => [
                    styles.shortcut,
                    styles.shortcutActive,
                    pressed && styles.shortcutPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Raporlar">
                  <Ionicons
                    name="bar-chart"
                    size={15}
                    color={HUB_PREMIUM_COLORS.tealDark}
                  />
                </Pressable>
                <Pressable
                  onPress={() => router.push('/social' as Href)}
                  style={({ pressed }) => [
                    styles.shortcut,
                    styles.shortcutGhost,
                    pressed && styles.shortcutPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Bildirimler">
                  <Ionicons
                    name="notifications-outline"
                    size={15}
                    color={HUB_PREMIUM_COLORS.creamText}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderBottomLeftRadius: HUB_PREMIUM_RADIUS.headerBottom,
    borderBottomRightRadius: HUB_PREMIUM_RADIUS.headerBottom,
    overflow: 'hidden',
    marginBottom: HUB_PREMIUM_LAYOUT.headerContentGap,
  },
  gradient: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 10,
    position: 'relative',
  },
  mintOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(189, 239, 231, 0.12)',
  },
  skyline: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  content: {
    zIndex: 1,
    minHeight: HUB_PREMIUM_LAYOUT.headerContentHeight,
    justifyContent: 'center',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarPress: {
    flexShrink: 0,
  },
  greetCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  greeting: {
    fontSize: 15,
    fontWeight: '800',
    color: HUB_PREMIUM_COLORS.creamText,
    letterSpacing: -0.3,
  },
  greetingEmoji: {
    fontSize: 14,
  },
  meta: {
    fontSize: 11,
    fontWeight: '600',
    color: HUB_PREMIUM_COLORS.mintText,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 5,
    flexShrink: 0,
    maxWidth: 164,
  },
  resourceRow: {
    flexDirection: 'row',
    gap: 5,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    width: 72,
    backgroundColor: HUB_PREMIUM_COLORS.chipBg,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: HUB_PREMIUM_COLORS.chipBorder,
    minWidth: 0,
  },
  chipText: {
    fontSize: 9,
    fontWeight: '800',
    color: HUB_PREMIUM_COLORS.creamText,
    flex: 1,
    minWidth: 0,
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: 6,
  },
  shortcut: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutActive: {
    backgroundColor: HUB_PREMIUM_COLORS.goldSoft,
    borderWidth: 1,
    borderColor: 'rgba(216, 180, 74, 0.45)',
  },
  shortcutGhost: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: HUB_PREMIUM_COLORS.chipBorder,
  },
  shortcutPressed: {
    opacity: 0.88,
  },
});
