import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

import type { MapDistrictId } from '../data/mapAssets';
import type { MapNeighborhoodStripItem } from '../utils/mapUiPresentation';

type Props = {
  items: MapNeighborhoodStripItem[];
  selectedId?: MapDistrictId;
  onSelect?: (districtId: MapDistrictId) => void;
};

const STATUS_COLORS = {
  active: colors.primary,
  watching: colors.secondary,
  approaching: colors.hubGoldDark,
  preview: colors.textSecondary,
} as const;

export function MapNeighborhoodStrip({ items, selectedId, onSelect }: Props) {
  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText} numberOfLines={2}>
          Mahalle sinyali henüz yok. Gün ilerledikçe saha notları burada görünür.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}>
      {items.map((item) => {
        const selected = item.id === selectedId;
        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect?.(item.id)}
            style={[
              styles.card,
              shadows.soft,
              selected && styles.cardSelected,
            ]}>
            <View style={[styles.accent, { backgroundColor: item.accentColor }]} />
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
            <Text
              style={[
                styles.status,
                { color: STATUS_COLORS[item.status] },
              ]}
              numberOfLines={1}>
              {item.statusLabel}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  card: {
    width: 108,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  cardSelected: {
    borderColor: 'rgba(26,143,138,0.35)',
    backgroundColor: colors.primaryMuted,
  },
  accent: {
    width: 18,
    height: 3,
    borderRadius: 2,
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  status: {
    fontSize: 10,
    fontWeight: '700',
  },
  empty: {
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
