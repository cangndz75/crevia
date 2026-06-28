import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { olaylar } from '@/features/events/theme/olaylarScreenTokens';
import type { OlaylarEventStatItem } from '@/features/events/types/olaylarScreenTypes';

type OlaylarEventMetricsRowProps = {
  items: OlaylarEventStatItem[];
};

export function OlaylarEventMetricsRow({ items }: OlaylarEventMetricsRowProps) {
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View key={item.key} style={[styles.card, olaylar.shadowSoft]}>
          <View style={[styles.iconWrap, { backgroundColor: item.bgColor }]}>
            <Ionicons
              name={item.icon as keyof typeof Ionicons.glyphMap}
              size={14}
              color={item.color}
            />
          </View>
          <Text style={[styles.count, { color: item.color }]}>{item.count}</Text>
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.max(item.percent, item.count > 0 ? 8 : 0)}%`,
                  backgroundColor: item.color,
                },
              ]}
            />
          </View>
          <Text style={styles.percent}>{item.percent}%</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: olaylar.card,
    borderRadius: olaylar.radiusStat,
    borderWidth: 1,
    borderColor: olaylar.border,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 3,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: olaylar.textSoft,
  },
  barTrack: {
    width: '100%',
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginTop: 2,
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  percent: {
    fontSize: 10,
    fontWeight: '600',
    color: olaylar.textMuted,
  },
});
