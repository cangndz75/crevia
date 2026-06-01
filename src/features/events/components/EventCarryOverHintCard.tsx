import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { CarryOverMemoryModel } from '@/core/carryOver';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';

type Props = {
  memory: CarryOverMemoryModel | null | undefined;
  compact?: boolean;
};

export function EventCarryOverHintCard({ memory, compact = false }: Props) {
  if (!memory?.visible) return null;

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.row}>
        <Ionicons name="arrow-forward-circle-outline" size={14} color={eventDetail.teal} />
        <Text style={styles.title} numberOfLines={1}>
          {memory.title}
        </Text>
      </View>
      <Text style={styles.summary} numberOfLines={memory.maxLines}>
        {memory.summary}
      </Text>
      {memory.primaryTag ? (
        <Text style={styles.tag} numberOfLines={1}>
          {memory.primaryTag}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: eventDetail.screenPadding,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: eventDetail.mintSoft,
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.12)',
    gap: 4,
    minWidth: 0,
    flexShrink: 1,
  },
  cardCompact: {
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    flexShrink: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: eventDetail.teal,
    flexShrink: 1,
    minWidth: 0,
  },
  summary: {
    fontSize: 11,
    lineHeight: 16,
    color: eventDetail.textMuted,
    flexShrink: 1,
    minWidth: 0,
  },
  tag: {
    fontSize: 10,
    fontWeight: '600',
    color: eventDetail.teal,
    alignSelf: 'flex-start',
  },
});
