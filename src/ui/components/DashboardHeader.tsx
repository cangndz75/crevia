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

/** Sağ pill için üst sınır — greeting alanı korunur */
const RESOURCE_PILL_MAX_WIDTH = 128;

function buildPilotMetaLine(day: number, districtName: string): string {
  const short = districtName.split(" ")[0] ?? districtName;
  return `${day}. Gün · ${short}`;
}

/**
 * Merkez header — avatar + greeting | sağda kaynak/XP pill.
 */
export function DashboardHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const status = useGameStatus();
  const greeting = useMemo(() => getTimeGreeting(), []);
  const metaLine = useMemo(
    () => buildPilotMetaLine(status.currentDay, status.selectedDistrictName),
    [status.currentDay, status.selectedDistrictName],
  );
  const skylineSource = useMemo(
    () => getPilotDistrictHeroImage(status.selectedDistrictId),
    [status.selectedDistrictId],
  );
  const greetingLine = `${greeting.title} ${status.playerName} ${greeting.emoji}`;

  return (
    <View style={styles.outer}>
      <LinearGradient
        colors={[colors.headerTealDark, colors.headerTeal, "#1E9A95"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { paddingTop: insets.top + spacing.sm }]}
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
                size={56}
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
                {greetingLine}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {metaLine}
              </Text>
              <View style={styles.levelPill}>
                <Text style={styles.levelPillText}>Seviye {status.level}</Text>
              </View>
            </View>

            <View style={styles.resourcePill}>
              <View style={styles.pillHalf}>
                <Ionicons name="wallet" size={12} color={colors.hubGold} />
                <View style={styles.pillTextCol}>
                  <Text style={styles.pillValue} numberOfLines={1}>
                    {status.sourceShort}
                  </Text>
                  <Text style={styles.pillLabel}>Kaynak</Text>
                </View>
              </View>
              <View style={styles.pillDivider} />
              <View style={styles.pillHalf}>
                <Ionicons name="star" size={11} color={colors.hubGold} />
                <View style={styles.pillTextCol}>
                  <Text style={styles.pillValue} numberOfLines={1}>
                    {status.xp}/{status.xpTarget}
                  </Text>
                  <Text style={styles.pillLabel}>XP</Text>
                </View>
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
    paddingBottom: 16,
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
    height: 20,
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
    gap: 3,
    paddingRight: 4,
  },
  greeting: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textInverse,
    letterSpacing: -0.35,
  },
  meta: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  levelPill: {
    alignSelf: "flex-start",
    marginTop: 1,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderWidth: 1,
    borderColor: "rgba(245,183,49,0.55)",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  levelPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.hubGold,
  },
  resourcePill: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    width: RESOURCE_PILL_MAX_WIDTH,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: radius.lg,
    paddingHorizontal: 7,
    paddingVertical: 6,
    gap: 4,
  },
  pillHalf: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    minWidth: 0,
  },
  pillTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 0,
  },
  pillDivider: {
    width: 1,
    height: 22,
    backgroundColor: "rgba(255,255,255,0.24)",
    flexShrink: 0,
  },
  pillValue: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.textInverse,
    letterSpacing: -0.2,
  },
  pillLabel: {
    fontSize: 7,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 0.2,
  },
});
