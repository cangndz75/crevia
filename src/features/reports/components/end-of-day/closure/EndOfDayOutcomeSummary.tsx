import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { ClosureOutcomeChip } from '@/features/reports/presentation/closure/endOfDayReportClosurePresentation';
import { gameUi } from '@/ui/theme/gameUiTokens';
import { spacing } from '@/ui/theme/spacing';

const CHIP_TONES = {
  positive: { bg: '#E6F6EA', border: 'rgba(62,158,106,0.2)', text: gameUi.colors.mintPositive },
  neutral: { bg: gameUi.colors.cardMintTint, border: gameUi.colors.borderSoft, text: gameUi.colors.primaryTealDark },
  warning: { bg: gameUi.colors.cardWarmTint, border: 'rgba(199,137,37,0.22)', text: gameUi.colors.amberCaution },
  teal: { bg: '#DDF5EE', border: 'rgba(13,113,104,0.16)', text: '#0F8F86' },
};

type Props = {
  chips: ClosureOutcomeChip[];
  reducedMotion?: boolean;
  indexOffset?: number;
};

export function EndOfDayOutcomeSummary({ chips, reducedMotion, indexOffset = 0 }: Props) {
  if (chips.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>Günün özeti</Text>
      <View style={styles.chipRow}>
        {chips.map((chip, index) => {
          const tone = CHIP_TONES[chip.tone];
          const entering = reducedMotion
            ? undefined
            : FadeInUp.delay(60 + (indexOffset + index) * 40)
                .duration(240)
                .springify()
                .damping(24);

          return (
            <Animated.View
              key={chip.key}
              entering={entering}
              style={[styles.chip, { backgroundColor: tone.bg, borderColor: tone.border }]}>
              <Text style={[styles.chipLabel, { color: tone.text }]} numberOfLines={1}>
                {chip.label}
              </Text>
              {chip.value ? (
                <Text style={[styles.chipValue, { color: tone.text }]} numberOfLines={1}>
                  {chip.value}
                </Text>
              ) : null}
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, minWidth: 0 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: gameUi.colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 72,
    gap: 2,
  },
  chipLabel: { fontSize: 11, fontWeight: '700' },
  chipValue: { fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
});
