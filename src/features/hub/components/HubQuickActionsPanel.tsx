import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import {
  formatHubQuickActionBanner,
  getHubQuickActionResultToneStyle,
  selectHubQuickActionCards,
  type HubQuickActionId,
  type HubQuickActionResult,
} from '@/core/hubQuickActions';
import { HubQuickActionCard } from '@/features/hub/components/HubQuickActionCard';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

export function HubQuickActionsPanel() {
  const { cards, performHubQuickAction, lastResult } = useGameStore(
    useShallow((s) => ({
      cards: selectHubQuickActionCards({
        hubQuickActionState: s.hubQuickActionState,
        currentDay: s.gameState.city.day,
        day1Disabled: s.gameState.city.day <= 1,
      }),
      performHubQuickAction: s.performHubQuickAction,
      lastResult: s.hubQuickActionState.lastResult,
    })),
  );

  const onPress = useCallback(
    (actionId: HubQuickActionId) => {
      performHubQuickAction(actionId);
    },
    [performHubQuickAction],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Hızlı Aksiyonlar</Text>
        <Text style={styles.subheader}>Bugünün operasyon zeminini hazırla.</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        style={styles.scroll}>
        {cards.map((card) => (
          <HubQuickActionCard
            key={card.id}
            card={card}
            onPress={() => onPress(card.id)}
          />
        ))}
      </ScrollView>

      {lastResult ? <ResultBanner result={lastResult} /> : null}
    </View>
  );
}

function ResultBanner({ result }: { result: HubQuickActionResult }) {
  const tone = getHubQuickActionResultToneStyle(result.tone);
  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: tone.bg, borderColor: tone.border },
      ]}>
      <Text style={[styles.bannerText, { color: tone.text }]} numberOfLines={2}>
        {formatHubQuickActionBanner(result)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    paddingHorizontal: spacing.lg,
  },
  header: {
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subheader: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  scroll: {
    marginHorizontal: -spacing.lg,
  },
  row: {
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  banner: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bannerText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});
