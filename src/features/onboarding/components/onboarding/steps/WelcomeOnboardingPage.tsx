import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { WELCOME_METRICS, WELCOME_PILLS } from '@/features/onboarding/data/onboardingData';
import { CharacterAvatarRow } from '@/features/onboarding/components/onboarding/CharacterAvatarRow';
import { FloatingStatCard } from '@/features/onboarding/components/onboarding/FloatingStatCard';
import { IsometricNeighborhoodCard } from '@/features/onboarding/components/onboarding/IsometricNeighborhoodCard';
import { PillTag } from '@/features/onboarding/components/onboarding/PillTag';
import { spacing } from '@/ui/theme/spacing';

export function WelcomeOnboardingPage() {
  return (
    <View style={styles.wrap}>
      <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.pills}>
        {WELCOME_PILLS.map((pill) => (
          <PillTag key={pill.id} label={pill.label} icon={pill.icon} />
        ))}
      </Animated.View>

      <View style={styles.mapScene}>
        {WELCOME_METRICS.map((metric, index) => (
          <FloatingStatCard key={metric.id} metric={metric} index={index} />
        ))}
        <IsometricNeighborhoodCard />
      </View>

      <CharacterAvatarRow />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: spacing.md,
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  mapScene: {
    width: '100%',
    minHeight: 220,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
});
