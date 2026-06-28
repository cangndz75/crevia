import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { EndOfDayTradeoffBalancePresentation } from '@/features/reports/presentation/closure/endOfDayTradeoffBalancePresentation';
import { gameUi } from '@/ui/theme/gameUiTokens';
import { spacing } from '@/ui/theme/spacing';
import { shadows } from '@/ui/theme/shadows';

type Props = {
  model: EndOfDayTradeoffBalancePresentation;
  reducedMotion?: boolean;
};

export function EndOfDayTradeoffBalanceCard({ model, reducedMotion }: Props) {
  if (!model.visible) return null;

  const entering = reducedMotion ? undefined : FadeInUp.delay(200).duration(260).springify().damping(24);
  const meterWidth = `${Math.round(model.balanceRatio * 100)}%` as `${number}%`;

  return (
    <Animated.View entering={entering} style={[styles.card, shadows.card]}>
      <Text style={styles.title}>Kayıp / kazanç dengesi</Text>
      <Text style={styles.balanceLabel}>{model.balanceLabel}</Text>

      <View style={styles.columns}>
        <View style={styles.column}>
          <Text style={styles.columnTitle}>Kazanım</Text>
          {model.gains.map((item) => (
            <View key={item.key} style={[styles.item, styles.gainItem]}>
              <Text style={styles.gainText} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.divider} />
        <View style={styles.column}>
          <Text style={styles.columnTitle}>Bedel</Text>
          {model.costs.map((item) => (
            <View key={item.key} style={[styles.item, styles.costItem]}>
              <Text style={styles.costText} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
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
    borderRadius: 22,
    borderWidth: 1,
    borderColor: gameUi.colors.borderSoft,
    padding: spacing.md,
    gap: 10,
    minWidth: 0,
  },
  title: { fontSize: 15, fontWeight: '800', color: gameUi.colors.textPrimary },
  balanceLabel: { fontSize: 12, fontWeight: '700', color: gameUi.colors.textMuted },
  columns: { flexDirection: 'row', gap: 10, minWidth: 0 },
  column: { flex: 1, gap: 6, minWidth: 0 },
  columnTitle: { fontSize: 11, fontWeight: '800', color: gameUi.colors.textMuted, textTransform: 'uppercase' },
  divider: { width: 1, backgroundColor: gameUi.colors.borderSoft },
  item: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  gainItem: { backgroundColor: '#E6F6EA' },
  costItem: { backgroundColor: gameUi.colors.cardWarmTint },
  gainText: { fontSize: 12, fontWeight: '700', color: gameUi.colors.mintPositive },
  costText: { fontSize: 12, fontWeight: '700', color: gameUi.colors.amberCaution },
  meterTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: gameUi.colors.cardWarmTint,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: gameUi.colors.mintPositive,
  },
});
