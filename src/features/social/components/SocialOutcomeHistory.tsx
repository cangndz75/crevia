import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import type { SocialOutcomeItem } from '../utils/socialUiModel';

type Props = {
  outcomes: SocialOutcomeItem[];
  onViewAll?: () => void;
};

function OutcomeChip({ item }: { item: SocialOutcomeItem }) {
  const positive = item.delta >= 0;
  const chipBg = positive ? colors.successMuted : colors.dangerMuted;
  const chipColor = positive ? colors.success : colors.danger;
  const deltaText = positive ? `+${item.delta}` : `${item.delta}`;

  return (
    <View style={[styles.chip, shadows.soft]}>
      <View style={styles.chipIcon}>
        <Ionicons name={item.icon} size={16} color={colors.primary} />
      </View>
      <View style={styles.chipContent}>
        <Text style={styles.chipLabel} numberOfLines={1}>
          {item.label}
        </Text>
        <Text style={styles.chipDesc} numberOfLines={1}>
          {item.description}
        </Text>
      </View>
      <View style={[styles.deltaChip, { backgroundColor: chipBg }]}>
        <Text style={[styles.deltaText, { color: chipColor }]}>
          {deltaText} Nabız
        </Text>
      </View>
    </View>
  );
}

export function SocialOutcomeHistory({ outcomes, onViewAll }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Sosyal Sonuç Geçmişi</Text>
        <Pressable onPress={onViewAll} hitSlop={8}>
          <Text style={styles.viewAllLink}>Tüm Geçmişi Gör &gt;</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {outcomes.map((o) => (
          <OutcomeChip key={o.id} item={o} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 200,
  },
  chipIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipContent: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  chipDesc: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  deltaChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  deltaText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
