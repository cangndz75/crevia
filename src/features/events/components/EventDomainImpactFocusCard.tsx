import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type {
  EventDomainFocusMetric,
  EventDomainFocusModel,
} from '@/core/events/eventDomainPresentationTypes';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';

type Props = {
  model: EventDomainFocusModel | null | undefined;
  metrics?: EventDomainFocusMetric[];
  compact?: boolean;
};

const TONE_TEXT: Record<EventDomainFocusModel['tone'], string> = {
  teal: '#0F6B64',
  mint: '#1A6B66',
  amber: '#9A6B12',
  coral: '#B84A38',
  neutral: '#4A5F5B',
};

export function EventDomainImpactFocusCard({ model, metrics, compact = false }: Props) {
  if (!model) return null;

  const rows = (metrics ?? model.focusMetrics).slice(0, 2);
  const textColor = TONE_TEXT[model.tone];

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.header}>
        <Ionicons name="analytics-outline" size={16} color={textColor} />
        <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
          {compact ? model.shortTitle : model.title}
        </Text>
      </View>
      <Text style={[styles.summary, { color: textColor }]} numberOfLines={2}>
        {model.summary}
      </Text>
      {rows.length > 0 ? (
        <View style={styles.metricRow}>
          {rows.map((m) => (
            <View key={m.id} style={styles.metricChip}>
              <Text style={[styles.metricLabel, { color: textColor }]} numberOfLines={1}>
                {m.label}
              </Text>
              <Text style={styles.metricValue} numberOfLines={1}>
                {m.valueLabel}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: eventDetail.screenPadding,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: eventDetail.card,
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.12)',
    gap: 6,
    minWidth: 0,
    flexShrink: 1,
  },
  cardCompact: {
    paddingVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    flexShrink: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
    minWidth: 0,
  },
  summary: {
    fontSize: 12,
    lineHeight: 17,
    flexShrink: 1,
    minWidth: 0,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    minWidth: 0,
  },
  metricChip: {
    flex: 1,
    minWidth: 100,
    flexShrink: 1,
    backgroundColor: eventDetail.mintSoft,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 11,
    color: eventDetail.textMuted,
    marginTop: 2,
  },
});
