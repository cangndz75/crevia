import { useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { buildBadgeShowcaseSummary } from '@/core/badges/badgeShowcaseModel';
import type { BadgeShowcaseItem } from '@/core/badges/badgeShowcaseTypes';
import { BadgeShowcaseDetailModal } from '@/features/progression/components/badgeShowcase/BadgeShowcaseDetailModal';
import { BadgeShowcaseItemCard } from '@/features/progression/components/badgeShowcase/BadgeShowcaseItemCard';
import { ProgressionSectionHeader } from '@/features/progression/components/authorities/ProgressionSectionHeader';
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
        <ProgressionSectionHeader
          title="Rozetler"
          countLabel={summary.countLabel}
          icon="trophy-outline"
        />
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
      <ProgressionSectionHeader
        title="Rozetler"
        countLabel={summary.countLabel}
        icon="trophy-outline"
      />

      <View style={styles.grid}>
        {summary.allItems.map((item) => (
          <BadgeShowcaseItemCard
            key={item.id}
            item={item}
            grid
            onPress={handleItemPress}
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
    marginTop: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
    columnGap: spacing.sm,
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
