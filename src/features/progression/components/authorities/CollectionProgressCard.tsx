import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { AnimatedProgressBar } from '@/features/progression/components/authorities/AnimatedProgressBar';
import { colors } from '@/ui/theme/colors';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type CollectionProgressCardProps = {
  collected: number;
  total: number;
  progress: number;
};

export function CollectionProgressCard({
  collected,
  total,
  progress,
}: CollectionProgressCardProps) {
  return (
    <Animated.View
      entering={FadeInUp.duration(420).springify().damping(20)}
      style={[styles.card, shadows.card]}>
      <View style={styles.left}>
        <View style={styles.starGlow}>
          <LinearGradient
            colors={['rgba(26,143,138,0.2)', 'rgba(26,143,138,0.05)']}
            style={styles.starCircle}>
            <LinearGradient
              colors={[colors.hubGold, colors.hubGoldDark]}
              style={styles.starBadge}>
              <Ionicons name="star" size={28} color={colors.textInverse} />
            </LinearGradient>
          </LinearGradient>
        </View>
      </View>

      <View style={styles.center}>
        <Text style={styles.title}>Koleksiyon İlerlemesi</Text>
        <Text style={styles.count}>
          {collected} / {total} toplandı
        </Text>
        <AnimatedProgressBar
          progress={progress}
          color={colors.primary}
          trackColor="rgba(26,143,138,0.12)"
        />
        <Text style={styles.hint}>Yeni rozetler keşfetmeye devam et!</Text>
      </View>

      <View style={styles.giftWrap}>
        <View style={styles.confettiA} />
        <View style={styles.confettiB} />
        <LinearGradient
          colors={[colors.authorityMuted, '#E8E0F8']}
          style={styles.giftBox}>
          <Ionicons name="gift-outline" size={26} color={colors.authority} />
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    paddingVertical: spacing.lg,
  },
  left: {
    width: 64,
    alignItems: 'center',
  },
  starGlow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  starCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.hubGoldDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  center: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  count: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  hint: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  giftWrap: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  giftBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(123,91,184,0.15)',
  },
  confettiA: {
    position: 'absolute',
    top: 4,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.hubGold,
    opacity: 0.7,
  },
  confettiB: {
    position: 'absolute',
    bottom: 10,
    left: 4,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
    opacity: 0.5,
  },
});
