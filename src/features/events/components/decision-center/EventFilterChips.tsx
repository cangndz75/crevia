import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { eventsScreen } from '@/features/events/theme/eventsScreenTokens';
import {
  type EventScreenFilterKey,
  getEventScreenFilters,
} from '@/features/events/utils/eventsScreenModel';
import { shadows } from '@/ui/theme/shadows';

type EventFilterChipsProps = {
  active: EventScreenFilterKey;
  onChange: (key: EventScreenFilterKey) => void;
};

export function EventFilterChips({ active, onChange }: EventFilterChipsProps) {
  const filters = getEventScreenFilters();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {filters.map((f) => {
        const selected = active === f.key;
        return (
          <Pressable
            key={f.key}
            onPress={() => onChange(f.key)}
            style={({ pressed }) => [
              styles.chip,
              !selected && styles.chipIdle,
              !selected && shadows.soft,
              selected && styles.chipActive,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected }}>
            <Ionicons
              name={f.icon as keyof typeof Ionicons.glyphMap}
              size={14}
              color={selected ? '#FFFFFF' : eventsScreen.textMuted}
            />
            <Text style={[styles.chipText, selected && styles.chipTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  chipIdle: {
    backgroundColor: eventsScreen.card,
    borderWidth: 1,
    borderColor: eventsScreen.border,
  },
  chipActive: {
    backgroundColor: eventsScreen.tealDark,
    borderWidth: 1,
    borderColor: eventsScreen.tealDark,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: eventsScreen.textMuted,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
