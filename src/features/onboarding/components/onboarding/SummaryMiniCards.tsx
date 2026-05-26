import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { OUTCOME_MINI_CARDS } from '@/features/onboarding/data/onboardingData';
import { onboardingRadii, onboardingTokens } from '@/features/onboarding/theme/onboardingTokens';
import { spacing } from '@/ui/theme/spacing';

const BADGE_TONE = {
  lavender: { bg: 'rgba(169,156,255,0.25)', text: onboardingTokens.primaryDark },
  orange: { bg: 'rgba(255,182,110,0.3)', text: '#C2410C' },
  primary: { bg: 'rgba(98,91,255,0.15)', text: onboardingTokens.primary },
};

export function SummaryMiniCards() {
  return (
    <View style={styles.row}>
      {OUTCOME_MINI_CARDS.map((card, index) => (
        <MiniCard key={card.id} index={index} />
      ))}
    </View>
  );
}

function MiniCard({ index }: { index: number }) {
  const card = OUTCOME_MINI_CARDS[index]!;
  const tone = BADGE_TONE[card.badgeTone];
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (card.id !== 'xp') return;
    pulse.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1,
      true,
    );
  }, [card.id, pulse]);

  const levelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(320 + index * 60).springify()}
      style={styles.card}>
      <View style={styles.top}>
        <Ionicons name={card.icon} size={15} color={tone.text} />
        <View style={[styles.badge, { backgroundColor: tone.bg }]}>
          <Text style={[styles.badgeText, { color: tone.text }]}>{card.badge}</Text>
        </View>
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {card.title}
      </Text>
      <Text style={styles.sub} numberOfLines={1}>
        {card.subtitle}
      </Text>
      {'detail' in card && card.detail ? (
        <Text style={styles.detail}>{card.detail}</Text>
      ) : null}
      {'progress' in card && card.progress != null ? (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${card.progress * 100}%` }]} />
        </View>
      ) : null}
      {'level' in card && card.level != null ? (
        <Animated.View style={[styles.levelCircle, levelStyle]}>
          <Text style={styles.levelText}>{card.level}</Text>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    minHeight: 92,
    backgroundColor: onboardingTokens.card,
    borderRadius: onboardingRadii.md,
    borderWidth: 1,
    borderColor: onboardingTokens.border,
    padding: spacing.sm,
    gap: 3,
    position: 'relative',
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  title: {
    fontSize: 9,
    fontWeight: '800',
    color: onboardingTokens.textMain,
  },
  sub: {
    fontSize: 8,
    color: onboardingTokens.textMuted,
    fontWeight: '600',
  },
  detail: {
    fontSize: 8,
    fontWeight: '700',
    color: onboardingTokens.textMuted,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(98,91,255,0.12)',
    overflow: 'hidden',
    marginTop: 4,
  },
  fill: {
    height: '100%',
    backgroundColor: onboardingTokens.primary,
    borderRadius: 2,
  },
  levelCircle: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: onboardingTokens.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
