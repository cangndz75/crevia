import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ResolvedEventRow } from '@/features/events/components/olaylar/ResolvedEventRow';
import { olaylar } from '@/features/events/theme/olaylarScreenTokens';
import type { OlaylarResolvedEventView } from '@/features/events/types/olaylarScreenTypes';

type ResolvedEventListProps = {
  items: OlaylarResolvedEventView[];
  onSeeAll?: () => void;
  onItemPress?: (id: string) => void;
};

export function ResolvedEventList({ items, onSeeAll, onItemPress }: ResolvedEventListProps) {
  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Çözülen Olaylar</Text>
        <Pressable
          onPress={onSeeAll}
          style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Tümünü Gör">
          <Text style={styles.seeAllText}>Tümünü Gör</Text>
          <Ionicons name="chevron-forward" size={14} color={olaylar.textMuted} />
        </Pressable>
      </View>

      <View style={styles.listCard}>
        {items.map((item, index) => (
          <ResolvedEventRow
            key={item.id}
            item={item}
            isLast={index === items.length - 1}
            onPress={() => onItemPress?.(item.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: olaylar.text,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: olaylar.textMuted,
  },
  pressed: {
    opacity: 0.85,
  },
  listCard: {
    borderRadius: olaylar.radiusCard,
    borderWidth: 1,
    borderColor: olaylar.border,
    backgroundColor: olaylar.card,
    overflow: 'hidden',
    ...olaylar.shadowSoft,
  },
});
