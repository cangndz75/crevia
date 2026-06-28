import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { olaylar } from '@/features/events/theme/olaylarScreenTokens';
import type { OlaylarTimelineItem } from '@/features/events/types/olaylarScreenTypes';

type OlaylarIncidentTimelineProps = {
  items: OlaylarTimelineItem[];
  liveLabel?: string;
};

const TONE_COLORS = {
  critical: olaylar.critical,
  urgent: olaylar.urgent,
  active: olaylar.active,
  resolved: olaylar.success,
} as const;

export function OlaylarIncidentTimeline({
  items,
  liveLabel = 'CANLI',
}: OlaylarIncidentTimelineProps) {
  return (
    <View style={styles.root}>
      <View style={styles.playWrap}>
        <Ionicons name="play" size={11} color={olaylar.teal} />
      </View>

      <View style={styles.itemsRow}>
        {items.map((item) => (
          <View key={item.id} style={styles.item}>
            <Text style={styles.time}>{item.time}</Text>
            <Text style={[styles.label, { color: TONE_COLORS[item.tone] }]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.liveWrap}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>{liveLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(4, 18, 16, 0.82)',
    borderTopWidth: 1,
    borderTopColor: olaylar.border,
  },
  playWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(20, 184, 166, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
  item: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  time: {
    fontSize: 12,
    fontWeight: '700',
    color: olaylar.text,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
  liveWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: olaylar.liveDot,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: olaylar.liveDot,
    letterSpacing: 0.4,
  },
});
