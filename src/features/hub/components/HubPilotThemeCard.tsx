import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import {
  buildPilotThemeHubCardModel,
  shouldShowPilotThemeOnHub,
} from '@/core/pilotRhythm';
import {
  HUB_PREMIUM_COLORS,
  HUB_PREMIUM_RADIUS,
  hubPremiumShadowCard,
} from '@/features/hub/utils/hubPremiumPresentation';
import { useGameStore } from '@/store/useGameStore';
import { spacing } from '@/ui/theme/spacing';

export function HubPilotThemeCard() {
  const day = useGameStore((s) => s.gameState.city.day);

  const model = useMemo(() => {
    if (!shouldShowPilotThemeOnHub(day)) {
      return null;
    }
    return buildPilotThemeHubCardModel(day);
  }, [day]);

  if (!model) {
    return null;
  }

  const isFinal = model.visibility === 'final';
  const isCompact = model.visibility === 'compact';
  const showTags = !isCompact && model.emphasisTags.length > 0;

  return (
    <Animated.View
      entering={FadeInUp.duration(280).springify().damping(22)}
      style={styles.wrap}>
      <LinearGradient
        colors={
          isFinal
            ? ['#E8F7F4', '#FFF9EA', '#FFFDF7']
            : ['#F0FAF8', '#FFFCF7', '#FFFFFF']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, hubPremiumShadowCard(), isFinal && styles.cardFinal]}>
        <Text style={[styles.headline, isFinal && styles.headlineFinal]} numberOfLines={1}>
          {model.headline}
        </Text>
        <Text style={styles.summary} numberOfLines={2} ellipsizeMode="tail">
          {model.summary}
        </Text>
        {showTags ? (
          <View style={styles.tagRow}>
            {model.emphasisTags.slice(0, 2).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText} numberOfLines={1}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
  },
  card: {
    borderRadius: HUB_PREMIUM_RADIUS.card,
    borderWidth: 1,
    borderColor: HUB_PREMIUM_COLORS.borderSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: 4,
    minWidth: 0,
  },
  cardFinal: {
    borderColor: HUB_PREMIUM_COLORS.borderGold,
  },
  headline: {
    fontSize: 13,
    fontWeight: '700',
    color: HUB_PREMIUM_COLORS.tealDark,
    flexShrink: 1,
  },
  headlineFinal: {
    color: HUB_PREMIUM_COLORS.teal,
  },
  summary: {
    fontSize: 12,
    lineHeight: 17,
    color: HUB_PREMIUM_COLORS.textMuted,
    flexShrink: 1,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tag: {
    backgroundColor: 'rgba(15, 143, 134, 0.1)',
    borderRadius: HUB_PREMIUM_RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: '48%',
    minWidth: 0,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: HUB_PREMIUM_COLORS.teal,
    flexShrink: 1,
  },
});
