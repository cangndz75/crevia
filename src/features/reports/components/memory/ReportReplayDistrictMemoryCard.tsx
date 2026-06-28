import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { ReportReplayDistrictMemory } from '@/features/reports/presentation/memory/reportReplayMemoryTypes';
import { gameUi } from '@/ui/theme/gameUiTokens';
import { shadows } from '@/ui/theme/shadows';

type Props = {
  model: ReportReplayDistrictMemory;
  reducedMotion?: boolean;
};

const TREND_ICON = {
  up: 'trending-up' as const,
  down: 'trending-down' as const,
  flat: 'remove-outline' as const,
};

export function ReportReplayDistrictMemoryCard({ model, reducedMotion }: Props) {
  if (!model.visible) return null;

  const entering = reducedMotion ? undefined : FadeInUp.delay(200).duration(260).springify().damping(24);

  return (
    <Animated.View entering={entering} style={[styles.card, shadows.card]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mahalle hafızası</Text>
        <Ionicons name={TREND_ICON[model.trendDirection]} size={14} color={gameUi.colors.textMuted} />
      </View>
      <Text style={styles.signal} numberOfLines={2}>
        {model.signalLine}
      </Text>
      <View style={styles.chipRow}>
        {model.chips.map((chip) => (
          <View key={chip.key} style={styles.chip}>
            <Text style={styles.chipText} numberOfLines={1}>
              {chip.label}
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: gameUi.colors.cardMintTint,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(13,113,104,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
    color: gameUi.colors.textPrimary,
  },
  signal: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: gameUi.colors.textPrimary,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    borderRadius: 999,
    backgroundColor: gameUi.colors.cardWhite,
    borderWidth: 1,
    borderColor: gameUi.colors.borderSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    color: gameUi.colors.primaryTealMid,
  },
});
