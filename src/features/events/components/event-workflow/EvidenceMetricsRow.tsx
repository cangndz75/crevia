import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { EvidenceMetric } from '@/features/events/utils/eventWorkflowPresentation';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { shadows } from '@/ui/theme/shadows';

type EvidenceMetricsRowProps = {
  metrics: EvidenceMetric[];
};

export function EvidenceMetricsRow({ metrics }: EvidenceMetricsRowProps) {
  return (
    <View style={[styles.bar, shadows.soft]}>
      {metrics.map((metric, index) => (
        <View key={metric.id} style={styles.itemWrap}>
          <View style={styles.item}>
            <Ionicons name={metric.icon} size={20} color={eventDetail.teal} />
            <Text style={styles.line} numberOfLines={2}>
              {metric.line}
            </Text>
          </View>
          {index < metrics.length - 1 ? <View style={styles.divider} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    marginHorizontal: eventDetail.screenPadding,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  itemWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
    minWidth: 0,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(6, 63, 59, 0.08)',
    marginVertical: 2,
  },
  line: {
    fontSize: 10,
    fontWeight: '700',
    color: eventDetail.textDark,
    textAlign: 'center',
    lineHeight: 13,
  },
});
