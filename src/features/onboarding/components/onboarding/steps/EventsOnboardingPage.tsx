import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { EVENT_FLOATING_STATS, TUTORIAL_EVENT } from '@/features/onboarding/data/onboardingData';
import { onboardingAssets } from '@/features/onboarding/data/onboardingAssets';
import { EventCard } from '@/features/onboarding/components/onboarding/EventCard';
import { FloatingStatCard } from '@/features/onboarding/components/onboarding/FloatingStatCard';
import { onboardingTokens } from '@/features/onboarding/theme/onboardingTokens';
import { onboardingRadii } from '@/features/onboarding/theme/onboardingTokens';
import { spacing } from '@/ui/theme/spacing';

type EventsOnboardingPageProps = {
  selectedDecisionId: string | null;
  onSelectDecision: (id: string) => void;
};

export function EventsOnboardingPage({
  selectedDecisionId,
  onSelectDecision,
}: EventsOnboardingPageProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.scene}>
        {EVENT_FLOATING_STATS.map((metric, index) => (
          <FloatingStatCard key={metric.id} metric={metric} index={index} animateIdle />
        ))}
        <EventCard
          selectedDecisionId={selectedDecisionId}
          onSelectDecision={onSelectDecision}
        />
      </View>

      <Text style={styles.hint}>{TUTORIAL_EVENT.swipeHint}</Text>

      <Animated.View entering={FadeIn.delay(500).duration(400)} style={styles.advisorRow}>
        <Image
          source={onboardingAssets.characters.sahaSefi}
          style={styles.advisorAvatar}
          contentFit="cover"
        />
        <View style={styles.bubble}>
          <Text style={styles.advisorName}>{TUTORIAL_EVENT.advisorName}</Text>
          <Text style={styles.advisorTip}>{TUTORIAL_EVENT.advisorTip}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  scene: {
    minHeight: 400,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  hint: {
    fontSize: 11,
    fontWeight: '600',
    color: onboardingTokens.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: spacing.md,
  },
  advisorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  advisorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: onboardingTokens.border,
  },
  bubble: {
    flex: 1,
    backgroundColor: onboardingTokens.card,
    borderRadius: onboardingRadii.lg,
    borderWidth: 1,
    borderColor: onboardingTokens.border,
    padding: spacing.md,
    gap: 4,
  },
  advisorName: {
    fontSize: 11,
    fontWeight: '800',
    color: onboardingTokens.primary,
  },
  advisorTip: {
    fontSize: 12,
    lineHeight: 17,
    color: onboardingTokens.textMain,
    fontWeight: '500',
  },
});
