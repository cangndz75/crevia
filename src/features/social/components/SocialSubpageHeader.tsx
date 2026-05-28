import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

export type SocialSubpageAccent = 'teal' | 'violet';

const ACCENT: Record<
  SocialSubpageAccent,
  { gradient: readonly [string, string, string]; chipBg: string; chipText: string; glow: string }
> = {
  teal: {
    gradient: ['#157A76', '#1A8F8A', '#24A89E'],
    chipBg: 'rgba(255,255,255,0.2)',
    chipText: colors.textInverse,
    glow: 'rgba(255,255,255,0.08)',
  },
  violet: {
    gradient: ['#5B3F8C', '#7B5BB8', '#9B7BD4'],
    chipBg: 'rgba(255,255,255,0.2)',
    chipText: colors.textInverse,
    glow: 'rgba(255,255,255,0.1)',
  },
};

type Props = {
  title: string;
  subtitle: string;
  accent: SocialSubpageAccent;
  badge?: string;
  onBack: () => void;
};

export function SocialSubpageHeader({
  title,
  subtitle,
  accent,
  badge,
  onBack,
}: Props) {
  const insets = useSafeAreaInsets();
  const palette = ACCENT[accent];

  return (
    <Animated.View entering={FadeIn.duration(280)}>
      <LinearGradient
        colors={[...palette.gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
        <View style={[styles.glow, { backgroundColor: palette.glow }]} pointerEvents="none" />

        <View style={styles.row}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Geri dön">
            <Ionicons name="chevron-back" size={22} color={colors.textInverse} />
          </Pressable>

          <View style={styles.titleCol}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          </View>

          {badge ? (
            <View style={[styles.badge, { backgroundColor: palette.chipBg }]}>
              <Text style={[styles.badgeText, { color: palette.chipText }]}>{badge}</Text>
            </View>
          ) : (
            <View style={styles.backSpacer} />
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    zIndex: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  backBtnPressed: {
    opacity: 0.88,
  },
  backSpacer: {
    width: 40,
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    paddingTop: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textInverse,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginTop: 4,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
