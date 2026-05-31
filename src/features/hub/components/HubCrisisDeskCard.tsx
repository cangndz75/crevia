import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { buildCrisisDeskHubModel } from '@/core/crisis';
import {
  buildCrisisActionPresentationInputFromStore,
  buildCrisisActionHubModel,
} from '@/core/crisisActions/crisisActionPresentation';
import {
  HUB_PREMIUM_RADIUS,
  hubPremiumShadowCard,
} from '@/features/hub/utils/hubPremiumPresentation';
import { useGameStore } from '@/store/useGameStore';
import { spacing } from '@/ui/theme/spacing';

type HubCrisisDeskCardProps = {
  compact?: boolean;
};

const TONE = {
  positive: { bg: 'rgba(15, 143, 134, 0.12)', text: '#0F8F86', pill: '#E4F6EC' },
  neutral: { bg: 'rgba(100, 130, 125, 0.1)', text: '#5E726E', pill: '#EEF2F1' },
  warning: { bg: 'rgba(245, 230, 200, 0.55)', text: '#9A6B12', pill: '#FFF6E8' },
  critical: { bg: 'rgba(232, 180, 120, 0.35)', text: '#8B5A14', pill: '#FFEDD5' },
} as const;

export function HubCrisisDeskCard({ compact = false }: HubCrisisDeskCardProps) {
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const crisisState = useGameStore((s) => s.crisisState);
  const crisisActionState = useGameStore((s) => s.crisisActionState);
  const operationSignals = useGameStore((s) => s.operationSignals);

  const model = useMemo(
    () =>
      buildCrisisDeskHubModel(gameState, monetization, crisisState, {
        compact,
      }),
    [gameState, monetization, crisisState, compact],
  );

  const crisisActionHint = useMemo(() => {
    const input = buildCrisisActionPresentationInputFromStore({
      gameState,
      monetization,
      crisisState,
      operationSignals,
      crisisActionState,
    });
    const actionModel = buildCrisisActionHubModel(input, { compact });
    if (!actionModel?.visible) return undefined;
    if (actionModel.selectedLabel) {
      return 'Bugünkü kriz hamlesi seçildi.';
    }
    return 'Kriz hamlesi hazır';
  }, [
    compact,
    crisisActionState,
    crisisState,
    gameState,
    monetization,
    operationSignals,
  ]);

  if (!model?.visible) {
    return null;
  }

  const toneKey =
    model.riskLabel.includes('Kriz') || model.riskLabel.includes('kritik')
      ? 'critical'
      : model.riskLabel.includes('yaklaşıyor')
        ? 'warning'
        : model.riskLabel.includes('İzlemede')
          ? 'neutral'
          : 'positive';
  const palette = TONE[toneKey];

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <LinearGradient
        colors={['#FFFAF3', '#F7FBF8', '#F5F0E6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, hubPremiumShadowCard()]}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>
              {model.title}
            </Text>
            <Text style={[styles.subtitle, { color: palette.text }]} numberOfLines={1}>
              {model.subtitle}
            </Text>
          </View>
          <View style={[styles.riskPill, { backgroundColor: palette.pill }]}>
            <Text style={[styles.riskPillText, { color: palette.text }]} numberOfLines={1}>
              {model.riskLabel}
            </Text>
          </View>
        </View>

        <Text style={styles.accessLine} numberOfLines={1}>
          {model.accessLabel}
        </Text>
        <Text style={styles.scoreLine} numberOfLines={1}>
          {model.riskScoreLabel}
        </Text>

        {model.activeIncidentTitle ? (
          <View style={styles.incidentBox}>
            <Text style={styles.incidentTitle} numberOfLines={1}>
              {model.activeIncidentTitle}
            </Text>
            <Text style={styles.incidentSummary} numberOfLines={2}>
              {model.activeIncidentSummary}
            </Text>
          </View>
        ) : null}

        {model.signalRows.length > 0 ? (
          <View style={styles.signals}>
            {model.signalRows.map((row) => (
              <View key={row.id} style={styles.signalRow}>
                <Text style={styles.signalTitle} numberOfLines={1}>
                  {row.title}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {crisisActionHint ? (
          <Text style={styles.actionHint} numberOfLines={1}>
            {crisisActionHint}
          </Text>
        ) : null}

        <Text style={styles.footer} numberOfLines={2}>
          {model.footerNote}
        </Text>
      </LinearGradient>
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
    borderColor: 'rgba(214, 162, 60, 0.22)',
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
    color: '#1A4F4A',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  riskPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    maxWidth: '48%',
  },
  riskPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  accessLine: {
    fontSize: 12,
    color: '#5E726E',
  },
  scoreLine: {
    fontSize: 13,
    fontWeight: '600',
    color: '#075E57',
  },
  incidentBox: {
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: 12,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(214, 162, 60, 0.2)',
  },
  incidentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B5A14',
  },
  incidentSummary: {
    fontSize: 12,
    color: '#5E726E',
    marginTop: 4,
    lineHeight: 17,
  },
  signals: {
    gap: 4,
  },
  signalRow: {
    paddingVertical: 2,
  },
  signalTitle: {
    fontSize: 12,
    color: '#1D2939',
  },
  actionHint: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9A6B12',
    marginTop: 4,
  },
  footer: {
    fontSize: 11,
    color: '#667085',
    fontStyle: 'italic',
    marginTop: 4,
  },
});
