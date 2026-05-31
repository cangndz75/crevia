import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  buildOperationSignalsEngineInput,
  buildOperationSignalsHubModel,
} from '@/core/operations';
import {
  HUB_PREMIUM_COLORS,
  HUB_PREMIUM_RADIUS,
  hubPremiumShadowCard,
} from '@/features/hub/utils/hubPremiumPresentation';
import { selectIsDay1TutorialEligible } from '@/features/tutorial/tutorialSelectors';
import { useGameStore } from '@/store/useGameStore';
import { spacing } from '@/ui/theme/spacing';

type HubOperationSignalsCardProps = {
  compact?: boolean;
};

const TONE_COLORS = {
  positive: { bg: 'rgba(15, 143, 134, 0.12)', text: '#0F8F86' },
  neutral: { bg: 'rgba(100, 130, 125, 0.12)', text: '#5E726E' },
  warning: { bg: 'rgba(214, 162, 60, 0.18)', text: '#B8860B' },
  critical: { bg: 'rgba(200, 90, 70, 0.15)', text: '#C45A46' },
} as const;

function rowIcon(name: string): keyof typeof Ionicons.glyphMap {
  switch (name) {
    case 'people':
      return 'people-outline';
    case 'car':
      return 'car-outline';
    case 'trash':
      return 'trash-outline';
    case 'location':
      return 'location-outline';
    default:
      return 'pulse-outline';
  }
}

export function HubOperationSignalsCard({
  compact = false,
}: HubOperationSignalsCardProps) {
  const gameState = useGameStore((s) => s.gameState);
  const personnelState = useGameStore((s) => s.personnelState);
  const vehicleState = useGameStore((s) => s.vehicleState);
  const containerState = useGameStore((s) => s.containerState);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const decisionHistory = useGameStore((s) => s.decisionHistory);
  const isDay1 = useGameStore(selectIsDay1TutorialEligible);

  const model = useMemo(() => {
    const engineInput = buildOperationSignalsEngineInput({
      gameState,
      personnelState,
      vehicleState,
      containerState,
      decisionHistory,
      operationSignals,
      isDay1Tutorial: isDay1,
    });
    return buildOperationSignalsHubModel({
      engineInput,
      compact: compact || isDay1,
    });
  }, [
    gameState,
    personnelState,
    vehicleState,
    containerState,
    operationSignals,
    decisionHistory,
    isDay1,
    compact,
  ]);

  const overallTone = TONE_COLORS[model.overallTone];

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <LinearGradient
        colors={['#F8FCFA', '#FFFFFF', '#F5FAF8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, hubPremiumShadowCard()]}>
        <View style={styles.headerRow}>
          <View style={styles.titleCol}>
            <Text style={styles.title} numberOfLines={1}>
              {model.title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {model.subtitle}
            </Text>
          </View>
          <View style={[styles.pill, { backgroundColor: overallTone.bg }]}>
            <Text style={[styles.pillText, { color: overallTone.text }]} numberOfLines={1}>
              {model.overallLabel}
            </Text>
          </View>
        </View>

        <Text style={styles.priorityLine} numberOfLines={1}>
          {model.priorityLine}
        </Text>

        <View style={styles.rows}>
          {model.rows.map((row) => {
            const tone = TONE_COLORS[row.tone];
            return (
              <View key={row.key} style={styles.row}>
                <View style={[styles.iconWrap, { backgroundColor: tone.bg }]}>
                  <Ionicons
                    name={rowIcon(row.iconKey)}
                    size={14}
                    color={tone.text}
                  />
                </View>
                <View style={styles.rowText}>
                  <View style={styles.rowTop}>
                    <Text style={styles.rowLabel} numberOfLines={1}>
                      {row.label}
                    </Text>
                    <Text style={[styles.rowValue, { color: tone.text }]} numberOfLines={1}>
                      {row.value}
                    </Text>
                  </View>
                  <Text style={styles.rowSummary} numberOfLines={1}>
                    {row.summary}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

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
    minWidth: 0,
  },
  wrapCompact: {
    paddingHorizontal: spacing.sm,
  },
  card: {
    borderRadius: HUB_PREMIUM_RADIUS.card,
    padding: spacing.sm + 2,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.1)',
    minWidth: 0,
    maxHeight: 210,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: 0,
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: HUB_PREMIUM_COLORS.tealDark,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 11,
    color: '#6B7F7B',
    flexShrink: 1,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: '42%',
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    flexShrink: 1,
  },
  priorityLine: {
    fontSize: 11,
    color: '#5E726E',
    flexShrink: 1,
  },
  rows: {
    gap: 6,
    minWidth: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    minWidth: 0,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2A4541',
    flexShrink: 1,
  },
  rowValue: {
    fontSize: 10,
    fontWeight: '700',
    flexShrink: 0,
  },
  rowSummary: {
    fontSize: 11,
    color: '#5E726E',
    flexShrink: 1,
  },
  footer: {
    fontSize: 10,
    color: '#7A8E8A',
    flexShrink: 1,
    marginTop: 2,
  },
});
