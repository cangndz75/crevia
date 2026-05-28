import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import type { LiveMention, LiveMentionCategory } from '../utils/socialUiModel';
import { CATEGORY_LABELS } from '../utils/socialUiModel';
import { SOCIAL_CARD_BORDER } from '../utils/socialLayout';

type Props = {
  mentions: LiveMention[];
  activeMentionCount: number;
  onViewAll?: () => void;
};

const CATEGORY_STYLES: Record<LiveMentionCategory, { fg: string; bg: string }> =
  {
    complaint: { fg: colors.danger, bg: colors.dangerMuted },
    praise: { fg: colors.success, bg: colors.successMuted },
    opportunity: { fg: colors.primary, bg: colors.primaryMuted },
    crisis: { fg: colors.critical, bg: colors.criticalMuted },
    rumor: { fg: colors.warning, bg: colors.warningMuted },
    question: { fg: colors.primary, bg: colors.primaryMuted },
    neutral: { fg: colors.textSecondary, bg: colors.backgroundAlt },
  };

function MentionMiniCard({ mention }: { mention: LiveMention }) {
  const cat = CATEGORY_STYLES[mention.category];

  return (
    <View style={styles.mentionCard}>
      <View style={styles.mentionHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{mention.avatarInitials}</Text>
        </View>
        <View style={styles.mentionMeta}>
          <Text style={styles.mentionName} numberOfLines={1}>
            {mention.name}
          </Text>
          <Text style={styles.mentionSub} numberOfLines={1}>
            {mention.neighborhood} · {mention.timeAgo}
          </Text>
        </View>
        <View style={[styles.categoryBadge, { backgroundColor: cat.bg }]}>
          <Text style={[styles.categoryText, { color: cat.fg }]} numberOfLines={1}>
            {CATEGORY_LABELS[mention.category]}
          </Text>
        </View>
      </View>
      <Text style={styles.mentionText} numberOfLines={2}>
        {mention.text}
      </Text>
      <View style={styles.mentionFooter}>
        <View style={styles.iconStat}>
          <Ionicons name="heart-outline" size={12} color={colors.textSecondary} />
          <Text style={styles.statText}>{mention.likes}</Text>
        </View>
        <View style={styles.iconStat}>
          <Ionicons name="chatbubble-outline" size={12} color={colors.textSecondary} />
          <Text style={styles.statText}>{mention.comments}</Text>
        </View>
      </View>
    </View>
  );
}

export function LiveMentionsStrip({
  mentions,
  activeMentionCount,
}: Props) {
  const items = Array.isArray(mentions) ? mentions : [];
  const safeCount =
    typeof activeMentionCount === 'number' && Number.isFinite(activeMentionCount)
      ? Math.max(0, Math.round(activeMentionCount))
      : 0;

  return (
    <Animated.View
      entering={FadeInRight.delay(300).duration(400)}
      style={[styles.card, shadows.soft]}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="chatbubbles-outline" size={14} color={colors.primary} />
        </View>
        <Text style={styles.sectionTitle}>Canlı Mentionlar</Text>
      </View>

      <View style={styles.countPill}>
        <View style={styles.liveDot} />
        <Text style={styles.countText}>{safeCount} aktif</Text>
      </View>

      <View style={styles.mentionsList}>
        {items.map((m) => (
          <MentionMiniCard key={m.id} mention={m} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: SOCIAL_CARD_BORDER,
    padding: spacing.md,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: colors.successMuted,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  countText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.success,
  },
  mentionsList: {
    gap: 8,
  },
  mentionCard: {
    gap: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(228,226,221,0.7)',
  },
  mentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  mentionMeta: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  mentionName: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  mentionSub: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.full,
    flexShrink: 0,
  },
  categoryText: {
    fontSize: 8,
    fontWeight: '800',
  },
  mentionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textPrimary,
    lineHeight: 16,
  },
  mentionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
