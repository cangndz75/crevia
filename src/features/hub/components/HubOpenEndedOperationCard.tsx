import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  buildHubOpenEndedAnalyticsPayload,
  type NewSystemsAnalyticsContext,
} from '@/core/analytics/analyticsPayloadBuilders';
import {
  trackHubOpenEndedCardViewed,
  trackOncePerRuntime,
} from '@/core/analytics/analyticsRuntime';
import type {
  CreviaHubOpenEndedFocusLine,
  CreviaHubOpenEndedIntegrationModel,
  CreviaHubOpenEndedTone,
} from '@/core/hub/hubOpenEndedIntegrationPresentation';
import { DistrictOperationActionCard } from '@/features/districtOperationActions/components/DistrictOperationActionCard';

type Props = {
  model: CreviaHubOpenEndedIntegrationModel | null | undefined;
  analyticsContext?: NewSystemsAnalyticsContext;
};

const toneStyles: Record<
  CreviaHubOpenEndedTone,
  { bg: string; iconBg: string; icon: string; label: string; text: string }
> = {
  teal: {
    bg: '#F4FBF8',
    iconBg: 'rgba(15, 143, 134, 0.12)',
    icon: '#0E5F5B',
    label: '#0E5F5B',
    text: '#335552',
  },
  mint: {
    bg: '#F2FAF1',
    iconBg: 'rgba(43, 181, 168, 0.13)',
    icon: '#13887F',
    label: '#0E5F5B',
    text: '#42605C',
  },
  gold: {
    bg: '#FFF8E8',
    iconBg: 'rgba(217, 170, 43, 0.16)',
    icon: '#A77C10',
    label: '#8D6810',
    text: '#5F563F',
  },
  neutral: {
    bg: '#F8F6EF',
    iconBg: 'rgba(20, 70, 66, 0.09)',
    icon: '#4F6663',
    label: '#405755',
    text: '#5D6866',
  },
  warn: {
    bg: '#FFF6EA',
    iconBg: 'rgba(194, 124, 40, 0.16)',
    icon: '#9D671B',
    label: '#8C611B',
    text: '#66533A',
  },
};

function iconName(key: string): keyof typeof Ionicons.glyphMap {
  const map: Record<string, keyof typeof Ionicons.glyphMap> = {
    'locate-outline': 'locate-outline',
    'pulse-outline': 'pulse-outline',
    'navigate-outline': 'navigate-outline',
    'shield-checkmark-outline': 'shield-checkmark-outline',
    'layers-outline': 'layers-outline',
    'clipboard-outline': 'clipboard-outline',
    'time-outline': 'time-outline',
    'sparkles-outline': 'sparkles-outline',
    'chatbubble-ellipses-outline': 'chatbubble-ellipses-outline',
  };
  return map[key] ?? 'radio-outline';
}

function FocusLine({ line }: { line: CreviaHubOpenEndedFocusLine }) {
  const tone = toneStyles[line.tone];
  return (
    <View style={[styles.line, { backgroundColor: tone.bg }]}>
      <View style={[styles.iconWrap, { backgroundColor: tone.iconBg }]}>
        <Ionicons name={iconName(line.iconKey)} size={14} color={tone.icon} />
      </View>
      <View style={styles.lineCopy}>
        <Text style={[styles.lineLabel, { color: tone.label }]} numberOfLines={1}>
          {line.label}
        </Text>
        <Text
          style={[styles.lineText, { color: tone.text }]}
          numberOfLines={line.maxLines}
          ellipsizeMode="tail">
          {line.text}
        </Text>
      </View>
    </View>
  );
}

export function HubOpenEndedOperationCard({ model, analyticsContext }: Props) {
  useEffect(() => {
    if (!model?.visible || model.focusLines.length === 0) return;
    const day = analyticsContext?.day ?? 1;
    const payload = buildHubOpenEndedAnalyticsPayload(model, analyticsContext);
    trackHubOpenEndedCardViewed(
      `hub_open_ended_card_viewed:${day}:${model.visibility.mode}`,
      payload,
    );
    for (const line of model.focusLines.slice(0, 3)) {
      trackOncePerRuntime(
        `hub_open_ended_focus_line_viewed:${day}:${line.id}`,
        'hub_open_ended_focus_line_viewed',
        buildHubOpenEndedAnalyticsPayload(model, analyticsContext, {
          lineKind: line.kind,
          source: line.source,
          count: line.maxLines,
        }),
      );
    }
    if (model.nextUnlockSummary.visible) {
      trackOncePerRuntime(
        `hub_next_unlock_summary_viewed:${day}:${model.visibility.mode}`,
        'hub_next_unlock_summary_viewed',
        buildHubOpenEndedAnalyticsPayload(model, analyticsContext, {
          lineKind: 'next_unlock',
          source: 'rank_permissions',
        }),
      );
    }
    if (model.districtRuntimeSummary.visible && model.districtRuntimeSummary.districtId) {
      trackOncePerRuntime(
        `hub_district_runtime_summary_viewed:${day}:${model.districtRuntimeSummary.districtId}:${model.districtRuntimeSummary.kind}`,
        'hub_district_runtime_summary_viewed',
        buildHubOpenEndedAnalyticsPayload(model, analyticsContext, {
          districtId: model.districtRuntimeSummary.districtId,
          lineKind: model.districtRuntimeSummary.kind,
          source: model.districtRuntimeSummary.source ?? 'district_runtime',
        }),
      );
    }
  }, [analyticsContext, model]);

  if (!model?.visible || model.focusLines.length === 0) return null;

  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="radio-outline" size={18} color="#0E5F5B" />
          <Text style={styles.title} numberOfLines={1}>
            {model.title}
          </Text>
        </View>
        {model.nextUnlockSummary.visible && model.nextUnlockSummary.chipLabel ? (
          <View style={styles.unlockChip}>
            <Text style={styles.unlockChipText} numberOfLines={1}>
              {model.nextUnlockSummary.chipLabel}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.lines}>
        {model.focusLines.slice(0, 3).map((line) => (
          <FocusLine key={line.id} line={line} />
        ))}
      </View>

      <DistrictOperationActionCard source="hub_open_ended" compact />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFDF7',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(20, 70, 66, 0.10)',
    padding: 13,
    gap: 10,
    minWidth: 0,
    flexShrink: 1,
    shadowColor: '#2C3D3A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
    minWidth: 0,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: '900',
    color: '#0E5F5B',
  },
  unlockChip: {
    maxWidth: 108,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(242, 212, 121, 0.52)',
    flexShrink: 1,
  },
  unlockChipText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#7E6412',
  },
  lines: {
    gap: 7,
    minWidth: 0,
  },
  line: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 9,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  lineCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  lineLabel: {
    fontSize: 10,
    fontWeight: '900',
  },
  lineText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    flexShrink: 1,
    minWidth: 0,
  },
});
