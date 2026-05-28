import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { SignalSummaryItem } from '@/features/events/utils/eventWorkflowPresentation';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { shadows } from '@/ui/theme/shadows';

type SignalSummaryCardProps = {
  items: SignalSummaryItem[];
};

type ColumnMeta = {
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
};

const COLUMN_META: Record<string, ColumnMeta> = {
  field: { icon: 'people', color: eventDetail.teal },
  citizen: { icon: 'person', color: '#3B82C6' },
  social: { icon: 'chatbubble-ellipses', color: '#7C5CBF' },
};

function dotColor(level: SignalSummaryItem['level']) {
  switch (level) {
    case 'high':
      return eventDetail.red;
    case 'medium':
      return eventDetail.orange;
    default:
      return eventDetail.success;
  }
}

function SignalBroadcastIcon() {
  return (
    <View style={styles.broadcastIcon} accessibilityElementsHidden>
      <Text style={styles.broadcastParen}>(</Text>
      <Text style={styles.broadcastParen}>(</Text>
      <View style={styles.broadcastDot} />
      <Text style={styles.broadcastParen}>)</Text>
      <Text style={styles.broadcastParen}>)</Text>
    </View>
  );
}

export function SignalSummaryCard({ items }: SignalSummaryCardProps) {
  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <SignalBroadcastIcon />
          <Text style={styles.headerTitle}>Sinyal Özeti</Text>
        </View>
        <Ionicons name="information-circle-outline" size={18} color={eventDetail.textMuted} />
      </View>

      <View style={styles.columns}>
        {items.map((item, index) => {
          const meta = COLUMN_META[item.id] ?? COLUMN_META.field;
          const isLast = index === items.length - 1;

          return (
            <View key={item.id} style={styles.columnWrap}>
              <View style={styles.column}>
                <Ionicons name={meta.icon} size={20} color={meta.color} />
                <Text style={styles.metricLabel}>{item.label}</Text>
                <View style={styles.metricValueRow}>
                  <View style={[styles.dot, { backgroundColor: dotColor(item.level) }]} />
                  <Text style={styles.metricValue}>{item.levelLabel}</Text>
                </View>
              </View>
              {!isLast ? <View style={styles.divider} /> : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: eventDetail.screenPadding,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.cardRadius,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  broadcastIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  broadcastParen: {
    fontSize: 11,
    fontWeight: '700',
    color: eventDetail.teal,
    lineHeight: 14,
  },
  broadcastDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: eventDetail.teal,
    marginHorizontal: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  columnWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(6, 63, 59, 0.1)',
    marginVertical: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: eventDetail.textMuted,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
});
