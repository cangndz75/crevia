import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, type Href } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getTimeGreeting } from "@/core/utils/timeGreeting";
import { getPilotDistrictHeroImage } from "@/features/hub/utils/hubAssets";
import { useGameStatus } from "@/store/gameSelectors";
import { HeaderAvatar } from "@/ui/components/game-header/HeaderAvatar";
import { colors } from "@/ui/theme/colors";
import { radius } from "@/ui/theme/radius";
import { spacing } from "@/ui/theme/spacing";

const RESOURCE_PILL_MAX_WIDTH = 118;

function buildPilotMetaLine(
  day: number,
  districtName: string,
  level: number,
): string {
  const short = districtName.split(" ")[0] ?? districtName;
  return `${day}. Gün · ${short} · Sv.${level}`;
}

/**
 * Merkez header — kompakt avatar + meta | kaynak/XP + kısayollar.
 */
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
        colors={[colors.headerTealDark, colors.headerTeal, "#1E9A95"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { paddingTop: insets.top + spacing.xs }]}
      >
        <Image
          source={skylineSource}
          style={styles.skyline}
          contentFit="cover"
          contentPosition="bottom"
        />

        <View style={styles.content}>
          <View style={styles.mainRow}>
            <Pressable
              onPress={() => router.push("/profile" as Href)}
              accessibilityRole="button"
              accessibilityLabel="Profili aç"
              style={styles.avatarPress}
            >
              <HeaderAvatar
                size={48}
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
                minimumFontScale={0.88}
              >
                {greetingShort}
                <Text style={styles.greetingEmoji}> {greeting.emoji}</Text>
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {metaLine}
              </Text>
            </View>

            <View style={styles.rightCol}>
              <View style={styles.resourcePill}>
                <View style={styles.pillHalf}>
                  <Ionicons name="wallet" size={11} color={colors.hubGold} />
                  <Text style={styles.pillValue} numberOfLines={1}>
                    {status.sourceShort}
                  </Text>
                </View>
                <View style={styles.pillDivider} />
                <View style={styles.pillHalf}>
                  <Ionicons name="star" size={10} color={colors.hubGold} />
                  <Text style={styles.pillValue} numberOfLines={1}>
                    {status.xp}/{status.xpTarget}
                  </Text>
                </View>
              </View>
              <View style={styles.shortcutRow}>
                <Pressable
                  onPress={() => router.push("/leaderboard" as Href)}
                  style={({ pressed }) => [
                    styles.squareShortcut,
                    pressed && styles.shortcutPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Liderlik tablosu"
                >
                  <Ionicons name="podium-outline" size={16} color={colors.hubGold} />
                </Pressable>
                <Pressable
                  onPress={() => router.push("/social" as Href)}
                  style={({ pressed }) => [
                    styles.squareShortcut,
                    pressed && styles.shortcutPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Bildirimler ve sosyal nabız"
                >
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
          colors={["transparent", "rgba(252,249,242,0.5)", colors.hubCream]}
          locations={[0, 0.6, 1]}
          style={styles.bottomFade}
          pointerEvents="none"
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    overflow: "hidden",
    zIndex: 1,
  },
  gradient: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 12,
    position: "relative",
  },
  skyline: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  bottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 16,
  },
  content: {
    zIndex: 1,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarPress: {
    flexShrink: 0,
  },
  greetCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingRight: 2,
  },
  greeting: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textInverse,
    letterSpacing: -0.3,
  },
  greetingEmoji: {
    fontSize: 15,
  },
  meta: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.82)",
  },
  rightCol: {
    alignItems: "flex-end",
    gap: 6,
    flexShrink: 0,
  },
  resourcePill: {
    flexDirection: "row",
    alignItems: "center",
    width: RESOURCE_PILL_MAX_WIDTH,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: radius.md,
    paddingHorizontal: 6,
    paddingVertical: 5,
    gap: 4,
  },
  pillHalf: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    minWidth: 0,
  },
  pillDivider: {
    width: 1,
    height: 18,
    backgroundColor: "rgba(255,255,255,0.24)",
    flexShrink: 0,
  },
  pillValue: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.textInverse,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  shortcutRow: {
    flexDirection: "row",
    gap: 6,
  },
  squareShortcut: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
});
