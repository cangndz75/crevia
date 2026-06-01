import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type {
  EventDomainFocusModel,
  EventDomainUiSurface,
} from '@/core/events/eventDomainPresentationTypes';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';

type Props = {
  model: EventDomainFocusModel | null | undefined;
  compact?: boolean;
  surface?: EventDomainUiSurface;
};

const TONE_ACCENT: Record<EventDomainFocusModel['tone'], { bg: string; border: string; text: string }> = {
  teal: { bg: '#E8F7F2', border: 'rgba(15, 143, 134, 0.22)', text: '#0F6B64' },
  mint: { bg: '#EEF9F3', border: 'rgba(26, 143, 138, 0.18)', text: '#1A6B66' },
  amber: { bg: '#FFF6E8', border: 'rgba(214, 162, 60, 0.3)', text: '#9A6B12' },
  coral: { bg: '#FFF0EC', border: 'rgba(200, 90, 70, 0.25)', text: '#B84A38' },
  neutral: { bg: '#F4F7F6', border: 'rgba(100, 130, 125, 0.2)', text: '#4A5F5B' },
};

function iconName(key: string): keyof typeof Ionicons.glyphMap {
  const map: Record<string, keyof typeof Ionicons.glyphMap> = {
    'trash-outline': 'trash-outline',
    'car-outline': 'car-outline',
    'people-outline': 'people-outline',
    'chatbubbles-outline': 'chatbubbles-outline',
    'pulse-outline': 'pulse-outline',
    'map-outline': 'map-outline',
    'school-outline': 'school-outline',
    'flag-outline': 'flag-outline',
    'construct-outline': 'construct-outline',
  };
  return map[key] ?? 'ellipse-outline';
}

export function EventDomainFocusStrip({ model, compact = false }: Props) {
  if (!model) return null;

  const accent = TONE_ACCENT[model.tone];
  const tags = model.emphasisTags.slice(0, 2);
  const maxLines = compact ? 1 : model.maxVisibleLines;

  return (
    <View
      style={[
        styles.strip,
        compact && styles.stripCompact,
        { backgroundColor: accent.bg, borderColor: accent.border },
      ]}
      accessibilityRole="summary">
      <View style={styles.headerRow}>
        <Ionicons name={iconName(model.iconKey)} size={compact ? 14 : 16} color={accent.text} />
        <Text style={[styles.title, { color: accent.text }]} numberOfLines={1}>
          {model.title}
        </Text>
      </View>
      <Text
        style={[styles.summary, { color: accent.text }]}
        numberOfLines={maxLines}
        ellipsizeMode="tail">
        {model.summary}
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
  strip: {
    marginHorizontal: eventDetail.screenPadding,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 6,
    minWidth: 0,
    flexShrink: 1,
  },
  stripCompact: {
    paddingVertical: 8,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    flexShrink: 1,
  },
  title: {
    fontSize: 13,
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
    fontSize: 11,
    fontWeight: '600',
  },
});
