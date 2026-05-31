import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  buildMainOperationHubModel,
  buildMainOperationSeasonDetailModel,
  type MainOperationPresentationExtras,
} from '@/core/mainOperation';
import {
  HUB_PREMIUM_COLORS,
  HUB_PREMIUM_RADIUS,
  hubPremiumShadowCard,
} from '@/features/hub/utils/hubPremiumPresentation';
import { MainOperationSeasonGoalDetailSheet } from '@/features/hub/components/MainOperationSeasonGoalDetailSheet';
import { useGameStore } from '@/store/useGameStore';
import { spacing } from '@/ui/theme/spacing';

type HubMainOperationSeasonCardProps = {
  compact?: boolean;
};

const TONE_DOT = {
  positive: '#0F8F86',
  neutral: '#8AA8A3',
  warning: '#C9922E',
  critical: '#C45C4A',
} as const;

function rowIcon(key: string): keyof typeof Ionicons.glyphMap {
  switch (key) {
    case 'pulse':
      return 'pulse';
    case 'location':
      return 'location';
    case 'car':
      return 'car';
    case 'people':
      return 'people';
    default:
      return 'flag';
  }
}

export function HubMainOperationSeasonCard({
  compact = false,
}: HubMainOperationSeasonCardProps) {
  const router = useRouter();
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const mainOperationSeason = useGameStore((s) => s.mainOperationSeason);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const assignments = useGameStore((s) => s.assignments);
  const crisisState = useGameStore((s) => s.crisisState);
  const dailyOperationsPlan = useGameStore((s) => s.dailyOperationsPlan);
  const microDecisionState = useGameStore((s) => s.microDecisionState);
  const [detailOpen, setDetailOpen] = useState(false);

  const extras: MainOperationPresentationExtras = useMemo(
    () => ({
      operationSignals,
      assignments,
      crisisState,
      dailyOperationsPlan,
      microDecisionState,
    }),
    [
      operationSignals,
      assignments,
      crisisState,
      dailyOperationsPlan,
      microDecisionState,
    ],
  );

  const model = useMemo(
    () =>
      buildMainOperationHubModel(gameState, monetization, mainOperationSeason, {
        compact,
        extras,
      }),
    [gameState, monetization, mainOperationSeason, compact, extras],
  );

  const detailModel = useMemo(
    () =>
      model.showGoalsDetailCta
        ? buildMainOperationSeasonDetailModel({
            gameState,
            monetization,
            mainOperationSeason,
            ...extras,
          })
        : undefined,
    [
      model.showGoalsDetailCta,
      gameState,
      monetization,
      mainOperationSeason,
      extras,
    ],
  );

  if (!model.visible) {
    return null;
  }

  const handleLimitedCta = () => {
    router.push('/post-pilot-offer');
  };

  const handleGoalsCta = () => {
    if (model.showGoalsDetailCta && detailModel) {
      setDetailOpen(true);
      return;
    }
    if (!model.isFullAccess) {
      handleLimitedCta();
    }
  };

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <LinearGradient
        colors={['#F7FBF8', '#EEF8F3', '#F5F0E6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, hubPremiumShadowCard()]}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>
              {model.title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {model.subtitle}
            </Text>
          </View>
          <View style={styles.accessPill}>
            <Text style={styles.accessPillText} numberOfLines={1}>
              {model.accessLabel}
            </Text>
          </View>
        </View>

        <Text style={styles.seasonLine} numberOfLines={1}>
          {model.seasonProgressLabel}
        </Text>

        {model.isFullAccess && model.topInsightLine ? (
          <Text style={styles.insightLine} numberOfLines={2}>
            {model.topInsightLine}
          </Text>
        ) : null}

        {!model.isFullAccess ? (
          <Text style={styles.districtLine} numberOfLines={2}>
            {model.activeDistrictLine}
          </Text>
        ) : null}

        {model.goalRows.length > 0 ? (
          <View style={styles.goals}>
            {model.goalRows.map((row) => (
              <View key={row.id} style={styles.goalRow}>
                <Ionicons
                  name={rowIcon(row.iconKey)}
                  size={16}
                  color={HUB_PREMIUM_COLORS.tealDark}
                  style={styles.goalIcon}
                />
                <View style={styles.goalMain}>
                  <View style={styles.goalTitleRow}>
                    <Text style={styles.goalTitle} numberOfLines={1}>
                      {row.title}
                    </Text>
                    <View
                      style={[
                        styles.toneDot,
                        {
                          backgroundColor:
                            TONE_DOT[row.tone] ?? TONE_DOT.neutral,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.round(row.progressRatio * 100)}%`,
                          backgroundColor:
                            TONE_DOT[row.tone] ?? TONE_DOT.neutral,
                        },
                      ]}
                    />
                  </View>
                </View>
                <Text style={styles.goalProgress} numberOfLines={1}>
                  {row.progressLabel}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.footer} numberOfLines={2}>
          {model.footerNote}
        </Text>

        {model.ctaLabel ? (
          <Pressable
            accessibilityRole="button"
            onPress={handleGoalsCta}
            style={({ pressed }) => [
              styles.cta,
              pressed && styles.ctaPressed,
            ]}>
            <Text style={styles.ctaText} numberOfLines={1}>
              {model.ctaLabel}
            </Text>
          </Pressable>
        ) : null}
      </LinearGradient>

      <MainOperationSeasonGoalDetailSheet
        visible={detailOpen}
        model={detailModel}
        onClose={() => setDetailOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  wrapCompact: {
    marginBottom: spacing.xs,
  },
  card: {
    borderRadius: HUB_PREMIUM_RADIUS.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.12)',
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: HUB_PREMIUM_COLORS.tealDark,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: HUB_PREMIUM_COLORS.textMuted,
    marginTop: 2,
  },
  accessPill: {
    backgroundColor: 'rgba(15, 143, 134, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    maxWidth: '46%',
  },
  accessPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F8F86',
  },
  seasonLine: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A4F4A',
  },
  insightLine: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A6B64',
    lineHeight: 18,
  },
  districtLine: {
    fontSize: 13,
    color: HUB_PREMIUM_COLORS.textMuted,
    lineHeight: 18,
  },
  goals: {
    gap: 8,
    marginTop: 4,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalIcon: {
    flexShrink: 0,
  },
  goalMain: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  goalTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: HUB_PREMIUM_COLORS.tealDark,
  },
  toneDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    flexShrink: 0,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(15, 143, 134, 0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  goalProgress: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F8F86',
    flexShrink: 0,
    minWidth: 36,
    textAlign: 'right',
  },
  footer: {
    fontSize: 12,
    color: HUB_PREMIUM_COLORS.textMuted,
    marginTop: 4,
  },
  cta: {
    marginTop: spacing.sm,
    backgroundColor: '#0D3B37',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaPressed: {
    opacity: 0.9,
  },
  ctaText: {
    color: '#F7FBF8',
    fontSize: 14,
    fontWeight: '600',
  },
});
