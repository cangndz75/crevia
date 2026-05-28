import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

import { MENTION_ACCENT } from './mentionUiConstants';

type Props = {
  activeCount: number;
  onBack: () => void;
};

export function SocialMentionsHeader({ activeCount, onBack }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Animated.View entering={FadeIn.duration(280)}>
      <LinearGradient
        colors={['#EDE8F8', '#E8F0FC', '#F5E8F5', colors.hubCream]}
        locations={[0, 0.35, 0.65, 1]}
        style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.topRow}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Geri dön">
            <Ionicons name="chevron-back" size={22} color={MENTION_ACCENT.title} />
          </Pressable>

          {activeCount > 0 ? (
            <View style={styles.activeBadge}>
              <Ionicons name="pulse" size={14} color={MENTION_ACCENT.purple} />
              <Text style={styles.activeBadgeText}>{activeCount} aktif</Text>
            </View>
          ) : (
            <View style={styles.badgeSpacer} />
          )}
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>Canlı Mentionlar</Text>
          <Text style={styles.subtitle}>
            Mahallelerden gelen anlık paylaşımlar ve tepkiler
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(228,226,221,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPressed: {
    opacity: 0.88,
  },
  badgeSpacer: {
    width: 44,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.18)',
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: MENTION_ACCENT.purple,
  },
  titleBlock: {
    gap: 6,
    paddingRight: spacing.sm,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: MENTION_ACCENT.title,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: MENTION_ACCENT.subtitle,
    lineHeight: 20,
  },
});
