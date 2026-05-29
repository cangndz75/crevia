import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

import type { SocialPulseHeaderModel } from '../utils/socialPulsePresentation';
import { SOCIAL_CARD_BORDER } from '../utils/socialLayout';

type Props = {
  model: SocialPulseHeaderModel;
};

const TONE_STYLES = {
  calm: {
    chipBg: colors.primaryMuted,
    chipText: colors.primary,
    ring: colors.primary,
  },
  watching: {
    chipBg: colors.warningMuted,
    chipText: colors.warning,
    ring: colors.warning,
  },
  warning: {
    chipBg: 'rgba(255, 140, 120, 0.14)',
    chipText: '#C75A4A',
    ring: '#E07A6A',
  },
  critical: {
    chipBg: colors.dangerMuted,
    chipText: colors.danger,
    ring: colors.danger,
  },
} as const;

export function SocialPulseHeaderCard({ model }: Props) {
  const tone = TONE_STYLES[model.tone];

  return (
    <Animated.View
      entering={FadeInDown.duration(420).springify()}
      style={[styles.wrap, shadows.soft]}>
      <LinearGradient
        colors={['#FFFFFF', '#FAFFFE', '#F3FBF9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.copy}>
            <Text style={styles.kicker} numberOfLines={1}>
              {model.subtitle}
            </Text>
            <Text style={styles.title} numberOfLines={1}>
              {model.title}
            </Text>
            <View style={[styles.statusChip, { backgroundColor: tone.chipBg }]}>
              <Text style={[styles.statusText, { color: tone.chipText }]} numberOfLines={1}>
                {model.statusLabel}
              </Text>
            </View>
            <Text style={styles.summary} numberOfLines={2}>
              {model.summary}
            </Text>
          </View>
          <View style={[styles.scoreRing, { borderColor: tone.ring }]}>
            <Text style={[styles.scoreValue, { color: tone.chipText }]}>
              {model.score}
            </Text>
            <Text style={styles.scoreMax} numberOfLines={1}>
              /{model.maxScore}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: SOCIAL_CARD_BORDER,
  },
  card: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.35,
  },
  statusChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    maxWidth: '100%',
    flexShrink: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  summary: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 17,
    marginTop: 2,
  },
  scoreRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    flexShrink: 0,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 24,
  },
  scoreMax: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: -2,
  },
});
