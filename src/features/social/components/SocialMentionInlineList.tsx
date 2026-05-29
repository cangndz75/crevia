import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

import {
  getCreviaIconDefinition,
  getIconToneStyle,
  resolveIoniconForRegistryKey,
} from '@/core/presentation/creviaIconPresentation';

import type { LiveMentionsSectionModel } from '../utils/socialPulsePresentation';
import { SOCIAL_CARD_BORDER } from '../utils/socialLayout';

type Props = {
  model: LiveMentionsSectionModel;
  onViewAll?: () => void;
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  Şikayet: { bg: 'rgba(255, 140, 120, 0.14)', text: '#C75A4A' },
  Takdir: { bg: colors.successMuted, text: colors.success },
  Söylenti: { bg: colors.warningMuted, text: colors.warning },
  Bilgilendirme: { bg: colors.primaryMuted, text: colors.primary },
};

function MentionCard({
  item,
  index,
}: {
  item: LiveMentionsSectionModel['items'][number];
  index: number;
}) {
  const palette = TYPE_COLORS[item.typeLabel] ?? TYPE_COLORS.Bilgilendirme;
  const iconDef = getCreviaIconDefinition(item.iconRegistryKey);
  const toneStyle = getIconToneStyle(iconDef.tone);

  return (
    <Animated.View
      entering={FadeInUp.delay(80 + index * 60).duration(320)}
      style={[styles.mentionCard, shadows.soft]}>
      <View style={styles.mentionTop}>
        <View style={styles.authorRow}>
          <View style={[styles.typeIcon, { backgroundColor: toneStyle.backgroundColor }]}>
            <Ionicons
              name={resolveIoniconForRegistryKey(item.iconRegistryKey)}
              size={12}
              color={toneStyle.color}
            />
          </View>
          <Text style={styles.author} numberOfLines={1}>
            {item.authorLabel}
          </Text>
        </View>
        <View style={[styles.typePill, { backgroundColor: palette.bg }]}>
          <Text style={[styles.typeText, { color: palette.text }]} numberOfLines={1}>
            {item.typeLabel}
          </Text>
        </View>
      </View>
      <Text style={styles.meta} numberOfLines={1}>
        {item.districtLabel} · {item.timeAgo}
      </Text>
      <Text style={styles.body} numberOfLines={2}>
        {item.text}
      </Text>
    </Animated.View>
  );
}

export function SocialMentionInlineList({ model, onViewAll }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle} numberOfLines={1}>
          {model.title}
        </Text>
        {model.showViewAll && onViewAll ? (
          <Pressable onPress={onViewAll} hitSlop={8}>
            <Text style={styles.viewAll} numberOfLines={1}>
              Tümü
            </Text>
          </Pressable>
        ) : null}
      </View>

      {model.showEmptyState ? (
        <View style={styles.emptyCard}>
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primary} />
          <Text style={styles.emptyText} numberOfLines={2}>
            {model.emptyMessage}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {model.items.map((item, index) => (
            <MentionCard key={item.id} item={item} index={index} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  viewAll: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    flexShrink: 0,
  },
  list: {
    gap: 8,
  },
  mentionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: SOCIAL_CARD_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
    minWidth: 0,
  },
  mentionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  authorRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  typeIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  author: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    flexShrink: 0,
    maxWidth: '46%',
  },
  typeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  meta: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  body: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textPrimary,
    lineHeight: 17,
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: SOCIAL_CARD_BORDER,
    padding: spacing.md,
    minWidth: 0,
  },
  emptyText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 17,
  },
});
