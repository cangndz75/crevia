import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { MetricBadge } from '@/features/onboarding/components/onboarding/MetricBadge';
import { PillTag } from '@/features/onboarding/components/onboarding/PillTag';
import { onboardingAssets } from '@/features/onboarding/data/onboardingAssets';
import { WELCOME_METRICS, WELCOME_PILLS } from '@/features/onboarding/data/onboardingData';
import { onboardingRadii, onboardingTokens } from '@/features/onboarding/theme/onboardingTokens';

type WelcomeOnboardingPageProps = {
  compact?: boolean;
};

export function WelcomeOnboardingPage({ compact = false }: WelcomeOnboardingPageProps) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.pills}>
        {WELCOME_PILLS.map((pill) => (
          <PillTag key={pill.id} label={pill.label} icon={pill.icon} />
        ))}
      </Animated.View>

      <View style={[styles.heroCard, compact && styles.heroCardCompact]}>
        <View style={[styles.heroGlow, compact && styles.heroGlowCompact]} />
        <Image
          source={onboardingAssets.neighborhoodMap}
          style={[styles.heroImage, compact && styles.heroImageCompact]}
          contentFit="contain"
        />
      </View>

      <View style={styles.metricsRow}>
        {WELCOME_METRICS.map((metric) => (
          <MetricBadge key={metric.id} metric={metric} compact />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 14,
    alignItems: 'center',
    paddingBottom: 8,
  },
  wrapCompact: {
    gap: 10,
    paddingBottom: 4,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    minWidth: 0,
  },
  heroCard: {
    width: '100%',
    minHeight: 190,
    maxHeight: 224,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: onboardingTokens.cardSoft,
    borderRadius: onboardingRadii.xl,
    borderWidth: 1,
    borderColor: onboardingTokens.border,
    overflow: 'hidden',
    shadowColor: onboardingTokens.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  heroGlow: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(109,66,245,0.08)',
  },
  heroCardCompact: {
    minHeight: 132,
    maxHeight: 156,
  },
  heroGlowCompact: {
    width: 120,
    height: 120,
  },
  heroImage: {
    width: '92%',
    height: 190,
  },
  heroImageCompact: {
    height: 132,
  },
  metricsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    minWidth: 0,
  },
});
