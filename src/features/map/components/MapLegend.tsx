import { StyleSheet, Text, View } from 'react-native';

import { mapUi } from '@/features/map/utils/mapUiTokens';
import { shadows } from '@/ui/theme/shadows';

import type { MapFilterId } from '../types/map';

type LegendItem = { color: string; label: string };

type Props = {
  filter: MapFilterId;
};

const EVENT_RISK_LEGEND: LegendItem[] = [
  { color: mapUi.riskCritical, label: 'Kritik' },
  { color: mapUi.riskHigh, label: 'Yüksek' },
  { color: mapUi.riskMedium, label: 'Orta' },
  { color: mapUi.riskNormal, label: 'Normal' },
];

const COMPACT_LEGENDS: Record<MapFilterId, LegendItem[]> = {
  events: EVENT_RISK_LEGEND,
  risk: EVENT_RISK_LEGEND,
  crews: [
    { color: '#7B5BB8', label: 'Ekip' },
    { color: '#5B8FD4', label: 'Rota' },
  ],
  vehicles: [
    { color: '#5B8FD4', label: 'Görevde' },
    { color: mapUi.riskNormal, label: 'Hazır' },
    { color: mapUi.riskHigh, label: 'Bakım' },
  ],
  containers: [
    { color: mapUi.riskCritical, label: 'Kritik' },
    { color: mapUi.riskHigh, label: 'Orta' },
    { color: mapUi.riskNormal, label: 'Normal' },
  ],
};

export function MapLegend({ filter }: Props) {
  const items = COMPACT_LEGENDS[filter];

  return (
    <View style={[styles.wrap, shadows.soft]}>
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
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    maxWidth: '78%',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    zIndex: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: mapUi.textSecondary,
  },
});
