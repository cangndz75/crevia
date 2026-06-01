import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { ReportTomorrowPreviewModel } from '@/core/reports/reportTomorrowPreviewTypes';

type Props = {
  preview: ReportTomorrowPreviewModel | null | undefined;
  compact?: boolean;
};

const TONE_ACCENT: Record<ReportTomorrowPreviewModel['tone'], string> = {
  calm: '#4A5F5B',
  positive: '#0F6B64',
  warning: '#9A6B12',
  strategic: '#3F5C6B',
  muted: '#6B6560',
};

const TONE_BORDER: Record<ReportTomorrowPreviewModel['tone'], string> = {
  calm: 'rgba(74, 95, 91, 0.14)',
  positive: 'rgba(15, 107, 100, 0.16)',
  warning: 'rgba(154, 107, 18, 0.16)',
  strategic: 'rgba(63, 92, 107, 0.16)',
  muted: 'rgba(107, 101, 96, 0.14)',
};

function resolveIcon(name: string): keyof typeof Ionicons.glyphMap {
  const known = name as keyof typeof Ionicons.glyphMap;
  return known in Ionicons.glyphMap ? known : 'time-outline';
}

export function ReportTomorrowPreviewCard({ preview, compact = false }: Props) {
  if (!preview || preview.visibility === 'hidden') return null;

  const isCompact = compact || preview.visibility === 'compact' || preview.visibility === 'final_safe';
  const accent = TONE_ACCENT[preview.tone];
  const tags = [preview.primaryTag, preview.secondaryTag].filter(Boolean).slice(0, 2);

  return (
    <View
      style={[
        styles.card,
        isCompact && styles.cardCompact,
        { borderColor: TONE_BORDER[preview.tone] },
      ]}
    >
      <View style={styles.header}>
        <Ionicons name={resolveIcon(preview.iconKey)} size={18} color={accent} />
        <Text style={[styles.title, { color: accent }]} numberOfLines={1}>
          {preview.title}
        </Text>
      </View>
      <Text
        style={[styles.summary, { color: accent }]}
        numberOfLines={preview.maxLines}
      >
        {preview.summary}
      </Text>
      {tags.length > 0 ? (
        <View style={styles.tagRow}>
          {tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={[styles.tagText, { color: accent }]} numberOfLines={1}>
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
    minWidth: 0,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
