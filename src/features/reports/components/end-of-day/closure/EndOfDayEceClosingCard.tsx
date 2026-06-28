import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { EndOfDayEceClosingPresentation } from '@/features/reports/presentation/closure/endOfDayReportClosurePresentation';
import { gameUi } from '@/ui/theme/gameUiTokens';
import { spacing } from '@/ui/theme/spacing';

type Props = {
  model: EndOfDayEceClosingPresentation;
  reducedMotion?: boolean;
};

export function EndOfDayEceClosingCard({ model, reducedMotion }: Props) {
  if (!model.visible || !model.line) return null;

  const entering = reducedMotion ? undefined : FadeInUp.delay(280).duration(240).springify().damping(24);

  return (
    <Animated.View entering={entering} style={styles.card}>
      <View style={styles.avatar}>
        <Ionicons name="sparkles-outline" size={14} color={gameUi.colors.primaryTealDark} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>Ece</Text>
        <Text style={styles.line} numberOfLines={3}>
          {model.line}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 10,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: gameUi.colors.cardWhite,
    borderWidth: 1,
    borderColor: gameUi.colors.borderSoft,
    minWidth: 0,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: gameUi.colors.cardMintTint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copy: { flex: 1, gap: 2, minWidth: 0 },
  label: { fontSize: 11, fontWeight: '800', color: gameUi.colors.primaryTealDark },
  line: { fontSize: 13, lineHeight: 19, fontWeight: '600', color: gameUi.colors.textMuted },
});
