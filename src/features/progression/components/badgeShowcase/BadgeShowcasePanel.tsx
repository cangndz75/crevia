import { useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { buildBadgeShowcaseSummary } from '@/core/badges/badgeShowcaseModel';
import type { BadgeShowcaseItem } from '@/core/badges/badgeShowcaseTypes';
import { BadgeShowcaseCategoryBlock } from '@/features/progression/components/badgeShowcase/BadgeShowcaseCategoryBlock';
import { BadgeShowcaseDetailModal } from '@/features/progression/components/badgeShowcase/BadgeShowcaseDetailModal';
import { BadgeShowcaseItemCard } from '@/features/progression/components/badgeShowcase/BadgeShowcaseItemCard';
import { BadgeShowcaseSummaryCard } from '@/features/progression/components/badgeShowcase/BadgeShowcaseSummaryCard';
import { BADGE_SHOWCASE_THEME } from '@/features/progression/utils/badgeShowcaseTheme';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type BadgeShowcasePanelProps = {
  badgeState: unknown;
  pilotDay: number;
};

export function BadgeShowcasePanel({ badgeState, pilotDay }: BadgeShowcasePanelProps) {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<BadgeShowcaseItem | null>(null);

  const summary = useMemo(
    () => buildBadgeShowcaseSummary(badgeState, pilotDay),
    [badgeState, pilotDay],
  );

  const handleItemPress = (item: BadgeShowcaseItem) => {
    setSelectedItem(item);
  };

  if (summary.emptyState.visible) {
    return (
      <Animated.View entering={FadeIn.duration(280)} style={styles.wrap}>
        <BadgeShowcaseSummaryCard summary={summary} />
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{summary.emptyState.title}</Text>
          <Text style={styles.emptyBody}>{summary.emptyState.body}</Text>
          <Pressable
            style={styles.emptyCta}
            onPress={() => router.push('/' as Href)}
            accessibilityRole="button"
            accessibilityLabel={summary.emptyState.ctaLabel}>
            <Text style={styles.emptyCtaText}>{summary.emptyState.ctaLabel}</Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(280)} style={styles.wrap}>
      <BadgeShowcaseSummaryCard summary={summary} />

      {summary.featuredBadges.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Öne çıkan rozetler</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredRow}>
            {summary.featuredBadges.map((item) => (
              <BadgeShowcaseItemCard
                key={item.id}
                item={item}
                onPress={handleItemPress}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {summary.nearUnlockBadges.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yakında açılacaklar</Text>
          <Text style={styles.sectionHint}>Bir sonraki hedefin burada.</Text>
          <View style={styles.nearUnlockGrid}>
            {summary.nearUnlockBadges.map((item) => (
              <BadgeShowcaseItemCard
                key={item.id}
                item={item}
                compact
                onPress={handleItemPress}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kategori vitrini</Text>
        {summary.categories.map((block) => (
          <BadgeShowcaseCategoryBlock
            key={block.category}
            block={block}
            onItemPress={handleItemPress}
          />
        ))}
      </View>

      <BadgeShowcaseDetailModal
        item={selectedItem}
        visible={selectedItem != null}
        onClose={() => setSelectedItem(null)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.xxl,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: BADGE_SHOWCASE_THEME.textPrimary,
    letterSpacing: -0.2,
  },
  sectionHint: {
    fontSize: 12,
    fontWeight: '500',
    color: BADGE_SHOWCASE_THEME.textSecondary,
    marginTop: -4,
  },
  featuredRow: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  nearUnlockGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  emptyCard: {
    backgroundColor: BADGE_SHOWCASE_THEME.mintSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(26,143,138,0.16)',
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: BADGE_SHOWCASE_THEME.textPrimary,
  },
  emptyBody: {
    fontSize: 13,
    fontWeight: '500',
    color: BADGE_SHOWCASE_THEME.textSecondary,
    lineHeight: 19,
  },
  emptyCta: {
    marginTop: spacing.xs,
    backgroundColor: BADGE_SHOWCASE_THEME.tealDark,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  emptyCtaText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textInverse,
  },
});
