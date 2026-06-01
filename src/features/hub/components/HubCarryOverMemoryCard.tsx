import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { CarryOverMemoryModel } from '@/core/carryOver';
import { HUB_PREMIUM_RADIUS } from '@/features/hub/utils/hubPremiumPresentation';
import { spacing } from '@/ui/theme/spacing';

type Props = {
  memory: CarryOverMemoryModel | null | undefined;
  compact?: boolean;
};

const TONE_STYLES: Record<
  CarryOverMemoryModel['tone'],
  { bg: string; border: string; text: string }
> = {
  calm: { bg: '#F4F7F6', border: 'rgba(100, 130, 125, 0.2)', text: '#4A5F5B' },
  positive: { bg: '#E8F7F2', border: 'rgba(15, 143, 134, 0.22)', text: '#0F6B64' },
  warning: { bg: '#FFF6E8', border: 'rgba(214, 162, 60, 0.3)', text: '#9A6B12' },
  strategic: { bg: '#EEF4F8', border: 'rgba(60, 100, 130, 0.2)', text: '#3F5C6B' },
  muted: { bg: '#F7F5F0', border: 'rgba(120, 110, 90, 0.15)', text: '#6B6560' },
};

function iconName(key: string): keyof typeof Ionicons.glyphMap {
  const map: Record<string, keyof typeof Ionicons.glyphMap> = {
    'trash-outline': 'trash-outline',
    'car-outline': 'car-outline',
    'people-outline': 'people-outline',
    'chatbubbles-outline': 'chatbubbles-outline',
    'pulse-outline': 'pulse-outline',
    'map-outline': 'map-outline',
    'time-outline': 'time-outline',
  };
  return map[key] ?? 'bookmark-outline';
}

export function HubCarryOverMemoryCard({ memory, compact = false }: Props) {
  if (!memory?.visible) return null;

  const accent = TONE_STYLES[memory.tone];
  const tags = [memory.primaryTag, memory.secondaryTag].filter(Boolean).slice(0, 2);

  return (
    <View
      style={[
        styles.card,
        compact && styles.cardCompact,
        { backgroundColor: accent.bg, borderColor: accent.border },
      ]}
      accessibilityRole="summary">
      <View style={styles.header}>
        <Ionicons name={iconName(memory.iconKey)} size={compact ? 14 : 16} color={accent.text} />
        <Text style={[styles.title, { color: accent.text }]} numberOfLines={1}>
          {memory.title}
        </Text>
      </View>
      <Text
        style={[styles.summary, { color: accent.text }]}
        numberOfLines={memory.maxLines}
        ellipsizeMode="tail">
        {memory.summary}
      </Text>
      {tags.length > 0 ? (
        <View style={styles.tagRow}>
          {tags.map((tag) => (
            <View key={tag} style={[styles.tag, { borderColor: accent.border }]}>
              <Text style={[styles.tagText, { color: accent.text }]} numberOfLines={1}>
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
    marginHorizontal: spacing.md,
    borderRadius: HUB_PREMIUM_RADIUS.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    gap: 6,
    minWidth: 0,
    flexShrink: 1,
  },
  cardCompact: {
    paddingVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
    flexShrink: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  summary: {
    fontSize: 12,
    lineHeight: 17,
    flexShrink: 1,
    minWidth: 0,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    minWidth: 0,
  },
  tag: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    maxWidth: '48%',
    flexShrink: 1,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
