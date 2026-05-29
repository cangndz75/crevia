import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';

import type { MapFilterId } from '../types/map';

type LegendItem = { color: string; label: string };

type Props = {
  filter: MapFilterId;
};

const COMPACT_LEGENDS: Record<MapFilterId, LegendItem[]> = {
  events: [
    { color: colors.danger, label: 'Kritik' },
    { color: colors.warning, label: 'Orta' },
    { color: colors.primary, label: 'Normal' },
  ],
  risk: [
    { color: colors.danger, label: 'Kritik' },
    { color: colors.warning, label: 'Orta' },
    { color: colors.success, label: 'Normal' },
  ],
  crews: [
    { color: colors.purple, label: 'Ekip' },
    { color: colors.purple, label: 'Rota' },
  ],
  vehicles: [
    { color: colors.secondary, label: 'Görevde' },
    { color: colors.success, label: 'Hazır' },
    { color: colors.warning, label: 'Bakım' },
  ],
  containers: [
    { color: colors.danger, label: 'Kritik' },
    { color: colors.warning, label: 'Orta' },
    { color: colors.success, label: 'Normal' },
  ],
};

export function MapLegend({ filter }: Props) {
  const items = COMPACT_LEGENDS[filter];

  return (
    <View style={styles.wrap}>
      {items.map((item) => (
        <View key={item.label} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(26,143,138,0.12)',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minWidth: 0,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  label: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
