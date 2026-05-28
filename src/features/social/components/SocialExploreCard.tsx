import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { SOCIAL_CARD_BORDER } from '../utils/socialLayout';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Accent = 'teal' | 'violet' | 'amber';

const ACCENT: Record<
  Accent,
  {
    gradient: readonly [string, string, string];
    iconBg: string;
    iconColor: string;
    chipBg: string;
    chipText: string;
    glow: string;
  }
> = {
  teal: {
    gradient: ['#FFFFFF', '#F0FAF9', '#E6F5F4'],
    iconBg: colors.primaryMuted,
    iconColor: colors.primary,
    chipBg: colors.primaryMuted,
    chipText: colors.primary,
    glow: 'rgba(26,143,138,0.12)',
  },
  violet: {
    gradient: ['#FFFFFF', '#F6F2FC', '#EDE5F7'],
    iconBg: '#F0E8FC',
    iconColor: '#7B5BB8',
    chipBg: '#F0E8FC',
    chipText: '#7B5BB8',
    glow: 'rgba(123,91,184,0.12)',
  },
  amber: {
    gradient: ['#FFFFFF', '#FFFBF4', '#FFF4E0'],
    iconBg: colors.warningMuted,
    iconColor: colors.warning,
    chipBg: colors.warningMuted,
    chipText: '#9A6A12',
    glow: 'rgba(232,155,46,0.12)',
  },
};

type Props = {
  accent: Accent;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  badge?: string;
  badgeLive?: boolean;
  preview: ReactNode;
  onPress: () => void;
  entering?: ComponentProps<typeof Animated.View>['entering'];
};

export function SocialExploreCard({
  accent,
  icon,
  title,
  subtitle,
  badge,
  badgeLive,
  preview,
  onPress,
  entering,
}: Props) {
  const palette = ACCENT[accent];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={entering} style={animatedStyle}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 18, stiffness: 320 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 18, stiffness: 320 });
        }}
        accessibilityRole="button"
        accessibilityLabel={title}>
        <LinearGradient
          colors={[...palette.gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, shadows.card, { borderColor: SOCIAL_CARD_BORDER }]}>
          <View
            style={[styles.glowOrb, { backgroundColor: palette.glow }]}
            pointerEvents="none"
          />

          <View style={styles.topRow}>
            <View style={[styles.iconWrap, { backgroundColor: palette.iconBg }]}>
              <Ionicons name={icon} size={20} color={palette.iconColor} />
            </View>
            <View style={styles.titleCol}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            {badge ? (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: palette.chipBg },
                  badgeLive && styles.badgeLive,
                ]}>
                {badgeLive ? <View style={styles.liveDot} /> : null}
                <Text style={[styles.badgeText, { color: palette.chipText }]}>
                  {badge}
                </Text>
              </View>
            ) : null}
            <View style={[styles.chevron, { backgroundColor: palette.iconBg }]}>
              <Ionicons name="chevron-forward" size={16} color={palette.iconColor} />
            </View>
          </View>

          <View style={styles.preview}>{preview}</View>
        </LinearGradient>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xxl,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
    overflow: 'hidden',
  },
  glowOrb: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    flexShrink: 0,
  },
  badgeLive: {
    paddingLeft: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  preview: {
    gap: 8,
  },
});
