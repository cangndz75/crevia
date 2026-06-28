import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { ReportReplayTradeoffHistory } from '@/features/reports/presentation/memory/reportReplayMemoryTypes';
import { gameUi } from '@/ui/theme/gameUiTokens';
import { shadows } from '@/ui/theme/shadows';

type Props = {
  model: ReportReplayTradeoffHistory;
  reducedMotion?: boolean;
};

export function ReportReplayTradeoffHistoryStrip({ model, reducedMotion }: Props) {
  if (!model.visible) return null;

  const entering = reducedMotion ? undefined : FadeInUp.delay(160).duration(260).springify().damping(24);
  const meterWidth = `${Math.round(model.balanceRatio * 100)}%` as `${number}%`;

  return (
    <Animated.View entering={entering} style={[styles.card, shadows.card]}>
      <Text style={styles.title}>Kayıp / kazanç geçmişi</Text>
      <Text style={styles.balanceLabel}>{model.balanceLabel}</Text>
      <View style={styles.columns}>
        <View style={styles.column}>
          {model.gains.map((item) => (
            <Text key={item.key} style={styles.gainText} numberOfLines={1}>
              {item.label}
            </Text>
          ))}
        </View>
        <View style={styles.divider} />
        <View style={styles.column}>
          {model.costs.map((item) => (
            <Text key={item.key} style={styles.costText} numberOfLines={1}>
              {item.label}
            </Text>
          ))}
        </View>
      </View>
      <View style={styles.meterTrack}>
        <View style={[styles.meterFill, { width: meterWidth }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: gameUi.colors.cardWhite,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: gameUi.colors.borderSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
    color: gameUi.colors.textPrimary,
  },
  balanceLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: gameUi.colors.textMuted,
  },
  columns: {
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
  column: { flex: 1, gap: 4, minWidth: 0 },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: gameUi.colors.borderSoft,
    marginVertical: 2,
  },
  gainText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: gameUi.colors.mintPositive,
  },
  costText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: gameUi.colors.amberCaution,
  },
  meterTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(199,137,37,0.15)',
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: gameUi.colors.mintPositive,
  },
});
