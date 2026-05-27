import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import type { LiveMention } from '../utils/socialUiModel';
import { CATEGORY_LABELS } from '../utils/socialUiModel';

type Props = {
  mentions: LiveMention[];
  activeMentionCount: number;
  onViewAll?: () => void;
};

const CATEGORY_COLORS: Record<LiveMention['category'], string> = {
  complaint: colors.danger,
  praise: colors.success,
  opportunity: colors.primary,
  crisis: colors.critical,
};

const CATEGORY_BG: Record<LiveMention['category'], string> = {
  complaint: colors.dangerMuted,
  praise: colors.successMuted,
  opportunity: colors.primaryMuted,
  crisis: colors.criticalMuted,
};

function LiveMentionCard({ mention }: { mention: LiveMention }) {
  const catColor = CATEGORY_COLORS[mention.category];
  const catBg = CATEGORY_BG[mention.category];

  return (
    <View style={[styles.mentionCard, shadows.soft]}>
      <View style={styles.mentionHeader}>
        <View style={[styles.avatar, { borderColor: catColor }]}>
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
        <View style={[styles.categoryBadge, { backgroundColor: catBg }]}>
          <Text style={[styles.categoryText, { color: catColor }]}>
            {CATEGORY_LABELS[mention.category]}
          </Text>
        </View>
      </View>
      <Text style={styles.mentionText} numberOfLines={2}>
        {mention.text}
      </Text>
      <View style={styles.mentionFooter}>
        <View style={styles.iconStat}>
          <Ionicons
            name="heart-outline"
            size={13}
            color={colors.textSecondary}
          />
          <Text style={styles.statText}>{mention.likes}</Text>
        </View>
        <View style={styles.iconStat}>
          <Ionicons
            name="chatbubble-outline"
            size={13}
            color={colors.textSecondary}
          />
          <Text style={styles.statText}>{mention.comments}</Text>
        </View>
      </View>
    </View>
  );
}

export function LiveMentionsStrip({
  mentions,
  activeMentionCount,
  onViewAll,
}: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleWithBadge}>
          <Text style={styles.sectionTitle}>Canlı Mentionlar</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {activeMentionCount.toLocaleString('tr-TR')} aktif
            </Text>
          </View>
        </View>
        <Pressable onPress={onViewAll} hitSlop={8}>
          <Text style={styles.viewAllLink}>Tümünü Gör &gt;</Text>
        </Pressable>
      </View>

      <View style={styles.mentionsList}>
        {mentions.map((m) => (
          <LiveMentionCard key={m.id} mention={m} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  countBadge: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  mentionsList: {
    gap: 8,
  },
  mentionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 8,
  },
  mentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 11,
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
    fontWeight: '700',
    color: colors.textPrimary,
  },
  mentionSub: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '800',
  },
  mentionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textPrimary,
    lineHeight: 17,
  },
  mentionFooter: {
    flexDirection: 'row',
    gap: 14,
  },
  iconStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
