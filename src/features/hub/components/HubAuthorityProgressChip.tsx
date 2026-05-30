import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  buildHubAuthorityChipSummaryFromPilot,
  type HubAuthorityChipSummary,
} from '@/features/hub/utils/hubAuthorityModel';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type HubAuthorityProgressChipProps = {
  summary?: HubAuthorityChipSummary;
};

export function HubAuthorityProgressChip({
  summary: summaryProp,
}: HubAuthorityProgressChipProps) {
  const pilot = useGameStore((s) => s.gameState.pilot);
  const summary = useMemo(
    () =>
      summaryProp ??
      buildHubAuthorityChipSummaryFromPilot(
        pilot.authorityState,
        pilot.currentPilotDay,
      ),
    [summaryProp, pilot.authorityState, pilot.currentPilotDay],
  );

  const accentColor =
    summary.evaluationAccent === 'promoted'
      ? colors.success
      : summary.evaluationAccent === 'candidate'
        ? colors.secondary
        : colors.textSecondary;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={[styles.chip, shadows.soft]}
      accessibilityRole="summary"
      accessibilityLabel={`Yetki durumu: ${summary.rankLabel}, ${summary.progressLine}`}>
      <View style={styles.iconWrap}>
        <Ionicons name="ribbon-outline" size={13} color={colors.secondary} />
      </View>

      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={styles.rankLabel} numberOfLines={1}>
            {summary.rankLabel}
          </Text>
          <Text style={styles.percentLabel} numberOfLines={1}>
            %{summary.progressPercent}
          </Text>
        </View>

        <Text style={styles.progressLine} numberOfLines={1}>
          {summary.progressLine}
        </Text>

        {summary.accentLine ? (
          <Text style={[styles.accentLine, { color: accentColor }]} numberOfLines={1}>
            {summary.accentLine}
          </Text>
        ) : null}

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(100, Math.max(0, summary.progressPercent))}%` },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: 2,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(26, 143, 138, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    zIndex: 1,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rankLabel: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.15,
  },
  percentLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.secondary,
  },
  progressLine: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 14,
  },
  accentLine: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
  },
  progressTrack: {
    marginTop: 2,
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.secondary,
  },
});
