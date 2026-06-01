import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { MapBeforeAfterImpactModel } from '@/core/mapPresence/mapBeforeAfterTypes';

type Props = {
  impact: MapBeforeAfterImpactModel | null | undefined;
  compact?: boolean;
};

const TONE_ACCENT: Record<MapBeforeAfterImpactModel['tone'], string> = {
  positive: '#0F6B64',
  mixed: '#6B5E48',
  warning: '#9A6B12',
  strategic: '#3F5C6B',
  muted: '#6B6560',
};

const TONE_BORDER: Record<MapBeforeAfterImpactModel['tone'], string> = {
  positive: 'rgba(15, 107, 100, 0.16)',
  mixed: 'rgba(107, 94, 72, 0.14)',
  warning: 'rgba(154, 107, 18, 0.16)',
  strategic: 'rgba(63, 92, 107, 0.16)',
  muted: 'rgba(107, 101, 96, 0.14)',
};

function resolveIcon(name: string): keyof typeof Ionicons.glyphMap {
  const known = name as keyof typeof Ionicons.glyphMap;
  return known in Ionicons.glyphMap ? known : 'map-outline';
}

export function EventMapImpactSummaryCard({ impact, compact = false }: Props) {
  if (!impact?.visible) return null;

  const accent = TONE_ACCENT[impact.tone];
  const tags = [impact.primaryTag, impact.secondaryTag].filter(Boolean).slice(0, 2);
  const isCompact = compact;

  return (
    <View
      style={[
        styles.card,
        isCompact && styles.cardCompact,
        { borderColor: TONE_BORDER[impact.tone] },
      ]}
    >
      <View style={styles.header}>
        <Ionicons name={resolveIcon(impact.iconKey)} size={18} color={accent} />
        <Text style={[styles.title, { color: accent }]} numberOfLines={1}>
          {impact.title}
        </Text>
      </View>

      <View style={styles.flowRow}>
        <Text style={styles.flowBefore} numberOfLines={1}>
          {impact.beforeLabel}
        </Text>
        <Ionicons name="arrow-forward" size={12} color={accent} style={styles.flowArrow} />
        <Text style={[styles.flowAfter, { color: accent }]} numberOfLines={1}>
          {impact.afterLabel}
        </Text>
      </View>

      <Text style={styles.summary} numberOfLines={impact.maxLines}>
        {impact.summary}
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
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
    minWidth: 0,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    flexShrink: 1,
  },
  flowBefore: {
    fontSize: 13,
    color: '#6B6560',
    flexShrink: 1,
    minWidth: 0,
  },
  flowArrow: {
    flexShrink: 0,
  },
  flowAfter: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
    minWidth: 0,
  },
  summary: {
    fontSize: 13,
    lineHeight: 18,
    color: '#4A4540',
    flexShrink: 1,
    minWidth: 0,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 107, 100, 0.06)',
    maxWidth: '48%',
    minWidth: 0,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
  },
});
