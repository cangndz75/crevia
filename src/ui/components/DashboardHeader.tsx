import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getTimeGreeting } from '@/core/utils/timeGreeting';
import { getPilotDistrictHeroImage } from '@/features/hub/utils/hubAssets';
import { useGameStatus } from '@/store/gameSelectors';
import { HeaderAvatar } from '@/ui/components/game-header/HeaderAvatar';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

function buildPilotMetaLine(
  day: number,
  districtName: string,
  level: number,
): string {
  const short = districtName.split(' ')[0] ?? districtName;
  return `${day}. Gün · ${short} · Sv.${level}`;
}

export function DashboardHeader() {
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
    () => getPilotDistrictHeroImage(status.selectedDistrictId),
    [status.selectedDistrictId],
  );
  const greetingShort = `${greeting.title}, ${status.playerName}`;

  return (
    <View style={styles.outer}>
      <LinearGradient
        colors={[colors.headerTealDark, colors.headerTeal, '#1E9A95']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { paddingTop: insets.top + spacing.xs }]}>
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
                size={52}
                level={status.level}
                showLevelBadge
                borderColor="rgba(255,255,255,0.9)"
              />
            </Pressable>

            <View style={styles.greetCol}>
              <Text
                style={styles.greeting}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.88}>
                {greetingShort}
                <Text style={styles.greetingEmoji}> {greeting.emoji}</Text>
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {metaLine}
              </Text>
            </View>

            <View style={styles.rightCol}>
              <View style={styles.resourceRow}>
                <View style={styles.goldPill}>
                  <Ionicons name="briefcase" size={12} color={colors.hubGoldDark} />
                  <Text style={styles.goldPillText} numberOfLines={1}>
                    {status.sourceShort}
                  </Text>
                </View>
                <View style={styles.xpPill}>
                  <Ionicons name="star" size={11} color={colors.hubGold} />
                  <Text style={styles.xpPillText} numberOfLines={1}>
                    {status.xp}/{status.xpTarget}
                  </Text>
                </View>
              </View>
              <View style={styles.shortcutRow}>
                <Pressable
                  onPress={() => router.push('/reports' as Href)}
                  style={({ pressed }) => [
                    styles.goldShortcut,
                    pressed && styles.shortcutPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Raporlar">
                  <Ionicons name="bar-chart" size={16} color={colors.hubGoldDark} />
                </Pressable>
                <Pressable
                  onPress={() => router.push('/social' as Href)}
                  style={({ pressed }) => [
                    styles.tealShortcut,
                    pressed && styles.shortcutPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Bildirimler">
                  <Ionicons
                    name="notifications-outline"
                    size={16}
                    color="rgba(255,255,255,0.95)"
                  />
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        <LinearGradient
          colors={['transparent', 'rgba(252,249,242,0.55)', colors.hubCream]}
          locations={[0, 0.55, 1]}
          style={styles.bottomFade}
          pointerEvents="none"
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
    zIndex: 1,
  },
  gradient: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 14,
    position: 'relative',
  },
  skyline: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 20,
  },
  content: {
    zIndex: 1,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  avatarPress: {
    flexShrink: 0,
  },
  greetCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
    paddingTop: 4,
  },
  greeting: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: -0.3,
  },
  greetingEmoji: {
    fontSize: 16,
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  resourceRow: {
    flexDirection: 'row',
    gap: 6,
  },
  goldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.hubGoldMuted,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(245, 183, 49, 0.35)',
    maxWidth: 72,
    minWidth: 0,
  },
  goldPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.hubGoldDark,
    flexShrink: 1,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    maxWidth: 72,
    minWidth: 0,
  },
  xpPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textInverse,
    flexShrink: 1,
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: 6,
  },
  goldShortcut: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.hubGoldMuted,
    borderWidth: 1,
    borderColor: 'rgba(245, 183, 49, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tealShortcut: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
});
