import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { ReportReplayTodayBridge } from '@/features/reports/presentation/memory/reportReplayMemoryTypes';
import { gameUi } from '@/ui/theme/gameUiTokens';

const TONE_COLORS = {
  positive: gameUi.colors.mintPositive,
  warning: gameUi.colors.amberCaution,
  teal: gameUi.colors.primaryTealMid,
  neutral: gameUi.colors.textMuted,
  mixed: '#327EA8',
};

type Props = {
  model: ReportReplayTodayBridge;
  reducedMotion?: boolean;
};

export function ReportReplayTodayBridgeCard({ model, reducedMotion }: Props) {
  if (!model.visible) return null;

  const entering = reducedMotion ? undefined : FadeInUp.delay(120).duration(260).springify().damping(24);
  const accent = TONE_COLORS[model.tone] ?? TONE_COLORS.teal;

  return (
    <Animated.View entering={entering} style={styles.card}>
      <Ionicons name="arrow-forward-circle-outline" size={16} color={accent} />
      <View style={styles.copy}>
        <Text style={styles.label} numberOfLines={1}>
          Bugüne bağlanan sinyal
        </Text>
        <Text style={styles.line} numberOfLines={2}>
          {model.signalLine}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: gameUi.colors.cardMintTint,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(13,113,104,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 0,
  },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  label: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
    color: gameUi.colors.primaryTealMid,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  line: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: gameUi.colors.textPrimary,
  },
});
