import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import type { MapFilterChipItem } from '@/features/map/presentation/mapScreenPresentation';
import { mapUi } from '@/features/map/utils/mapUiTokens';
import { colors } from '@/ui/theme/colors';
import { shadows } from '@/ui/theme/shadows';

import type { MapFilterId } from '../types/map';

type Props = {
  chips: MapFilterChipItem[];
  onSelectFilter?: (filterId: MapFilterId) => void;
};

export function MapFilterChips({ chips, onSelectFilter }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}>
      {chips.map((chip) => {
        const filled = chip.variant === 'filled';
        const pressable = chip.filterId != null;

        return (
          <Pressable
            key={chip.id}
            disabled={!pressable}
            onPress={() => {
              if (chip.filterId && onSelectFilter) {
                onSelectFilter(chip.filterId);
              }
            }}
            style={[
              styles.chip,
              filled ? styles.chipFilled : styles.chipOutline,
              shadows.soft,
            ]}>
            {chip.icon ? (
              <Ionicons
                name={chip.icon}
                size={16}
                color={filled ? colors.textInverse : mapUi.teal}
              />
            ) : null}
            <Text
              style={[styles.chipText, filled ? styles.chipTextFilled : styles.chipTextOutline]}
              numberOfLines={1}>
              {chip.label}
            </Text>
            {chip.showChevron ? (
              <Ionicons
                name="chevron-down"
                size={14}
                color={filled ? 'rgba(255,255,255,0.85)' : mapUi.teal}
              />
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 10,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 21,
    flexShrink: 0,
    minWidth: 0,
  },
  chipFilled: {
    backgroundColor: mapUi.teal,
    borderWidth: 1,
    borderColor: mapUi.tealDark,
  },
  chipOutline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.14)',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 0,
  },
  chipTextFilled: {
    color: colors.textInverse,
  },
  chipTextOutline: {
    color: colors.headerTealDark,
  },
});
