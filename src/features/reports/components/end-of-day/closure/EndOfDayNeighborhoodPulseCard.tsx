import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { EndOfDayNeighborhoodPulsePresentation } from '@/features/reports/presentation/closure/endOfDayNeighborhoodPulsePresentation';
import { gameUi } from '@/ui/theme/gameUiTokens';
import { spacing } from '@/ui/theme/spacing';
import { shadows } from '@/ui/theme/shadows';

const CHIP_TONES = {
  positive: { bg: '#E6F6EA', text: gameUi.colors.mintPositive },
  neutral: { bg: gameUi.colors.cardMintTint, text: gameUi.colors.primaryTealDark },
  warning: { bg: gameUi.colors.cardWarmTint, text: gameUi.colors.amberCaution },
};

type Props = {
  model: EndOfDayNeighborhoodPulsePresentation;
  reducedMotion?: boolean;
};

export function EndOfDayNeighborhoodPulseCard({ model, reducedMotion }: Props) {
  if (!model.visible) return null;

  const entering = reducedMotion ? undefined : FadeInUp.delay(160).duration(260).springify().damping(24);

  return (
    <Animated.View entering={entering} style={[styles.card, shadows.card]}>
      <View style={styles.header}>
        <Ionicons name="pulse-outline" size={16} color={gameUi.colors.primaryTealDark} />
        <Text style={styles.title}>Mahalle / şehir tepkisi</Text>
      </View>
      <Text style={styles.headline} numberOfLines={3}>
        {model.headline}
      </Text>
      <View style={styles.chips}>
        {model.chips.map((chip) => {
          const tone = CHIP_TONES[chip.tone];
          return (
            <View key={chip.key} style={[styles.chip, { backgroundColor: tone.bg }]}>
              <Text style={[styles.chipText, { color: tone.text }]} numberOfLines={1}>
                {chip.label}
              </Text>
            </View>
          );
        })}
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 15, fontWeight: '800', color: gameUi.colors.textPrimary },
  headline: { fontSize: 14, lineHeight: 21, fontWeight: '600', color: gameUi.colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  chipText: { fontSize: 11, fontWeight: '700' },
});
