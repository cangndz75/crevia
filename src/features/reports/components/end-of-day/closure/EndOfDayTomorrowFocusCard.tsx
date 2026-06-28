import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { EndOfDayTomorrowFocusPresentation } from '@/features/reports/presentation/closure/endOfDayTomorrowFocusPresentation';
import { gameUi } from '@/ui/theme/gameUiTokens';
import { spacing } from '@/ui/theme/spacing';
import { shadows } from '@/ui/theme/shadows';

const RISK_TONES = {
  low: { bg: '#E6F6EA', text: gameUi.colors.mintPositive },
  medium: { bg: gameUi.colors.cardWarmTint, text: gameUi.colors.amberCaution },
  high: { bg: '#FBECEA', text: '#C45A4A' },
};

type Props = {
  model: EndOfDayTomorrowFocusPresentation;
  reducedMotion?: boolean;
};

export function EndOfDayTomorrowFocusCard({ model, reducedMotion }: Props) {
  if (!model.visible) return null;

  const riskTone = RISK_TONES[model.riskTone];
  const entering = reducedMotion ? undefined : FadeInUp.delay(240).duration(260).springify().damping(24);

  return (
    <Animated.View entering={entering} style={[styles.card, shadows.card]}>
      <View style={styles.header}>
        <Ionicons name="compass-outline" size={16} color={gameUi.colors.primaryTealDark} />
        <Text style={styles.title}>Yarın için odak</Text>
        <View style={[styles.riskTag, { backgroundColor: riskTone.bg }]}>
          <Text style={[styles.riskText, { color: riskTone.text }]} numberOfLines={1}>
            {model.riskTag}
          </Text>
        </View>
      </View>
      <Text style={styles.focusLine} numberOfLines={3}>
        {model.focusLine}
      </Text>
      <Text style={styles.hint} numberOfLines={1}>
        {model.ctaHint}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: gameUi.colors.cardMintTint,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(13,113,104,0.14)',
    padding: spacing.md,
    gap: 8,
    minWidth: 0,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  title: { flex: 1, fontSize: 15, fontWeight: '800', color: gameUi.colors.textPrimary },
  riskTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, maxWidth: '40%' },
  riskText: { fontSize: 10, fontWeight: '800' },
  focusLine: { fontSize: 14, lineHeight: 21, fontWeight: '600', color: gameUi.colors.textPrimary },
  hint: { fontSize: 12, fontWeight: '600', color: gameUi.colors.textMuted },
});
