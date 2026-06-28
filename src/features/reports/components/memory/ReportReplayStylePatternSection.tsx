import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { ReportReplayStylePattern } from '@/features/reports/presentation/memory/reportReplayMemoryTypes';
import { gameUi } from '@/ui/theme/gameUiTokens';
import { shadows } from '@/ui/theme/shadows';

type Props = {
  model: ReportReplayStylePattern;
  reducedMotion?: boolean;
};

export function ReportReplayStylePatternSection({ model, reducedMotion }: Props) {
  if (!model.visible) return null;

  const entering = reducedMotion ? undefined : FadeInUp.delay(180).duration(260).springify().damping(24);

  return (
    <Animated.View entering={entering} style={[styles.card, shadows.card]}>
      <Text style={styles.title}>Yönetim tarzı hafızası</Text>
      <Text style={styles.mainLine} numberOfLines={2}>
        {model.mainLine}
      </Text>
      <View style={styles.chipRow}>
        {model.styleChips.map((chip) => (
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
  mainLine: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: gameUi.colors.textMuted,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    borderRadius: 999,
    backgroundColor: gameUi.colors.cardMintTint,
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
