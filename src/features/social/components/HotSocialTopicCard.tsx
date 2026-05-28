import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import type { HotSocialTopic } from '../utils/socialUiModel';
import { SOCIAL_CARD_BORDER } from '../utils/socialLayout';

type Props = {
  topic: HotSocialTopic;
};

function SirenIllustration() {
  return (
    <View style={sirenStyles.wrap}>
      <View style={sirenStyles.glow} />
      <View style={sirenStyles.base}>
        <View style={sirenStyles.sirenTop}>
          <Ionicons name="warning" size={28} color="#FF4444" />
        </View>
        <View style={sirenStyles.sirenBody} />
      </View>
      <View style={[sirenStyles.wave, sirenStyles.wave1]} />
      <View style={[sirenStyles.wave, sirenStyles.wave2]} />
    </View>
  );
}

const sirenStyles = StyleSheet.create({
  wrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,68,68,0.08)',
  },
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sirenTop: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.dangerMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,68,68,0.25)',
  },
  sirenBody: {
    width: 20,
    height: 6,
    backgroundColor: 'rgba(255,68,68,0.2)',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    marginTop: -2,
  },
  wave: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255,68,68,0.15)',
  },
  wave1: {
    width: 54,
    height: 54,
  },
  wave2: {
    width: 68,
    height: 68,
  },
});

export function HotSocialTopicCard({ topic }: Props) {
  return (
    <Animated.View
      entering={FadeInUp.delay(200).duration(500)}
      style={[styles.card, shadows.card]}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.topTextCol}>
            <View style={styles.badgeRow}>
              <View style={styles.crisisBadge}>
                <Ionicons name="warning" size={11} color={colors.danger} />
                <Text style={styles.crisisBadgeText} numberOfLines={1}>
                  {topic.badge}
                </Text>
              </View>
              <View style={styles.timerBadge}>
                <Ionicons name="time-outline" size={11} color={colors.warning} />
                <Text style={styles.timerText} numberOfLines={1}>
                  {topic.remainingTime}
                </Text>
              </View>
            </View>

            <Text style={styles.title}>{topic.title}</Text>
            <Text style={styles.description}>{topic.description}</Text>
          </View>

          <SirenIllustration />
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {topic.neighborhood}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {topic.interactions}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="chatbubble-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {topic.comments}
            </Text>
          </View>
        </View>

        <View style={styles.chipRow}>
          {topic.riskChips.map((chip) => (
            <View key={chip.label} style={styles.riskChip}>
              <Ionicons
                name={chip.label === 'Risk' ? 'alert-circle' : 'trending-up'}
                size={10}
                color={colors.danger}
              />
              <Text style={styles.riskChipText} numberOfLines={1}>
                {chip.label}: {chip.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: SOCIAL_CARD_BORDER,
    overflow: 'hidden',
  },
  content: {
    padding: spacing.lg,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  topTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  crisisBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.dangerMuted,
  },
  crisisBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.danger,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warningMuted,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  timerText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.warning,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.35,
    lineHeight: 22,
  },
  description: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  riskChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.dangerMuted,
  },
  riskChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.danger,
  },
});
