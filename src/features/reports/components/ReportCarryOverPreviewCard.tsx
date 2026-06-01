import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { CarryOverMemoryModel } from '@/core/carryOver';

type Props = {
  memory: CarryOverMemoryModel | null | undefined;
  compact?: boolean;
};

const TONE_TEXT: Record<CarryOverMemoryModel['tone'], string> = {
  calm: '#4A5F5B',
  positive: '#0F6B64',
  warning: '#9A6B12',
  strategic: '#3F5C6B',
  muted: '#6B6560',
};

export function ReportCarryOverPreviewCard({ memory, compact = false }: Props) {
  if (!memory?.visible) return null;

  const textColor = TONE_TEXT[memory.tone];
  const tags = [memory.primaryTag, memory.secondaryTag].filter(Boolean).slice(0, 2);

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.header}>
        <Ionicons name="calendar-outline" size={18} color={textColor} />
        <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
          {memory.title}
        </Text>
      </View>
      <Text style={[styles.summary, { color: textColor }]} numberOfLines={memory.maxLines}>
        {memory.summary}
      </Text>
      {tags.length > 0 ? (
        <View style={styles.tagRow}>
          {tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={[styles.tagText, { color: textColor }]} numberOfLines={1}>
                {tag}
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
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.12)',
    gap: 8,
    minWidth: 0,
    flexShrink: 1,
  },
  cardCompact: {
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
    flexShrink: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
    minWidth: 0,
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 1,
    minWidth: 0,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    minWidth: 0,
  },
  tag: {
    borderRadius: 8,
    backgroundColor: '#EEF9F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '48%',
    flexShrink: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
