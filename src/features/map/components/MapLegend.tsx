import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';

import type { MapFilterId } from '../types/map';

type LegendItem = { color: string; label: string };

type Props = {
  filter: MapFilterId;
};

const LEGENDS: Record<MapFilterId, LegendItem[]> = {
  events: [
    { color: colors.primary, label: 'Olay' },
    { color: colors.warning, label: 'Şikayet' },
    { color: colors.danger, label: 'Kritik' },
  ],
  risk: [
    { color: colors.danger, label: 'Yüksek' },
    { color: colors.warning, label: 'Orta' },
    { color: colors.success, label: 'Düşük' },
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
    { color: colors.success, label: '<%25' },
    { color: colors.hubGold, label: '%25-75' },
    { color: colors.warning, label: '%75-95' },
    { color: colors.danger, label: '%95+' },
  ],
};

export function MapLegend({ filter }: Props) {
  const items = LEGENDS[filter];

  return (
    <View style={[styles.wrap, shadows.soft]}>
      <Text style={styles.title}>Gösterge</Text>
      {items.map((item) => (
        <View key={item.label} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
