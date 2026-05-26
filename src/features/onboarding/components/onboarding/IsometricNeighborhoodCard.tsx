import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { onboardingAssets } from '@/features/onboarding/data/onboardingAssets';
import { onboardingRadii, onboardingTokens } from '@/features/onboarding/theme/onboardingTokens';

type IsometricNeighborhoodCardProps = {
  active?: boolean;
};

export function IsometricNeighborhoodCard({ active = true }: IsometricNeighborhoodCardProps) {
  const scale = useSharedValue(active ? 0.96 : 1);
  const floatY = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
    floatY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(4, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [active, floatY, scale]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: floatY.value }, { rotate: '-1.5deg' }],
  }));

  return (
    <Animated.View style={[styles.wrap, cardStyle]}>
      <View style={styles.card}>
        <Image
          source={onboardingAssets.neighborhoodMap}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.gloss} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 4,
  },
  card: {
    width: '88%',
    maxWidth: 300,
    height: 168,
    borderRadius: onboardingRadii.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: onboardingTokens.border,
    backgroundColor: onboardingTokens.cream,
    shadowColor: onboardingTokens.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 6,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gloss: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
