import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { resolveIoniconForRegistryKey } from '@/core/presentation/creviaIconPresentation';
import type { MapBeforeAfterImpactModel } from '@/core/mapPresence/mapBeforeAfterTypes';
import { MapBeforeAfterImpactStrip } from '@/features/map/components/MapBeforeAfterImpactStrip';
import type {
  DistrictRiskSummaryMetric,
  MapCrisisPanelLine,
  MapOperationPanelModel,
  MapResourcePanelLine,
} from '@/features/map/utils/mapUiPresentation';
import { mapUi } from '@/features/map/utils/mapUiTokens';
import { colors } from '@/ui/theme/colors';
import { shadows } from '@/ui/theme/shadows';

type Props = {
  model: MapOperationPanelModel;
  mapBeforeAfterImpact?: MapBeforeAfterImpactModel | null;
  onPressCta?: () => void;
  onPressRecommended?: () => void;
};

const RISK_COLORS = {
  teal: mapUi.teal,
  gold: mapUi.gold,
  warn: mapUi.riskHigh,
  danger: mapUi.riskCritical,
} as const;

const CRISIS_LINE_COLORS: Record<
  MapCrisisPanelLine['tone'],
  { bg: string; border: string; text: string; icon: string }
> = {
  neutral: {
    bg: mapUi.mint,
    border: 'rgba(15, 143, 134, 0.12)',
    text: mapUi.teal,
    icon: mapUi.teal,
  },
  warning: {
    bg: mapUi.goldSoft,
    border: mapUi.goldBorder,
    text: '#8A6510',
    icon: mapUi.gold,
  },
  critical: {
    bg: '#FFF6EE',
    border: 'rgba(229, 154, 34, 0.35)',
    text: '#9A5B12',
    icon: mapUi.gold,
  },
};

function CrisisMapLineRow({ line }: { line: MapCrisisPanelLine }) {
  const palette = CRISIS_LINE_COLORS[line.tone];
  const iconName = resolveIoniconForRegistryKey(line.iconKey);
  return (
    <View
      style={[
        styles.crisisRow,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}>
      <Ionicons name={iconName} size={14} color={palette.icon} />
      <View style={styles.crisisCopy}>
        <Text style={[styles.crisisTitle, { color: palette.text }]} numberOfLines={1}>
          {line.title}
        </Text>
        <Text style={[styles.crisisSummary, { color: palette.text }]} numberOfLines={2}>
          {line.summary}
        </Text>
      </View>
    </View>
  );
}

const RESOURCE_LINE_COLORS = {
  neutral: CRISIS_LINE_COLORS.neutral,
  warning: CRISIS_LINE_COLORS.warning,
  critical: CRISIS_LINE_COLORS.warning,
  positive: {
    bg: mapUi.mint,
    border: 'rgba(15, 143, 134, 0.18)',
    text: mapUi.teal,
    icon: mapUi.teal,
  },
} as const;

function ResourceMapLineRow({ line }: { line: MapResourcePanelLine }) {
  const palette =
    RESOURCE_LINE_COLORS[line.tone] ?? RESOURCE_LINE_COLORS.neutral;
  const iconName = resolveIoniconForRegistryKey(line.iconKey);
  return (
    <View
      style={[
        styles.crisisRow,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}>
      <Ionicons name={iconName} size={14} color={palette.icon} />
      <View style={styles.crisisCopy}>
        <Text style={[styles.crisisTitle, { color: palette.text }]} numberOfLines={1}>
          {line.title}
        </Text>
        <Text style={[styles.crisisSummary, { color: palette.text }]} numberOfLines={2}>
          {line.summary}
        </Text>
      </View>
    </View>
  );
}

function DistrictRiskMetricCard({ metric }: { metric: DistrictRiskSummaryMetric }) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIconWrap}>
        <Ionicons name={metric.icon} size={18} color={metric.progressColor} />
      </View>
      <Text style={styles.metricLabel} numberOfLines={1}>
        {metric.label}
      </Text>
      <Text style={styles.metricValue} numberOfLines={1}>
        {metric.value}
      </Text>
      <Text style={styles.metricSub} numberOfLines={2}>
        {metric.sublabel}
      </Text>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.round(metric.progress * 100)}%`,
              backgroundColor: metric.progressColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

export function MapOperationBottomPanel({
  model,
  mapBeforeAfterImpact,
  onPressCta,
  onPressRecommended,
}: Props) {
  if (!model.visible) {
    return null;
  }

  return (
    <View style={[styles.panel, shadows.card]}>
      <View style={styles.topRow}>
        <Text style={styles.eyebrow} numberOfLines={1}>
          Seçili bölge özeti
        </Text>
        <View style={styles.eventsPill}>
          <Ionicons name="pulse-outline" size={14} color={mapUi.teal} />
          <Text style={styles.eventsPillText} numberOfLines={1}>
            {model.activeEventsPillLabel}
          </Text>
        </View>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>
          {model.districtLabel}
        </Text>
        <View
          style={[
            styles.riskPill,
            { backgroundColor: mapUi.goldSoft, borderColor: mapUi.goldBorder },
          ]}>
          <Text
            style={[styles.riskText, { color: RISK_COLORS[model.riskTone] }]}
            numberOfLines={1}>
            {model.riskLabel}
          </Text>
        </View>
      </View>

      {model.summaryDescription ? (
        <Text style={styles.description} numberOfLines={2}>
          {model.summaryDescription}
        </Text>
      ) : null}

      {model.agendaSignalLine ? (
        <View style={styles.agendaRow}>
          <Ionicons name="pulse-outline" size={14} color={mapUi.teal} />
          <Text style={styles.agendaText} numberOfLines={2}>
            {model.agendaSignalLine}
          </Text>
        </View>
      ) : null}

      {model.crisisLines?.map((line) => (
        <CrisisMapLineRow key={line.id} line={line} />
      ))}

      {model.resourceLines?.map((line) => (
        <ResourceMapLineRow key={line.id} line={line} />
      ))}

      {model.presenceLines?.map((line, index) => (
        <View key={`presence-${index}`} style={styles.presenceRow}>
          <Ionicons name="location-outline" size={13} color={mapUi.teal} />
          <Text style={styles.presenceText} numberOfLines={2}>
            {line}
          </Text>
        </View>
      ))}

      {!model.crisisLines?.length && mapBeforeAfterImpact?.visible ? (
        <MapBeforeAfterImpactStrip impact={mapBeforeAfterImpact} compact />
      ) : null}

      {model.sahaNote ? (
        <View style={styles.noteRow}>
          <Ionicons name="document-text-outline" size={13} color={mapUi.teal} />
          <Text style={styles.noteText} numberOfLines={2}>
            Saha notu: {model.sahaNote}
          </Text>
        </View>
      ) : null}

      <View style={styles.metricsRow}>
        {model.riskMetrics.map((metric) => (
          <DistrictRiskMetricCard key={metric.key} metric={metric} />
        ))}
      </View>

      {model.recommendedAction ? (
        <Pressable
          style={styles.recommendedStrip}
          onPress={onPressRecommended ?? onPressCta}
          accessibilityRole="button">
          <Ionicons name="bulb-outline" size={20} color={mapUi.gold} />
          <Text style={styles.recommendedText} numberOfLines={2}>
            {model.recommendedAction}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={mapUi.gold} />
        </Pressable>
      ) : null}

      {onPressCta ? (
        <Pressable
          style={styles.cta}
          onPress={onPressCta}
          accessibilityRole="button"
          accessibilityLabel={model.ctaLabel}>
          <Text style={styles.ctaText} numberOfLines={1}>
            {model.ctaLabel}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textInverse} />
        </Pressable>
      ) : (
        <View style={styles.ctaStatic}>
          <Text style={styles.ctaTextStatic} numberOfLines={1}>
            {model.ctaLabel}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginHorizontal: mapUi.screenPadding,
    backgroundColor: colors.surface,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    padding: 18,
    gap: 12,
    marginTop: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  eyebrow: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '700',
    color: mapUi.textSecondary,
    letterSpacing: 0.2,
  },
  eventsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: mapUi.mint,
    maxWidth: '48%',
    flexShrink: 1,
  },
  eventsPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: mapUi.tealDark,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 22,
    fontWeight: '800',
    color: mapUi.textDark,
    letterSpacing: -0.3,
  },
  riskPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '42%',
    flexShrink: 1,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '800',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    color: mapUi.textSecondary,
  },
  agendaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: mapUi.mint,
  },
  agendaText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: mapUi.teal,
  },
  crisisRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 0,
  },
  crisisCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  crisisTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  crisisSummary: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    flexShrink: 1,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  noteText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: mapUi.textDark,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    maxWidth: '100%',
    minHeight: 100,
    borderRadius: 18,
    backgroundColor: '#FFFCF8',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 4,
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: mapUi.textSecondary,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: mapUi.textDark,
  },
  metricSub: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    color: mapUi.textSecondary,
    minHeight: 28,
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#EDE9E0',
    overflow: 'hidden',
    marginTop: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  presenceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: 0,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: mapUi.mint,
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.12)',
  },
  presenceText: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: mapUi.teal,
  },
  recommendedStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: mapUi.goldSoft,
    borderWidth: 1,
    borderColor: mapUi.goldBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  recommendedText: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: '#8A6510',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 22,
    backgroundColor: mapUi.tealDark,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textInverse,
  },
  ctaStatic: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(6, 63, 59, 0.08)',
    alignItems: 'center',
  },
  ctaTextStatic: {
    fontSize: 15,
    fontWeight: '700',
    color: mapUi.teal,
  },
});
