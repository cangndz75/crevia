import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { buildResourceFatigueVisualSummary } from '@/core/resources';
import { buildResourceAnalyticsPayload } from '@/core/analytics/analyticsPayloadBuilders';
import { ResourceFatigueSummaryStrip } from '@/features/resources/components/ResourceFatigueSummaryStrip';
import {
  buildCommonAnalyticsBase,
  trackCreviaEvent,
} from '@/core/analytics/analyticsRuntime';
import {
  buildOperationalResourceEngineInputFromStore,
  buildOperationalResourceHubModel,
} from '@/core/operationalResources/operationalResourcePresentation';
import {
  buildOperationalResourcePresenceHubPresentation,
  buildOperationalResourcePresenceLiteInputFromEngine,
  buildOperationalResourcePresenceLiteModel,
} from '@/core/operationalResourcePresence';
import { deriveMainOperationAccessMode } from '@/core/mainOperation/mainOperationEngine';
import { OperationalResourcesDetailSheet } from '@/features/hub/components/OperationalResourcesDetailSheet';
import {
  HUB_PREMIUM_COLORS,
  HUB_PREMIUM_RADIUS,
  hubPremiumShadowCard,
} from '@/features/hub/utils/hubPremiumPresentation';
import { useGameStore } from '@/store/useGameStore';
import { getPressFeedbackStyle } from '@/ui/feedback/pressFeedback';
import { spacing } from '@/ui/theme/spacing';

const TONE_COLORS = {
  positive: { text: '#0F6B64', bg: 'rgba(15, 143, 134, 0.1)' },
  neutral: { text: '#4A5F5B', bg: 'rgba(100, 130, 125, 0.1)' },
  warning: { text: '#9A6B12', bg: 'rgba(245, 230, 200, 0.55)' },
  critical: { text: '#8B5A14', bg: 'rgba(232, 180, 120, 0.35)' },
} as const;

export function HubOperationalResourcesCard() {
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const dailyOperationsPlan = useGameStore((s) => s.dailyOperationsPlan);
  const assignments = useGameStore((s) => s.assignments);
  const microDecisionState = useGameStore((s) => s.microDecisionState);
  const crisisActionState = useGameStore((s) => s.crisisActionState);
  const operationalResources = useGameStore((s) => s.operationalResources);

  const [detailOpen, setDetailOpen] = useState(false);

  const model = useMemo(() => {
    const input = buildOperationalResourceEngineInputFromStore({
      gameState,
      monetization,
      operationSignals,
      dailyOperationsPlan,
      assignments,
      microDecisionState,
      crisisActionState,
      operationalResources,
    });
    return buildOperationalResourceHubModel(input);
  }, [
    gameState,
    monetization,
    operationSignals,
    dailyOperationsPlan,
    assignments,
    microDecisionState,
    crisisActionState,
    operationalResources,
  ]);

  const fatigueSummary = useMemo(
    () =>
      buildResourceFatigueVisualSummary({
        day: gameState.city.day,
        surface: 'hub',
        operationalResources,
        operationSignals: {
          dailyFocus: operationSignals.dailyFocus,
          overall: { status: operationSignals.overall.status },
          vehicles: { status: operationSignals.vehicles.status },
          personnel: { status: operationSignals.personnel.status },
          containers: { status: operationSignals.containers.status },
        },
        hasRealPostPilotData: gameState.city.day > 7,
      }),
    [gameState.city.day, operationalResources, operationSignals],
  );

  const presencePresentation = useMemo(() => {
    const presenceInput = buildOperationalResourcePresenceLiteInputFromEngine({
      day: gameState.city.day,
      isPostPilot: gameState.city.day > 7,
      accessMode: deriveMainOperationAccessMode(gameState, monetization),
      operationalResources,
      operationSignals: {
        dailyFocus: operationSignals.dailyFocus,
        priorityDistrictId: operationSignals.priorityDistrictId,
        containers: operationSignals.containers,
        vehicles: operationSignals.vehicles,
        personnel: operationSignals.personnel,
        districts: operationSignals.districts,
        overall: operationSignals.overall,
      },
      resourceFatigueSummaryLine:
        fatigueSummary?.primaryState?.summary ?? fatigueSummary?.warnings?.[0],
    });
    const presenceModel = buildOperationalResourcePresenceLiteModel(presenceInput);
    return buildOperationalResourcePresenceHubPresentation(presenceModel, [
      fatigueSummary?.primaryState?.summary ?? fatigueSummary?.warnings?.[0] ?? '',
    ]);
  }, [
    fatigueSummary?.primaryState?.summary,
    fatigueSummary?.warnings,
    gameState.city.day,
    deriveMainOperationAccessMode(gameState, monetization),
    operationalResources,
    operationSignals,
  ]);

  if (!model.visible) {
    return null;
  }

  const showCta = model.showDetailCta;

  return (
    <>
      <View style={[styles.wrap, model.compact && styles.wrapCompact]}>
        <LinearGradient
          colors={['#F4FBF8', '#FFFCF7', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, hubPremiumShadowCard(), model.compact && styles.cardCompact]}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {model.title}
            </Text>
            {!model.compact ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {model.subtitle}
              </Text>
            ) : null}
          </View>
          {presencePresentation ? (
            <View style={[styles.row, { backgroundColor: TONE_COLORS.neutral.bg }]}>
              <Text style={[styles.presenceSummary, { color: TONE_COLORS.neutral.text }]} numberOfLines={2}>
                {presencePresentation.summaryLine}
              </Text>
            </View>
          ) : null}
          {presencePresentation?.secondaryLine && !model.compact ? (
            <View style={[styles.row, { backgroundColor: TONE_COLORS.positive.bg }]}>
              <Text style={[styles.presenceSummary, { color: TONE_COLORS.positive.text }]} numberOfLines={2}>
                {presencePresentation.secondaryLine}
              </Text>
            </View>
          ) : null}
          {!presencePresentation
            ? model.rows.map((row) => {
                const palette = TONE_COLORS[row.tone];
                return (
                  <View
                    key={row.key}
                    style={[styles.row, { backgroundColor: palette.bg }]}>
                    <Text style={[styles.rowLabel, { color: palette.text }]} numberOfLines={1}>
                      {row.label}
                    </Text>
                    <Text style={[styles.rowValue, { color: palette.text }]} numberOfLines={1}>
                      {row.value}
                    </Text>
                  </View>
                );
              })
            : null}
          {gameState.city.day >= 3 ? (
            <ResourceFatigueSummaryStrip
              summary={fatigueSummary}
              compact={model.compact}
              maxItems={model.compact ? 1 : 2}
            />
          ) : null}
          {showCta ? (
            <Pressable
              style={({ pressed }) => [
                styles.cta,
                getPressFeedbackStyle({ pressed }),
              ]}
              onPress={() => {
                const base = buildCommonAnalyticsBase(gameState, 'hub', monetization);
                trackCreviaEvent('operational_resources_detail_opened', base, {
                  ...buildResourceAnalyticsPayload(operationalResources),
                  source: 'hub_resources_cta',
                });
                setDetailOpen(true);
              }}
              accessibilityRole="button"
              accessibilityLabel={model.detailCtaLabel}>
              <Text style={styles.ctaText} numberOfLines={1}>
                {model.detailCtaLabel}
              </Text>
            </Pressable>
          ) : null}
        </LinearGradient>
      </View>
      {showCta ? (
        <OperationalResourcesDetailSheet
          visible={detailOpen}
          onClose={() => setDetailOpen(false)}
          defaultTabOverride={presencePresentation?.defaultTab}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    minWidth: 0,
  },
  wrapCompact: {
    paddingHorizontal: spacing.sm,
  },
  card: {
    borderRadius: HUB_PREMIUM_RADIUS.card,
    padding: spacing.md,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.12)',
    minWidth: 0,
  },
  cardCompact: {
    padding: spacing.sm,
    gap: 4,
  },
  header: {
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: HUB_PREMIUM_COLORS.tealDark,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 11,
    color: HUB_PREMIUM_COLORS.textMuted,
    flexShrink: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 0,
  },
  rowLabel: {
    fontSize: 11,
    fontWeight: '700',
    width: 72,
    flexShrink: 0,
  },
  rowValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
    minWidth: 0,
  },
  presenceSummary: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
    minWidth: 0,
  },
  cta: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: HUB_PREMIUM_COLORS.tealDark,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 0,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
});
