import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import type { HotSocialTopic } from '../utils/socialUiModel';
import { SocialActionButton } from './SocialActionButton';

type Props = {
  topic: HotSocialTopic;
  onAction?: (actionId: string) => void;
};

const MAX_RISK_CHIPS = 2;

export function HotSocialTopicCard({ topic, onAction }: Props) {
  const { width } = useWindowDimensions();
  const stackActions = width < 380;
  const riskChips = topic.riskChips.slice(0, MAX_RISK_CHIPS);

  return (
    <View style={[styles.card, shadows.card]}>
      {/* Badge row */}
      <View style={styles.badgeRow}>
        <View style={styles.crisisBadge}>
          <Ionicons name="warning" size={12} color={colors.critical} />
          <Text style={styles.crisisBadgeText}>{topic.badge}</Text>
        </View>
        <View style={styles.timerBadge}>
          <Ionicons name="time-outline" size={12} color={colors.warning} />
          <Text style={styles.timerText}>{topic.remainingTime}</Text>
        </View>
      </View>

      {/* Title & description */}
      <Text style={styles.title} numberOfLines={2}>
        {topic.title}
      </Text>
      <Text style={styles.description} numberOfLines={3}>
        {topic.description}
      </Text>

      {/* Meta */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons
            name="location-outline"
            size={13}
            color={colors.textSecondary}
          />
          <Text style={styles.metaText}>{topic.neighborhood}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons
            name="chatbubbles-outline"
            size={13}
            color={colors.textSecondary}
          />
          <Text style={styles.metaText}>{topic.interactions}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons
            name="chatbox-outline"
            size={13}
            color={colors.textSecondary}
          />
          <Text style={styles.metaText}>{topic.comments} yorum</Text>
        </View>
      </View>

      {/* Risk chips */}
      <View style={styles.chipRow}>
        {riskChips.map((chip) => (
          <View key={chip.label} style={styles.riskChip}>
            <Text style={styles.riskChipLabel}>{chip.label}:</Text>
            <Text style={styles.riskChipValue}>{chip.value}</Text>
          </View>
        ))}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Actions */}
      <View
        style={[styles.actionsRow, stackActions && styles.actionsRowStacked]}>
        {topic.actions.map((action) => (
          <SocialActionButton
            key={action.id}
            action={action}
            onPress={onAction}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderLeftColor: colors.critical,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    gap: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  crisisBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.criticalMuted,
    borderWidth: 1,
    borderColor: colors.critical,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  crisisBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.critical,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warningMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  timerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.warning,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  description: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  riskChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.dangerMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  riskChipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.danger,
  },
  riskChipValue: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.danger,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionsRowStacked: {
    flexDirection: 'column',
  },
});
