import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  buildActiveRouteAnalyticsPayload,
  type NewSystemsAnalyticsContext,
} from '@/core/analytics/analyticsPayloadBuilders';
import {
  trackActiveRoutePreviewViewed,
  trackOncePerRuntime,
} from '@/core/analytics/analyticsRuntime';
import type { CreviaActiveTaskRouteUiModel } from '@/core/activeTaskRoutes/activeTaskRouteUiTypes';
import { getActiveTaskRouteUiPhaseDefinition } from '@/core/activeTaskRoutes/activeTaskRouteUiConstants';
import { resolveIoniconForRegistryKey } from '@/core/presentation/creviaIconPresentation';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { mapUi } from '@/features/map/utils/mapUiTokens';
import { shadows } from '@/ui/theme/shadows';

type Props = {
  model: CreviaActiveTaskRouteUiModel | null | undefined;
  surface?: 'dispatch' | 'field' | 'map';
  compact?: boolean;
  analyticsContext?: NewSystemsAnalyticsContext;
};

const TONE = {
  dispatch: { bg: eventDetail.mintSoft, border: 'rgba(15, 143, 134, 0.12)', text: eventDetail.tealDark },
  field: { bg: '#F2FBF8', border: 'rgba(15, 143, 134, 0.14)', text: eventDetail.teal },
  map: { bg: mapUi.mint, border: 'rgba(15, 143, 134, 0.12)', text: mapUi.teal },
} as const;

export function ActiveTaskRoutePreviewStrip({
  model,
  surface = 'dispatch',
  compact = false,
  analyticsContext,
}: Props) {
  useEffect(() => {
    if (!model?.visible) return;
    const day = analyticsContext?.day ?? 1;
    const surfaceSource = `active_route_${surface}`;
    trackActiveRoutePreviewViewed(
      `active_route_preview_viewed:${day}:${surface}:${model.id}:${model.phase}`,
      buildActiveRouteAnalyticsPayload(model, {
        ...analyticsContext,
        source: analyticsContext?.source ?? surfaceSource,
      }),
    );
    trackOncePerRuntime(
      `active_route_phase_viewed:${day}:${surface}:${model.id}:${model.phase}`,
      'active_route_phase_viewed',
      buildActiveRouteAnalyticsPayload(model, {
        ...analyticsContext,
        source: analyticsContext?.source ?? surfaceSource,
      }, {
        lineKind: 'phase',
      }),
    );
    if (model.resourceWarningLine && model.visibility.showResourceWarning) {
      trackOncePerRuntime(
        `active_route_resource_warning_viewed:${day}:${surface}:${model.id}:${model.phase}`,
        'active_route_resource_warning_viewed',
        buildActiveRouteAnalyticsPayload(model, {
          ...analyticsContext,
          source: analyticsContext?.source ?? surfaceSource,
        }, {
          lineKind: 'resource_warning',
        }),
      );
    }
    if (surface === 'map' && model.visibility.showMapHint) {
      trackOncePerRuntime(
        `map_active_route_hint_viewed:${day}:${model.id}:${model.phase}`,
        'map_active_route_hint_viewed',
        buildActiveRouteAnalyticsPayload(model, {
          ...analyticsContext,
          source: 'map_active_route_hint',
        }),
      );
    }
  }, [analyticsContext, model, surface]);

  if (!model?.visible) return null;

  const palette = TONE[surface];
  const phaseDef = getActiveTaskRouteUiPhaseDefinition(model.phase);
  const iconName = resolveIoniconForRegistryKey(phaseDef.iconKey);
  const primaryLine =
    surface === 'field'
      ? model.fieldLine
      : surface === 'map'
        ? model.mapLine
        : model.dispatchLine;

  return (
    <View
      style={[
        styles.card,
        shadows.soft,
        surface === 'map' ? styles.cardMap : null,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`Aktif görev rotası: ${phaseDef.label}`}>
      <View style={styles.header}>
        <Ionicons name={iconName} size={14} color={palette.text} />
        <Text style={[styles.title, { color: palette.text }]} numberOfLines={1}>
          {phaseDef.label}
        </Text>
        {model.targetDistrictLabel ? (
          <Text style={[styles.target, { color: palette.text }]} numberOfLines={1}>
            {model.targetDistrictLabel}
          </Text>
        ) : null}
      </View>

      <Text style={[styles.line, { color: palette.text }]} numberOfLines={compact ? 1 : 2}>
        {primaryLine}
      </Text>

      {!compact && model.visibility.showSteps && model.steps.length > 0 ? (
        <View style={styles.stepper}>
          {model.steps.map((step) => (
            <View key={step.id} style={styles.stepRow}>
              <View
                style={[
                  styles.stepDot,
                  step.isComplete && styles.stepDotComplete,
                  step.isActive && styles.stepDotActive,
                ]}
              />
              <Text
                style={[styles.stepLabel, step.isActive && styles.stepLabelActive]}
                numberOfLines={1}>
                {step.shortLabel}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {model.resourceWarningLine ? (
        <View style={styles.warningRow}>
          <Ionicons name="alert-circle-outline" size={12} color={eventDetail.orange} />
          <Text style={styles.warningText} numberOfLines={1}>
            {model.resourceWarningLine}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: eventDetail.screenPadding,
    borderRadius: eventDetail.smallRadius,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    minWidth: 0,
  },
  cardMap: {
    marginHorizontal: 0,
    borderRadius: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
    flexShrink: 0,
  },
  target: {
    flex: 1,
    minWidth: 0,
    textAlign: 'right',
    fontSize: 10,
    fontWeight: '700',
    flexShrink: 1,
  },
  line: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    flexShrink: 1,
    minWidth: 0,
  },
  stepper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    minWidth: 0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '48%',
    minWidth: 0,
    flexShrink: 1,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4DAD8',
    flexShrink: 0,
  },
  stepDotActive: {
    backgroundColor: eventDetail.teal,
  },
  stepDotComplete: {
    backgroundColor: eventDetail.tealDark,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: eventDetail.textMuted,
    flexShrink: 1,
    minWidth: 0,
  },
  stepLabelActive: {
    color: eventDetail.tealDark,
    fontWeight: '800',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  warningText: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    color: '#8A6510',
    flexShrink: 1,
  },
});
