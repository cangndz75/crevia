import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { MapBeforeAfterImpactModel } from '@/core/mapPresence/mapBeforeAfterTypes';
import { mapUi } from '@/features/map/utils/mapUiTokens';

type Props = {
  impact: MapBeforeAfterImpactModel | null | undefined;
  compact?: boolean;
};

const TONE_COLORS: Record<MapBeforeAfterImpactModel['tone'], string> = {
  positive: mapUi.teal,
  mixed: '#6B5E48',
  warning: mapUi.gold,
  strategic: '#3F5C6B',
  muted: '#6B6560',
};

function resolveIcon(name: string): keyof typeof Ionicons.glyphMap {
  const known = name as keyof typeof Ionicons.glyphMap;
  return known in Ionicons.glyphMap ? known : 'map-outline';
}

export function MapBeforeAfterImpactStrip({ impact, compact = false }: Props) {
  if (!impact?.visible) return null;

  const accent = TONE_COLORS[impact.tone];

  return (
    <View style={[styles.strip, compact && styles.stripCompact]}>
      <Ionicons name={resolveIcon(impact.iconKey)} size={13} color={accent} />
      <View style={styles.copy}>
        <Text style={[styles.flow, { color: accent }]} numberOfLines={1}>
          {impact.beforeLabel} → {impact.afterLabel}
        </Text>
        <Text style={styles.summary} numberOfLines={compact ? 1 : impact.maxLines}>
          {impact.summary}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 6,
    minWidth: 0,
    flexShrink: 1,
  },
  stripCompact: {
    paddingVertical: 4,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    gap: 2,
  },
  flow: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
    minWidth: 0,
  },
  summary: {
    fontSize: 12,
    lineHeight: 16,
    color: mapUi.textSecondary,
    flexShrink: 1,
    minWidth: 0,
  },
});
