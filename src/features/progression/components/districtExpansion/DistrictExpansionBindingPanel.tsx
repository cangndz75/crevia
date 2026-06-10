import { useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { buildDistrictOperationUnlockBindingSummary } from '@/core/progression/districtOperationUnlockBindingModel';
import type {
  DistrictUnlockBindingItem,
  MainOperationBindingItem,
} from '@/core/progression/districtOperationUnlockBindingTypes';
import { DistrictExpansionCategoryBlock } from '@/features/progression/components/districtExpansion/DistrictExpansionCategoryBlock';
import { DistrictExpansionDetailModal } from '@/features/progression/components/districtExpansion/DistrictExpansionDetailModal';
import { DistrictExpansionItemCard } from '@/features/progression/components/districtExpansion/DistrictExpansionItemCard';
import { DistrictExpansionSummaryCard } from '@/features/progression/components/districtExpansion/DistrictExpansionSummaryCard';
import { DISTRICT_EXPANSION_THEME } from '@/features/progression/utils/districtExpansionTheme';
import { spacing } from '@/ui/theme/spacing';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';

type DistrictExpansionBindingPanelProps = {
  currentDay: number;
  pilotDay: number;
  authorityState: unknown;
  mainOperationSeason?: unknown;
  operationSignals?: unknown;
  socialPulse?: unknown;
};

function MainOperationLinkCard({ item }: { item: MainOperationBindingItem }) {
  return (
    <View style={styles.mainOpCard}>
      <Text style={styles.mainOpTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.mainOpSubtitle} numberOfLines={2}>
        {item.subtitle}
      </Text>
      <Text style={styles.mainOpBenefit} numberOfLines={2}>
        {item.playerBenefit}
      </Text>
      {item.linkedSystemLabels.length > 0 ? (
        <View style={styles.chipRow}>
          {item.linkedSystemLabels.slice(0, 3).map((label) => (
            <Text key={label} style={styles.chip} numberOfLines={1}>
              {label}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function DistrictExpansionBindingPanel({
  currentDay,
  pilotDay,
  authorityState,
  mainOperationSeason,
  operationSignals,
  socialPulse,
}: DistrictExpansionBindingPanelProps) {
  const router = useRouter();
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictUnlockBindingItem | null>(null);

  const summary = useMemo(
    () =>
      buildDistrictOperationUnlockBindingSummary({
        currentDay,
        pilotDay,
        authorityState,
        mainOperationSeason,
        operationSignals,
        socialPulse,
      }),
    [
      authorityState,
      currentDay,
      mainOperationSeason,
      operationSignals,
      pilotDay,
      socialPulse,
    ],
  );

  return (
    <Animated.View entering={FadeIn.duration(280)} style={styles.wrap}>
      <DistrictExpansionSummaryCard summary={summary} />

      {summary.activeDistricts.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aktif mahalleler</Text>
          <View style={styles.grid}>
            {summary.activeDistricts.map((item) => (
              <DistrictExpansionItemCard
                key={item.id}
                item={item}
                onPress={setSelectedDistrict}
              />
            ))}
          </View>
        </View>
      ) : null}

      {summary.nextDistricts.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sıradaki açılım</Text>
          <Text style={styles.sectionHint}>Bir sonraki şehir hedefin burada.</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalRow}>
            {summary.nextDistricts.map((item) => (
              <DistrictExpansionItemCard
                key={item.id}
                item={item}
                onPress={setSelectedDistrict}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {summary.mainOperationLinks.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ana operasyon bağları</Text>
          {summary.mainOperationLinks.slice(0, 3).map((item) => (
            <MainOperationLinkCard key={item.id} item={item} />
          ))}
        </View>
      ) : null}

      {summary.lockedDistricts.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kilitli açılımlar</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalRow}>
            {summary.lockedDistricts.map((item) => (
              <DistrictExpansionItemCard
                key={item.id}
                item={item}
                compact
                onPress={setSelectedDistrict}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {summary.recommendedNextStep ? (
        <View style={styles.recommendedCard}>
          <Text style={styles.recommendedTitle}>{summary.recommendedNextStep.title}</Text>
          <Text style={styles.recommendedHint} numberOfLines={2}>
            {summary.recommendedNextStep.hint}
          </Text>
          <Pressable
            style={styles.recommendedCta}
            onPress={() => router.push('/progression' as Href)}
            accessibilityRole="button"
            accessibilityLabel={summary.recommendedNextStep.ctaLabel}>
            <Text style={styles.recommendedCtaText}>{summary.recommendedNextStep.ctaLabel}</Text>
          </Pressable>
        </View>
      ) : null}

      {summary.categoryBlocks.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kategori özeti</Text>
          {summary.categoryBlocks.map((block) => (
            <DistrictExpansionCategoryBlock
              key={block.id}
              block={block}
              onItemPress={setSelectedDistrict}
            />
          ))}
        </View>
      ) : null}

      <DistrictExpansionDetailModal
        item={selectedDistrict}
        visible={selectedDistrict != null}
        onClose={() => setSelectedDistrict(null)}
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
    color: DISTRICT_EXPANSION_THEME.textPrimary,
  },
  sectionHint: {
    fontSize: 12,
    fontWeight: '500',
    color: DISTRICT_EXPANSION_THEME.textSecondary,
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
  mainOpCard: {
    backgroundColor: DISTRICT_EXPANSION_THEME.mintSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(26,143,138,0.16)',
    padding: spacing.md,
    gap: 6,
  },
  mainOpTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: DISTRICT_EXPANSION_THEME.textPrimary,
  },
  mainOpSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: DISTRICT_EXPANSION_THEME.textSecondary,
    lineHeight: 16,
  },
  mainOpBenefit: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    lineHeight: 15,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primaryMuted,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  recommendedCard: {
    backgroundColor: colors.hubGoldMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(216,167,46,0.24)',
    padding: spacing.md,
    gap: spacing.xs,
  },
  recommendedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: DISTRICT_EXPANSION_THEME.textPrimary,
  },
  recommendedHint: {
    fontSize: 12,
    fontWeight: '500',
    color: DISTRICT_EXPANSION_THEME.textSecondary,
    lineHeight: 16,
  },
  recommendedCta: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  recommendedCtaText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.surface,
  },
});
