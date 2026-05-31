import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  buildFirstTenMinutesGuidanceModel,
  DAY1_GUIDANCE_COPY,
  resolveFirstTenMinutesDay,
} from '@/core/onboarding/firstTenMinutesPresentation';
import {
  HUB_PREMIUM_COLORS,
  HUB_PREMIUM_RADIUS,
  hubPremiumShadowCard,
} from '@/features/hub/utils/hubPremiumPresentation';
import { useGameStore } from '@/store/useGameStore';
import { spacing } from '@/ui/theme/spacing';

export function HubFirstTenMinutesGuideCard() {
  const gameState = useGameStore((s) => s.gameState);
  const decisionHistory = useGameStore((s) => s.decisionHistory);

  const model = useMemo(() => {
    const day = resolveFirstTenMinutesDay(gameState);
    return buildFirstTenMinutesGuidanceModel({
      gameState,
      hasDecisionToday: decisionHistory.some((r) => r.day === day),
    });
  }, [gameState, decisionHistory]);

  if (resolveFirstTenMinutesDay(gameState) > 1 || !model.title) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#FFF6E8', '#F4FBF8', '#FFFCF7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, hubPremiumShadowCard()]}>
        <Text style={styles.title} numberOfLines={1}>
          {model.title}
        </Text>
        <Text style={styles.summary} numberOfLines={2}>
          {DAY1_GUIDANCE_COPY.guideCardLine}
        </Text>
        <Text style={styles.instruction} numberOfLines={2}>
          {model.primaryInstruction}
        </Text>
        {model.secondaryNote ? (
          <Text style={styles.note} numberOfLines={2}>
            {model.secondaryNote}
          </Text>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    minWidth: 0,
  },
  card: {
    borderRadius: HUB_PREMIUM_RADIUS.cardLg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(214, 162, 60, 0.28)',
    gap: 6,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: HUB_PREMIUM_COLORS.textDark,
  },
  summary: {
    fontSize: 13,
    color: HUB_PREMIUM_COLORS.textMuted,
    lineHeight: 18,
  },
  instruction: {
    fontSize: 13,
    fontWeight: '600',
    color: HUB_PREMIUM_COLORS.teal,
    lineHeight: 18,
  },
  note: {
    fontSize: 11,
    color: HUB_PREMIUM_COLORS.textMuted,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});
