import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';
import type { LiveMention, LiveMentionCategory } from '../utils/socialUiModel';
import { CATEGORY_LABELS } from '../utils/socialUiModel';
import { SocialExploreCard } from './SocialExploreCard';
import {
  SocialBottomSheet,
  SocialSheetListItem,
} from './SocialBottomSheet';

type PreviewProps = {
  mentions: LiveMention[];
  activeMentionCount: number;
  onPress: () => void;
};

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  mentions: LiveMention[];
  activeMentionCount: number;
};

const CATEGORY_STYLES: Record<LiveMentionCategory, { fg: string; bg: string }> = {
  complaint: { fg: colors.danger, bg: colors.dangerMuted },
  praise: { fg: colors.success, bg: colors.successMuted },
  opportunity: { fg: colors.primary, bg: colors.primaryMuted },
  crisis: { fg: colors.critical, bg: colors.criticalMuted },
  rumor: { fg: colors.warning, bg: colors.warningMuted },
  question: { fg: colors.primary, bg: colors.primaryMuted },
  neutral: { fg: colors.textSecondary, bg: colors.backgroundAlt },
};

function AvatarStack({ mentions }: { mentions: LiveMention[] }) {
  const slice = mentions.slice(0, 4);
  if (slice.length === 0) return null;

  return (
    <View style={styles.avatarStack}>
      {slice.map((m, i) => (
        <View
          key={m.id}
          style={[
            styles.stackAvatar,
            { marginLeft: i === 0 ? 0 : -10, zIndex: slice.length - i },
          ]}>
          <Text style={styles.stackAvatarText}>{m.avatarInitials}</Text>
        </View>
      ))}
      {mentions.length > 4 ? (
        <View style={[styles.stackAvatar, styles.stackMore, { marginLeft: -10 }]}>
          <Text style={styles.stackMoreText}>+{mentions.length - 4}</Text>
        </View>
      ) : null}
    </View>
  );
}

function MentionRow({ mention }: { mention: LiveMention }) {
  const cat = CATEGORY_STYLES[mention.category];

  return (
    <View style={styles.mentionRow}>
      <View style={styles.mentionAvatar}>
        <Text style={styles.mentionAvatarText}>{mention.avatarInitials}</Text>
      </View>
      <View style={styles.mentionBody}>
        <View style={styles.mentionTop}>
          <Text style={styles.mentionName} numberOfLines={1}>
            {mention.name}
          </Text>
          <View style={[styles.categoryBadge, { backgroundColor: cat.bg }]}>
            <Text style={[styles.categoryText, { color: cat.fg }]}>
              {CATEGORY_LABELS[mention.category]}
            </Text>
          </View>
        </View>
        <Text style={styles.mentionSub}>
          {mention.neighborhood} · {mention.timeAgo}
        </Text>
        <Text style={styles.mentionText}>{mention.text}</Text>
        <View style={styles.mentionFooter}>
          <View style={styles.iconStat}>
            <Ionicons name="heart" size={14} color={colors.danger} />
            <Text style={styles.statText}>{mention.likes}</Text>
          </View>
          <View style={styles.iconStat}>
            <Ionicons name="chatbubble" size={14} color={colors.primary} />
            <Text style={styles.statText}>{mention.comments}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function SocialLiveMentionsCard({
  mentions,
  activeMentionCount,
  onPress,
}: PreviewProps) {
  const items = Array.isArray(mentions) ? mentions : [];
  const latest = items[0];
  const safeCount =
    typeof activeMentionCount === 'number' && Number.isFinite(activeMentionCount)
      ? Math.max(0, Math.round(activeMentionCount))
      : 0;

  return (
    <SocialExploreCard
      accent="violet"
      icon="chatbubbles-outline"
      title="Canlı Mentionlar"
      subtitle="Mahallelerden gelen anlık paylaşımlar"
      badge={`${safeCount} aktif`}
      badgeLive
      onPress={onPress}
      entering={FadeInUp.delay(560).duration(400)}
      preview={
        items.length > 0 ? (
          <View style={styles.previewBox}>
            <View style={styles.previewTop}>
              <AvatarStack mentions={items} />
              {latest ? (
                <View style={styles.previewSnippet}>
                  <Text style={styles.previewName} numberOfLines={1}>
                    {latest.name}
                  </Text>
                  <Text style={styles.previewText} numberOfLines={2}>
                    {latest.text}
                  </Text>
                </View>
              ) : null}
            </View>
            {items.length > 1 ? (
              <Text style={styles.moreHint}>
                Tüm akışı görmek için dokun
              </Text>
            ) : null}
          </View>
        ) : (
          <Text style={styles.emptyPreview}>Şu an canlı mention yok</Text>
        )
      }
    />
  );
}

export function SocialLiveMentionsSheet({
  visible,
  onClose,
  mentions,
  activeMentionCount,
}: SheetProps) {
  const items = Array.isArray(mentions) ? mentions : [];
  const safeCount =
    typeof activeMentionCount === 'number' && Number.isFinite(activeMentionCount)
      ? Math.max(0, Math.round(activeMentionCount))
      : 0;

  return (
    <SocialBottomSheet
      visible={visible}
      onClose={onClose}
      accent="violet"
      icon="chatbubbles-outline"
      title="Canlı Mentionlar"
      subtitle={`${safeCount} aktif konuşma · ${items.length} gösterim`}>
      {items.length === 0 ? (
        <View style={styles.emptySheet}>
          <Ionicons name="chatbubble-ellipses-outline" size={40} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Akış sessiz</Text>
          <Text style={styles.emptyBody}>
            Vatandaş paylaşımları burada anlık olarak listelenir.
          </Text>
        </View>
      ) : (
        items.map((mention, index) => (
          <SocialSheetListItem key={mention.id} index={index}>
            <View style={styles.sheetCard}>
              <MentionRow mention={mention} />
            </View>
          </SocialSheetListItem>
        ))
      )}
    </SocialBottomSheet>
  );
}

const styles = StyleSheet.create({
  previewBox: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(228,226,221,0.6)',
  },
  previewTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 4,
    flexShrink: 0,
  },
  stackAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackAvatarText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  stackMore: {
    backgroundColor: '#F0E8FC',
  },
  stackMoreText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7B5BB8',
  },
  previewSnippet: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  previewName: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  previewText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 15,
  },
  moreHint: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7B5BB8',
    textAlign: 'center',
  },
  emptyPreview: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  mentionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mentionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  mentionAvatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  mentionBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  mentionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  mentionName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    flexShrink: 0,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
  },
  mentionSub: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  mentionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    lineHeight: 20,
    marginTop: 2,
  },
  mentionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 6,
  },
  iconStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  sheetCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(228,226,221,0.8)',
  },
  emptySheet: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptyBody: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
});
