import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  buildCrisisActionHubModel,
  buildCrisisActionPresentationInputFromStore,
} from '@/core/crisisActions/crisisActionPresentation';
import { buildCrisisAnalyticsPayload } from '@/core/analytics/analyticsPayloadBuilders';
import { trackCreviaEvent } from '@/core/analytics/analyticsRuntime';
import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { CrisisActionSheet } from '@/features/hub/components/CrisisActionSheet';
import {
  HUB_PREMIUM_RADIUS,
  hubPremiumShadowCard,
} from '@/features/hub/utils/hubPremiumPresentation';
import { useGameStore } from '@/store/useGameStore';
import { getPressFeedbackStyle } from '@/ui/feedback/pressFeedback';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

type HubCrisisActionCardProps = {
  compact?: boolean;
};

const TONE = {
  positive: { accent: '#0F8F86', bg: 'rgba(15, 143, 134, 0.1)' },
  neutral: { accent: '#5E726E', bg: 'rgba(100, 130, 125, 0.1)' },
  warning: { accent: '#9A6B12', bg: 'rgba(245, 230, 200, 0.55)' },
  critical: { accent: '#8B5A14', bg: 'rgba(232, 180, 120, 0.35)' },
} as const;

export function HubCrisisActionCard({ compact = false }: HubCrisisActionCardProps) {
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const crisisState = useGameStore((s) => s.crisisState);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const assignments = useGameStore((s) => s.assignments);
  const dailyOperationsPlan = useGameStore((s) => s.dailyOperationsPlan);
  const mainOperationSeason = useGameStore((s) => s.mainOperationSeason);
  const advisorState = useGameStore((s) => s.advisorState);
  const crisisActionState = useGameStore((s) => s.crisisActionState);
  const refreshCrisisAction = useGameStore((s) => s.refreshCrisisActionForCurrentDay);

  const [sheetOpen, setSheetOpen] = useState(false);
  const day = gameState.city.day;
  const refreshedDayRef = useRef<number | null>(null);

  useEffect(() => {
    if (refreshedDayRef.current === day) return;
    refreshedDayRef.current = day;
    refreshCrisisAction();
  }, [day, refreshCrisisAction]);

  const hubModel = useMemo(() => {
    const input = buildCrisisActionPresentationInputFromStore({
      gameState,
      monetization,
      crisisState,
      operationSignals,
      assignments,
      dailyOperationsPlan,
      mainOperationSeason,
      advisorState,
      crisisActionState,
    });
    return buildCrisisActionHubModel(input, { compact });
  }, [
    advisorState,
    assignments,
    compact,
    crisisActionState,
    crisisState,
    dailyOperationsPlan,
    gameState,
    mainOperationSeason,
    monetization,
    operationSignals,
  ]);

  if (!hubModel?.visible) {
    return null;
  }

  const palette = TONE[hubModel.tone] ?? TONE.neutral;
  const isSelected = Boolean(hubModel.selectedLabel);

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <LinearGradient
        colors={['#FFF6E8', '#F7FBF8', '#FFFAF3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, hubPremiumShadowCard()]}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>
              {hubModel.title}
            </Text>
            <Text style={[styles.subtitle, { color: palette.accent }]} numberOfLines={1}>
              {hubModel.subtitle}
            </Text>
          </View>
          {isSelected ? (
            <View style={[styles.pill, { backgroundColor: palette.bg }]}>
              <Text style={[styles.pillText, { color: palette.accent }]} numberOfLines={1}>
                {hubModel.selectedLabel}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.actionLabel} numberOfLines={2}>
          {hubModel.actionLabel}
        </Text>
        <Text style={styles.summary} numberOfLines={2}>
          {hubModel.summary}
        </Text>
        <Text style={styles.reason} numberOfLines={2}>
          {hubModel.reasonLine}
        </Text>
        <Text style={styles.tradeoff} numberOfLines={2}>
          {hubModel.tradeoffLine}
        </Text>
        {hubModel.advisorLine ? (
          <View style={styles.advisorBox}>
            <Text style={styles.advisorLabel} numberOfLines={1}>
              Ece
            </Text>
            <Text style={styles.advisorLine} numberOfLines={3}>
              {hubModel.advisorLine}
            </Text>
          </View>
        ) : null}

        {!isSelected && hubModel.ctaLabel ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hubModel.ctaLabel}
            onPress={() => {
              playLightImpactHaptic();
              trackCreviaEvent(
                'crisis_action_sheet_opened',
                buildCrisisAnalyticsPayload(crisisState, gameState, monetization),
              );
              setSheetOpen(true);
            }}
            style={({ pressed }) => [
              styles.cta,
              getPressFeedbackStyle({ pressed }),
            ]}>
            <Text style={styles.ctaText} numberOfLines={1}>
              {hubModel.ctaLabel}
            </Text>
          </Pressable>
        ) : null}
      </LinearGradient>

      <CrisisActionSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    minWidth: 0,
    flexShrink: 1,
  },
  wrapCompact: {
    marginBottom: spacing.xs,
  },
  card: {
    borderRadius: HUB_PREMIUM_RADIUS.cardLg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(214, 162, 60, 0.28)',
    gap: 6,
    minWidth: 0,
    flexShrink: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    minWidth: 0,
    flexShrink: 1,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    maxWidth: '42%',
    minWidth: 0,
    flexShrink: 1,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
  },
  summary: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  reason: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 17,
  },
  tradeoff: {
    fontSize: 12,
    color: '#9A6B12',
    fontStyle: 'italic',
    lineHeight: 17,
  },
  advisorBox: {
    marginTop: 4,
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 143, 134, 0.08)',
    minWidth: 0,
    flexShrink: 1,
  },
  advisorLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F8F86',
    marginBottom: 2,
  },
  advisorLine: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  cta: {
    marginTop: spacing.sm,
    backgroundColor: '#0F8F86',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    minWidth: 0,
    flexShrink: 1,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
