import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { AnimatedProgressBar } from '@/features/progression/components/authorities/AnimatedProgressBar';
import type { GrowthBadgeHeroModel } from '@/features/progression/utils/growthScreenPresentation';
import { growth } from '@/features/progression/theme/growthScreenTokens';

type GrowthBadgeCollectionHeroProps = GrowthBadgeHeroModel;

export function GrowthBadgeCollectionHero({
  title,
  countLabel,
  progress,
  subtitle,
}: GrowthBadgeCollectionHeroProps) {
  const starScale = useSharedValue(1);

  useEffect(() => {
    starScale.value = withRepeat(
      withSequence(withTiming(0.96, { duration: 1800 }), withTiming(1, { duration: 1800 })),
      -1,
      false,
    );
  }, [starScale]);

  const starStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScale.value }],
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.medalRow} pointerEvents="none">
        <Animated.View style={[styles.medalWrap, starStyle]}>
          <LinearGradient colors={[growth.gold, '#9B741D']} style={styles.medalRing}>
            <Ionicons name="star" size={34} color={growth.text} />
          </LinearGradient>
        </Animated.View>
      </View>

      <LinearGradient
        colors={[growth.canvasDeep, growth.cardSolid, growth.card]}
        style={[styles.card, growth.shadow]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.count}>{countLabel}</Text>
        <View style={styles.progressWrap}>
          <AnimatedProgressBar
            progress={progress}
            color={growth.mint}
            trackColor={growth.track}
            height={6}
          />
        </View>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  medalRow: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: -28,
    zIndex: 1,
  },
  medalWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    ...growth.glowGold,
  },
  card: {
    borderRadius: growth.radiusCard,
    borderWidth: 1,
    borderColor: growth.borderGold,
    paddingTop: 36,
    paddingBottom: 18,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: growth.text,
    textAlign: 'center',
  },
  count: {
    fontSize: 14,
    fontWeight: '700',
    color: growth.gold,
    textAlign: 'center',
  },
  progressWrap: {
    width: '100%',
    maxWidth: 300,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: growth.textSoft,
    textAlign: 'center',
    lineHeight: 18,
  },
});
