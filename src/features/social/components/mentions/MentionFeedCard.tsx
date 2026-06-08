import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CreviaAnimatedCard, useCreviaReducedMotion } from '@/shared/motion';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

import { CATEGORY_LABELS, type LiveMention } from '../../utils/socialUiModel';
import { MENTION_CATEGORY_THEME } from './mentionUiConstants';

type Props = {
  mention: LiveMention;
  index: number;
};

export function MentionFeedCard({ mention, index }: Props) {
  const reducedMotion = useCreviaReducedMotion();
  const theme = MENTION_CATEGORY_THEME[mention.category];
  const timeLabel = mention.timeAgo.includes('önce')
    ? mention.timeAgo
    : `${mention.timeAgo} önce`;

  return (
    <CreviaAnimatedCard
      surface="social"
      index={index}
      reducedMotion={reducedMotion}
      disabled={index >= 2}
      motionKind="compact_card_enter"
      intensity="subtle">
      <View style={[styles.card, shadows.card]}>
        <View style={[styles.accentBar, { backgroundColor: theme.border }]} />

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.authorRow}>
              <View style={[styles.avatar, { backgroundColor: theme.avatarBg }]}>
                <Text style={[styles.avatarText, { color: theme.avatarFg }]}>
                  {mention.avatarInitials}
                </Text>
              </View>

              <View style={styles.meta}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {mention.name}
                  </Text>
                  <View style={[styles.chip, { backgroundColor: theme.chipBg }]}>
                    <Text style={[styles.chipText, { color: theme.chipFg }]}>
                      {CATEGORY_LABELS[mention.category]}
                    </Text>
                  </View>
                </View>
                <Text style={styles.subline}>
                  {mention.neighborhood} · {mention.timeAgo}
                </Text>
              </View>
            </View>

            <View style={styles.timeCol}>
              <Text style={styles.timeText}>{timeLabel}</Text>
              <View style={[styles.statusDot, { backgroundColor: theme.statusDot }]} />
            </View>
          </View>

          <Text style={styles.body} numberOfLines={2} ellipsizeMode="tail">
            {mention.text}
          </Text>

          <View style={styles.footer}>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Ionicons name="heart" size={17} color="#F87171" />
                <Text style={styles.statText}>{mention.likes}</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="chatbubble" size={16} color="#2DD4BF" />
                <Text style={styles.statText}>{mention.comments}</Text>
              </View>
            </View>

            <Pressable
              hitSlop={8}
              style={({ pressed }) => [styles.menuBtn, pressed && styles.menuBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Paylaşım seçenekleri">
              <Ionicons
                name="ellipsis-horizontal"
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </CreviaAnimatedCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(228,226,221,0.65)',
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  authorRow: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '900',
  },
  meta: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '800',
  },
  subline: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  timeCol: {
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 0,
    paddingTop: 2,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  body: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    lineHeight: 21,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  menuBtn: {
    padding: 4,
  },
  menuBtnPressed: {
    opacity: 0.7,
  },
});
