import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

import { mapFilters } from '../data/mapMockData';
import type { MapFilterId } from '../types/map';

type Props = {
  selected: MapFilterId;
  onSelect: (id: MapFilterId) => void;
};

export function MapFilterTabs({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {mapFilters.map((filter) => {
        const active = filter.id === selected;
        return (
          <Pressable
            key={filter.id}
            onPress={() => onSelect(filter.id)}
            style={[
              styles.chip,
              active && { borderColor: filter.activeColor, backgroundColor: colors.surface },
            ]}
          >
            <Ionicons
              name={filter.icon as keyof typeof Ionicons.glyphMap}
              size={16}
              color={active ? filter.activeColor : colors.textSecondary}
            />
            <Text
              style={[
                styles.chipText,
                active && { color: filter.activeColor, fontWeight: '800' },
              ]}
              numberOfLines={1}
            >
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minWidth: 0,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    flexShrink: 1,
  },
});
