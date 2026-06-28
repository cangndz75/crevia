import { StyleSheet, Text, View } from 'react-native';

import type { ReportReplayMemoryEmptyState } from '@/features/reports/presentation/memory/reportReplayMemoryTypes';
import { gameUi } from '@/ui/theme/gameUiTokens';
import { shadows } from '@/ui/theme/shadows';

type Props = {
  model: ReportReplayMemoryEmptyState;
};

export function ReportReplayMemoryEmptyState({ model }: Props) {
  if (!model.visible) return null;

  return (
    <View style={[styles.card, shadows.card]}>
      <Text style={styles.title} numberOfLines={2}>
        {model.title}
      </Text>
      <Text style={styles.body} numberOfLines={2}>
        {model.body}
      </Text>
      <View style={styles.ctaPill}>
        <Text style={styles.ctaText} numberOfLines={1}>
          {model.ctaLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: gameUi.colors.cardMintTint,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(13,113,104,0.14)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: gameUi.colors.textPrimary,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: gameUi.colors.textMuted,
  },
  ctaPill: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(13,113,104,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ctaText: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '800',
    color: gameUi.colors.primaryTealMid,
  },
});
