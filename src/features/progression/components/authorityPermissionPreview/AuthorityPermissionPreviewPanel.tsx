import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { buildAuthorityPermissionPreviewSummary } from '@/core/authority/authorityPermissionPreviewModel';
import type { AuthorityPermissionPreviewItem } from '@/core/authority/authorityPermissionPreviewTypes';
import { AuthorityPermissionCategoryBlock } from '@/features/progression/components/authorityPermissionPreview/AuthorityPermissionCategoryBlock';
import { AuthorityPermissionDetailModal } from '@/features/progression/components/authorityPermissionPreview/AuthorityPermissionDetailModal';
import { AuthorityPermissionItemCard } from '@/features/progression/components/authorityPermissionPreview/AuthorityPermissionItemCard';
import { AuthorityPermissionSummaryCard } from '@/features/progression/components/authorityPermissionPreview/AuthorityPermissionSummaryCard';
import { AUTHORITY_PERMISSION_PREVIEW_THEME } from '@/features/progression/utils/authorityPermissionPreviewTheme';
import { spacing } from '@/ui/theme/spacing';

type AuthorityPermissionPreviewPanelProps = {
  authorityState: unknown;
  pilotDay: number;
  totalXp?: number;
};

export function AuthorityPermissionPreviewPanel({
  authorityState,
  pilotDay,
  totalXp = 0,
}: AuthorityPermissionPreviewPanelProps) {
  const [selectedItem, setSelectedItem] = useState<AuthorityPermissionPreviewItem | null>(null);

  const summary = useMemo(
    () =>
      buildAuthorityPermissionPreviewSummary({
        authorityState,
        day: pilotDay,
        xp: totalXp,
      }),
    [authorityState, pilotDay, totalXp],
  );

  const handleItemPress = (item: AuthorityPermissionPreviewItem) => {
    setSelectedItem(item);
  };

  return (
    <Animated.View entering={FadeIn.duration(280)} style={styles.wrap}>
      <AuthorityPermissionSummaryCard summary={summary} />

      {summary.currentUnlocks.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Açık izinler</Text>
          <View style={styles.grid}>
            {summary.currentUnlocks.map((item) => (
              <AuthorityPermissionItemCard
                key={item.id}
                item={item}
                onPress={handleItemPress}
              />
            ))}
          </View>
        </View>
      ) : null}

      {summary.nextUnlocks.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sıradaki terfide açılacaklar</Text>
          <Text style={styles.sectionHint}>Bir sonraki hedefin burada.</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalRow}>
            {summary.nextUnlocks.map((item) => (
              <AuthorityPermissionItemCard
                key={item.id}
                item={item}
                onPress={handleItemPress}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {summary.futureUnlocks.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İleri yetki kilitleri</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalRow}>
            {summary.futureUnlocks.map((item) => (
              <AuthorityPermissionItemCard
                key={item.id}
                item={item}
                compact
                onPress={handleItemPress}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kategori vitrini</Text>
        {summary.categoryBlocks.map((block) => (
          <AuthorityPermissionCategoryBlock
            key={block.category}
            block={block}
            onItemPress={handleItemPress}
          />
        ))}
      </View>

      <AuthorityPermissionDetailModal
        item={selectedItem}
        visible={selectedItem != null}
        onClose={() => setSelectedItem(null)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: AUTHORITY_PERMISSION_PREVIEW_THEME.textPrimary,
    letterSpacing: -0.2,
  },
  sectionHint: {
    fontSize: 12,
    fontWeight: '500',
    color: AUTHORITY_PERMISSION_PREVIEW_THEME.textSecondary,
    marginTop: -4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  horizontalRow: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
});
