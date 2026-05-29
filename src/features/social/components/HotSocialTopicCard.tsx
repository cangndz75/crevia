import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

import type { HotSocialTopicPresentation } from '../utils/socialPulsePresentation';
import { SOCIAL_CARD_BORDER } from '../utils/socialLayout';

type Props = {
  topic: HotSocialTopicPresentation;
};

const TONE_PILL = {
  calm: { bg: colors.primaryMuted, text: colors.primary },
  watching: { bg: colors.warningMuted, text: colors.warning },
  warning: { bg: 'rgba(255, 140, 120, 0.14)', text: '#C75A4A' },
  critical: { bg: colors.dangerMuted, text: colors.danger },
} as const;

export function HotSocialTopicCard({ topic }: Props) {
  const pill = TONE_PILL[topic.tone];

  return (
    <Animated.View
      entering={FadeInUp.delay(160).duration(380)}
      style={[styles.card, shadows.soft]}>
      <View style={styles.headerRow}>
        <Text style={styles.eyebrow} numberOfLines={1}>
          Gündemde
        </Text>
        <View style={[styles.tonePill, { backgroundColor: pill.bg }]}>
          <Text style={[styles.toneText, { color: pill.text }]} numberOfLines={1}>
            {topic.tonePillLabel}
          </Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {topic.title}
      </Text>

      {topic.contextLine ? (
        <Text style={styles.contextLine} numberOfLines={1}>
          {topic.contextLine}
        </Text>
      ) : null}

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
          <Text style={styles.metaText} numberOfLines={1}>
            {topic.districtLabel}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
          <Text style={styles.metaText} numberOfLines={1}>
            {topic.remainingTime}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: pill.bg }]}>
          <Text style={[styles.badgeText, { color: pill.text }]} numberOfLines={1}>
            {topic.badge}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: SOCIAL_CARD_BORDER,
    padding: spacing.md,
    gap: 8,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  eyebrow: {
    flex: 1,
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
  tonePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    flexShrink: 0,
    maxWidth: '52%',
  },
  toneText: {
    fontSize: 10,
    fontWeight: '800',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.25,
    lineHeight: 21,
  },
  contextLine: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 15,
    flexShrink: 1,
    minWidth: 0,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '48%',
    flexShrink: 1,
    minWidth: 0,
  },
  metaText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
});
