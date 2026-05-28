import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

type Props = {
  onBack: () => void;
  onInfo?: () => void;
};

function CitySilhouette() {
  const blocks = [
    { left: '2%' as const, w: 18, h: 32 },
    { left: '10%' as const, w: 14, h: 22 },
    { left: '18%' as const, w: 22, h: 38 },
    { left: '28%' as const, w: 12, h: 18 },
    { left: '35%' as const, w: 26, h: 44 },
    { left: '48%' as const, w: 16, h: 28 },
    { left: '56%' as const, w: 20, h: 36 },
    { left: '66%' as const, w: 14, h: 24 },
    { left: '74%' as const, w: 22, h: 40 },
    { left: '84%' as const, w: 16, h: 30 },
    { left: '92%' as const, w: 18, h: 26 },
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {blocks.map((b, i) => (
        <View
          key={i}
          style={[
            styles.block,
            {
              left: b.left,
              width: b.w,
              height: b.h,
              opacity: 0.08 + (i % 3) * 0.03,
            },
          ]}
        />
      ))}
    </View>
  );
}

function AvatarSparkle() {
  return (
    <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.avatarWrap}>
      <View style={styles.avatarCircle}>
        <Ionicons name="person" size={14} color="#9B7BD4" />
      </View>
      <View style={[styles.sparkle, styles.sparkleTopRight]}>
        <Text style={styles.sparkleText}>✦</Text>
      </View>
      <View style={[styles.sparkle, styles.sparkleBottomLeft]}>
        <Text style={styles.sparkleText}>✦</Text>
      </View>
    </Animated.View>
  );
}

export function SocialNavHeader({ onBack, onInfo }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.outer}>
      <LinearGradient
        colors={['#EDE5F7', '#F3EDF9', '#F9F5FD', colors.hubCream]}
        locations={[0, 0.3, 0.7, 1]}
        style={[styles.wrap, { paddingTop: insets.top + spacing.xs }]}>
        <CitySilhouette />

        <AvatarSparkle />

        <View style={styles.row}>
          <Pressable
            onPress={onBack}
            hitSlop={HIT_SLOP}
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && styles.iconBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Geri dön">
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </Pressable>

          <Text style={styles.title} numberOfLines={1}>
            Sosyal Nabız
          </Text>

          <Pressable
            onPress={onInfo}
            hitSlop={HIT_SLOP}
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && styles.iconBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Bilgi">
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.primary}
            />
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: colors.hubCream,
  },
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(228,226,221,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: {
    opacity: 0.88,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.35,
    paddingHorizontal: spacing.sm,
  },
  block: {
    position: 'absolute',
    bottom: 0,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: '#9B7BD4',
  },
  avatarWrap: {
    alignSelf: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0E8FC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D4C0F0',
  },
  sparkle: {
    position: 'absolute',
  },
  sparkleTopRight: {
    top: -4,
    right: -6,
  },
  sparkleBottomLeft: {
    bottom: -2,
    left: -6,
  },
  sparkleText: {
    fontSize: 8,
    color: '#C4A3E8',
  },
});
