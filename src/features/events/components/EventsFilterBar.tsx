import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

export type EventsFilterKey = 'all' | 'urgent' | 'crisis' | 'opportunity' | 'solved';

const FILTERS: { key: EventsFilterKey; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'urgent', label: 'Acil' },
  { key: 'crisis', label: 'Kriz' },
  { key: 'opportunity', label: 'Fırsat' },
  { key: 'solved', label: 'Çözüldü' },
];

type EventsFilterBarProps = {
  active: EventsFilterKey;
  onChange: (key: EventsFilterKey) => void;
};

export function EventsFilterBar({ active, onChange }: EventsFilterBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {FILTERS.map((f) => {
        const selected = active === f.key;
        return (
          <Pressable
            key={f.key}
            onPress={() => onChange(f.key)}
            style={[styles.chip, selected && styles.chipActive]}>
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
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textInverse,
    fontWeight: '700',
  },
});
