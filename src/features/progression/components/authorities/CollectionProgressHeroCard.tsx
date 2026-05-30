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
import { colors } from '@/ui/theme/colors';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type CollectionProgressHeroCardProps = CollectionHeroModel;

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
            <LinearGradient
              colors={['#FFE082', AUTHORITY_COLLECTION_THEME.gold]}
              style={styles.medalCore}>
              <Ionicons name="star" size={42} color={colors.textInverse} />
            </LinearGradient>
          </LinearGradient>
        </Animated.View>
      </View>

      <View style={[styles.contentCard, shadows.card]}>
        <Text style={styles.title} numberOfLines={1}>
          Koleksiyon İlerlemesi
        </Text>
        <Text style={styles.count} numberOfLines={1}>
          {countLabel}
        </Text>
        <View style={styles.progressWrap}>
          <AnimatedProgressBar
            progress={progress}
            color={colors.primary}
            trackColor="rgba(15, 143, 134, 0.12)"
            height={8}
          />
        </View>
        <Text style={styles.hint} numberOfLines={2}>
          {hint}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.xxxl,
    minHeight: 260,
  },
  medalStage: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -36,
    zIndex: 2,
  },
  haloOuter: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: 'rgba(244, 181, 31, 0.12)',
  },
  haloInner: {
    position: 'absolute',
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: 'rgba(244, 181, 31, 0.18)',
  },
  laurelLeft: {
    position: 'absolute',
    left: '22%',
    top: 42,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(231, 169, 14, 0.45)',
    transform: [{ rotate: '-28deg' }],
  },
  laurelRight: {
    position: 'absolute',
    right: '22%',
    top: 42,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(231, 169, 14, 0.45)',
    transform: [{ rotate: '28deg' }],
  },
  sparkleA: {
    position: 'absolute',
    top: 18,
    left: '18%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AUTHORITY_COLLECTION_THEME.purple,
  },
  sparkleB: {
    position: 'absolute',
    top: 28,
    right: '20%',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: AUTHORITY_COLLECTION_THEME.gold,
  },
  sparkleC: {
    position: 'absolute',
    bottom: 8,
    right: '32%',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  medalWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AUTHORITY_COLLECTION_THEME.goldDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  medalCore: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  contentCard: {
    width: '100%',
    backgroundColor: AUTHORITY_COLLECTION_THEME.cardBg,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: AUTHORITY_COLLECTION_THEME.border,
    paddingTop: 52,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: 8,
    zIndex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: AUTHORITY_COLLECTION_THEME.textPrimary,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  count: {
    fontSize: 15,
    fontWeight: '600',
    color: AUTHORITY_COLLECTION_THEME.textSecondary,
    textAlign: 'center',
  },
  progressWrap: {
    width: '100%',
    maxWidth: 300,
    marginTop: 4,
  },
  hint: {
    fontSize: 13,
    fontWeight: '500',
    color: AUTHORITY_COLLECTION_THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 2,
  },
});
