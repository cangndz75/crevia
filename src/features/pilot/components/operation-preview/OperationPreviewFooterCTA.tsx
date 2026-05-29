import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { GameButton } from "@/ui/components/GameButton";
import { colors } from "@/ui/theme/colors";
import { radius } from "@/ui/theme/radius";
import { shadows } from "@/ui/theme/shadows";
import { spacing } from "@/ui/theme/spacing";

type OperationPreviewFooterCTAProps = {
  primaryLabel: string;
  primaryEnabled: boolean;
  onPrimaryPress?: () => void;
  onPilotReport: () => void;
  onHub?: () => void;
  onLeaderboard?: () => void;
  footerNote?: string;
};

export function OperationPreviewFooterCTA({
  primaryLabel,
  primaryEnabled,
  onPrimaryPress,
  onPilotReport,
  onHub,
  onLeaderboard,
  footerNote,
}: OperationPreviewFooterCTAProps) {
  return (
    <Animated.View
      entering={FadeInUp.delay(520).duration(340).springify().damping(22)}
      style={styles.wrap}
    >
      <View style={[styles.ctaCard, shadows.card]}>
        {primaryEnabled && onPrimaryPress ? (
          <Pressable
            onPress={onPrimaryPress}
            style={styles.primaryBtn}
            accessibilityRole="button"
            accessibilityLabel={primaryLabel}>
            <LinearGradient
              colors={[colors.headerTealDark, colors.primary]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.primaryGradient}>
              <Text style={styles.primaryText} numberOfLines={1}>
                {primaryLabel}
              </Text>
            </LinearGradient>
          </Pressable>
        ) : (
          <Pressable
            disabled
            style={styles.primaryBtnDisabled}
            accessibilityState={{ disabled: true }}>
            <Text style={styles.primaryTextDisabled} numberOfLines={1}>
              {primaryLabel}
            </Text>
          </Pressable>
        )}

        {onHub ? (
          <GameButton
            title="Merkeze Dön"
            onPress={onHub}
            variant="secondary"
            style={styles.secondaryBtn}
          />
        ) : null}

        {onLeaderboard ? (
          <GameButton
            title="Liderliği Gör"
            onPress={onLeaderboard}
            variant="ghost"
            style={styles.secondaryBtn}
          />
        ) : null}

        <GameButton
          title="Pilot Raporuna Dön"
          onPress={onPilotReport}
          variant="ghost"
          style={styles.secondaryBtn}
        />
      </View>

      {footerNote ? (
        <Text style={styles.footerNote}>{footerNote}</Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  ctaCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryBtn: {
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  primaryGradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  primaryText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textInverse,
    letterSpacing: -0.2,
  },
  primaryBtnDisabled: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundAlt,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  primaryTextDisabled: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  secondaryBtn: {
    alignSelf: "stretch",
  },
  footerNote: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
});
