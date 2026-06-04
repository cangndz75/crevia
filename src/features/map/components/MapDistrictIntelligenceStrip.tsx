import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  buildMapDistrictIntelligenceAnalyticsPayload,
  type NewSystemsAnalyticsContext,
} from '@/core/analytics/analyticsPayloadBuilders';
import {
  trackMapDistrictIntelligenceViewed,
  trackOncePerRuntime,
} from '@/core/analytics/analyticsRuntime';
import type { CreviaMapDistrictIntelligenceModel } from '@/core/map/mapDistrictIntelligencePresentation';
import { resolveIoniconForRegistryKey } from '@/core/presentation/creviaIconPresentation';
import { mapUi } from '@/features/map/utils/mapUiTokens';

type Props = {
  model: CreviaMapDistrictIntelligenceModel | null | undefined;
  analyticsContext?: NewSystemsAnalyticsContext;
};

const TONE_COLORS = {
  teal: { bg: mapUi.mint, border: 'rgba(15, 143, 134, 0.14)', text: mapUi.teal, icon: mapUi.teal },
  mint: { bg: '#F2FBF8', border: 'rgba(15, 143, 134, 0.1)', text: mapUi.tealDark, icon: mapUi.teal },
  gold: { bg: mapUi.goldSoft, border: mapUi.goldBorder, text: '#8A6510', icon: mapUi.gold },
  neutral: {
    bg: '#FFFCF8',
    border: 'rgba(6, 63, 59, 0.08)',
    text: mapUi.textSecondary,
    icon: mapUi.textSecondary,
  },
} as const;

export function MapDistrictIntelligenceStrip({ model, analyticsContext }: Props) {
  useEffect(() => {
    if (!model?.visible || model.visibleLines.length === 0) return;
    const day = analyticsContext?.day ?? 1;
    trackMapDistrictIntelligenceViewed(
      `map_district_intelligence_viewed:${day}:${model.districtId}:${model.visibility.mode}`,
      buildMapDistrictIntelligenceAnalyticsPayload(model, analyticsContext),
    );
    for (const line of model.visibleLines) {
      const eventName =
        line.kind === 'trust'
          ? 'map_district_trust_line_viewed'
          : line.kind === 'memory'
            ? 'map_district_memory_line_viewed'
            : 'map_district_operation_hint_viewed';
      trackOncePerRuntime(
        `${eventName}:${day}:${model.districtId}:${line.id}`,
        eventName,
        buildMapDistrictIntelligenceAnalyticsPayload(model, analyticsContext, {
          lineKind: line.kind,
          domain: line.kind,
          source: 'map_district_intelligence',
        }),
      );
    }
  }, [analyticsContext, model]);

  if (!model?.visible || model.visibleLines.length === 0) {
    return null;
  }

  return (
    <View
      style={styles.strip}
      accessibilityRole="summary"
      accessibilityLabel={`${model.districtName} mahalle operasyon bilgisi`}>
      {model.visibleLines.map((line) => {
        const palette = TONE_COLORS[line.tone] ?? TONE_COLORS.neutral;
        const iconName = resolveIoniconForRegistryKey(line.iconKey);
        return (
          <View
            key={line.id}
            style={[styles.row, { backgroundColor: palette.bg, borderColor: palette.border }]}>
            <Ionicons name={iconName} size={13} color={palette.icon} />
            <Text style={[styles.text, { color: palette.text }]} numberOfLines={2}>
              {line.text}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    gap: 8,
    minWidth: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: 0,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  text: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
});
