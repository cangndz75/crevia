import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedProgressBar } from '@/features/progression/components/authorities/AnimatedProgressBar';
import {
  AUTHORITY_COLLECTION_THEME,
  type CollectionHeroModel,
} from '@/features/progression/utils/authorityCollectionPresentation';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type CollectionProgressHeroCardProps = CollectionHeroModel;

const HERO_DARK = ['#0A1A1A', '#0F2E2C', '#143F39'] as const;

export function CollectionProgressHeroCard({
  progress,
  countLabel,
  hint,
}: CollectionProgressHeroCardProps) {
  const starScale = useSharedValue(1);
  const sparkleOpacity = useSharedValue(0.55);

  useEffect(() => {
    starScale.value = withRepeat(
      withSequence(
        withTiming(0.96, { duration: 1800 }),
        withTiming(1, { duration: 1800 }),
      ),
      -1,
      false,
    );
    sparkleOpacity.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 1200 }),
        withTiming(0.85, { duration: 1200 }),
      ),
      -1,
      false,
    );
  }, [sparkleOpacity, starScale]);

  const starStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScale.value }],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.medalRow} pointerEvents="none">
        <View style={styles.medalStage}>
          <View style={styles.haloOuter} />
          <View style={styles.haloInner} />
          <View style={styles.laurelLeft} />
          <View style={styles.laurelRight} />

          <Animated.View style={[styles.sparkleA, sparkleStyle]} />
          <Animated.View style={[styles.sparkleB, sparkleStyle]} />
          <Animated.View style={[styles.sparkleC, sparkleStyle]} />

          <Animated.View style={[styles.medalWrap, starStyle]}>
            <LinearGradient
              colors={[AUTHORITY_COLLECTION_THEME.gold, AUTHORITY_COLLECTION_THEME.goldDark]}
              style={styles.medalRing}>
              <LinearGradient colors={['#FFE082', AUTHORITY_COLLECTION_THEME.gold]} style={styles.medalCore}>
                <Ionicons name="star" size={38} color="#FFFFFF" />
              </LinearGradient>
            </LinearGradient>
          </Animated.View>
        </View>
      </View>

      <LinearGradient colors={[...HERO_DARK]} style={[styles.contentCard, shadows.card]}>
        <Text style={styles.title} numberOfLines={1}>
          Koleksiyon İlerlemesi
        </Text>
        <Text style={styles.count} numberOfLines={1}>
          {countLabel}
        </Text>
        <View style={styles.progressWrap}>
          <AnimatedProgressBar
            progress={progress}
            color={AUTHORITY_COLLECTION_THEME.gold}
            trackColor="rgba(255,255,255,0.14)"
            height={6}
          />
        </View>
        <Text style={styles.hint} numberOfLines={3}>
          {hint ||
            'İlk birkaç kararın operasyon tarzını belirleyecek. Rozet vitrini şehirde bıraktığın izi burada gösterecek.'}
        </Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginTop: spacing.md,
  },
  medalRow: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: -30,
    zIndex: 1,
  },
  medalStage: {
    width: 132,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCard: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingTop: 40,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  haloOuter: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: 'rgba(244, 181, 31, 0.10)',
  },
  haloInner: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(244, 181, 31, 0.16)',
  },
  laurelLeft: {
    position: 'absolute',
    left: 28,
    top: 36,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(231, 169, 14, 0.45)',
    transform: [{ rotate: '-28deg' }],
  },
  laurelRight: {
    position: 'absolute',
    right: 28,
    top: 36,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(231, 169, 14, 0.45)',
    transform: [{ rotate: '28deg' }],
  },
  sparkleA: {
    position: 'absolute',
    top: 8,
    left: 18,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: AUTHORITY_COLLECTION_THEME.purple,
  },
  sparkleB: {
    position: 'absolute',
    top: 14,
    right: 20,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: AUTHORITY_COLLECTION_THEME.gold,
  },
  sparkleC: {
    position: 'absolute',
    bottom: 8,
    right: 28,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9DF2D2',
  },
  medalWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AUTHORITY_COLLECTION_THEME.goldDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 5,
  },
  medalCore: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  count: {
    fontSize: 14,
    fontWeight: '600',
    color: AUTHORITY_COLLECTION_THEME.goldSoft,
    textAlign: 'center',
  },
  progressWrap: {
    width: '100%',
    maxWidth: 300,
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 2,
  },
});
