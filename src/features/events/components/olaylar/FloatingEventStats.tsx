import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { olaylar } from '@/features/events/theme/olaylarScreenTokens';
import type { OlaylarEventStats } from '@/features/events/types/olaylarScreenTypes';

type FloatingEventStatsProps = {
  stats: OlaylarEventStats;
};

const STAT_ITEMS = [
  { key: 'critical' as const, label: 'Kritik', icon: 'shield' as const, color: olaylar.critical },
  { key: 'urgent' as const, label: 'Acil', icon: 'notifications' as const, color: olaylar.urgent },
  { key: 'active' as const, label: 'Aktif', icon: 'flash' as const, color: olaylar.active },
  {
    key: 'resolved' as const,
    label: 'Çözüldü',
    icon: 'checkmark-circle' as const,
    color: olaylar.success,
  },
];

/** @deprecated OlaylarEventMetricsRow kullanın. Geriye dönük export korunur. */
export function FloatingEventStats({ stats }: FloatingEventStatsProps) {
  return (
    <View style={styles.row} pointerEvents="none">
      {STAT_ITEMS.map((item) => (
        <View key={item.key} style={[styles.card, olaylar.shadowSoft]}>
          <Ionicons name={item.icon} size={16} color={item.color} />
          <Text style={styles.count}>{stats[item.key]}</Text>
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    top: 14,
    left: olaylar.screenPadding,
    right: olaylar.screenPadding,
    flexDirection: 'row',
    gap: 7,
    zIndex: 2,
  },
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: olaylar.card,
    borderRadius: olaylar.radiusStat,
    paddingVertical: 7,
    paddingHorizontal: 5,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: olaylar.border,
  },
  count: {
    fontSize: 15,
    fontWeight: '800',
    color: olaylar.text,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: olaylar.textMuted,
  },
});
