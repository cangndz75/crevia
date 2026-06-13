import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import type {
  CenterCitySummary,
  CenterCitySummaryMetric,
  CenterCitySummaryTone,
} from '@/features/hub/utils/centerCitySummaryPresentation';
import { sanitizeCenterDisplayText } from '@/features/hub/utils/centerStatePolicy';

type IconName = keyof typeof Ionicons.glyphMap;

const palette = {
  teal: '#07564F',
  tealDark: '#043A36',
  gold: '#D8A72E',
  goldSoft: '#F5E3AF',
  green: '#3E9E6A',
  amber: '#C78925',
  red: '#C85A4B',
  text: '#173D3A',
  muted: '#6D736C',
  white: '#FFFFFF',
} as const;

const toneColors: Record<
  CenterCitySummaryTone,
  { value: string; border: string; helper: string }
> = {
  success: { value: palette.green, border: 'rgba(62,158,106,0.35)', helper: palette.green },
  stable: { value: palette.gold, border: 'rgba(216,167,46,0.35)', helper: 'rgba(255,255,255,0.72)' },
  warning: { value: palette.amber, border: 'rgba(199,137,37,0.4)', helper: palette.goldSoft },
  urgent: { value: palette.red, border: 'rgba(200,90,75,0.45)', helper: '#F9D9D4' },
  neutral: { value: palette.white, border: 'rgba(255,255,255,0.2)', helper: 'rgba(255,255,255,0.72)' },
};

function resolveMetricIcon(iconKey: string): IconName {
  const known: Record<string, IconName> = {
    'star-outline': 'star-outline',
    'happy-outline': 'happy-outline',
    'shield-checkmark-outline': 'shield-checkmark-outline',
    'pulse-outline': 'pulse-outline',
    'alert-circle-outline': 'alert-circle-outline',
    'flag-outline': 'flag-outline',
    'checkmark-circle-outline': 'checkmark-circle-outline',
  };
  return known[iconKey] ?? 'ellipse-outline';
}

function CityCrestMiniIllustration() {
  return (
    <View style={styles.crestWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.crestDiamond}>
        <View style={styles.crestSky} />
        <View style={styles.crestBuildingLeft} />
        <View style={styles.crestBuildingCenter} />
        <View style={styles.crestBuildingRight} />
        <View style={styles.crestSpire} />
        <View style={styles.crestGoldAccent} />
      </View>
    </View>
  );
}

function SummaryMetricCell({ metric }: { metric: CenterCitySummaryMetric }) {
  const tone = toneColors[metric.tone];
  return (
    <View style={[styles.metricCell, { borderColor: tone.border }]}>
      <View style={styles.metricTopRow}>
        <Ionicons name={resolveMetricIcon(metric.iconKey)} size={13} color={tone.value} />
        <Text style={styles.metricLabel} numberOfLines={1}>
          {metric.label}
        </Text>
      </View>
      <Text
        style={[styles.metricValue, { color: tone.value }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}>
        {sanitizeCenterDisplayText(metric.valueText, '—')}
      </Text>
      {metric.helperText ? (
        <Text style={[styles.metricHelper, { color: tone.helper }]} numberOfLines={2}>
          {metric.helperText}
        </Text>
      ) : null}
    </View>
  );
}

export function CenterCitySummaryCard({ summary }: { summary: CenterCitySummary }) {
  const showCrest = summary.illustrationKey === 'crest';

  return (
    <View
      style={styles.section}
  accessibilityLabel={summary.accessibilityLabel}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle} numberOfLines={1}>
          {summary.title}
        </Text>
        {summary.subtitle ? (
          <Text style={styles.sectionSubtitle} numberOfLines={1}>
            {summary.subtitle}
          </Text>
        ) : null}
      </View>

      <LinearGradient
        colors={[palette.tealDark, palette.teal, '#0B665E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.card}>
        <View style={styles.metricsRow}>
          {summary.metrics.map((metric) => (
            <SummaryMetricCell key={metric.id} metric={metric} />
          ))}
        </View>

        {summary.progress ? (
          <View style={styles.progressBlock}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel} numberOfLines={1}>
                {summary.progress.label}
              </Text>
              <Text style={styles.progressValue} numberOfLines={1}>
                {summary.progress.currentText}
                {summary.progress.targetText ? ` / ${summary.progress.targetText}` : ''}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(summary.progress.progressRatio * 100)}%` },
                ]}
              />
            </View>
          </View>
        ) : null}

        {summary.primaryInsight ? (
          <View style={styles.insightBlock}>
            <Text style={styles.insightLabel} numberOfLines={1}>
              {summary.primaryInsight.label}
            </Text>
            <Text style={styles.insightText} numberOfLines={2}>
              {summary.primaryInsight.text}
            </Text>
          </View>
        ) : null}

        {showCrest ? <CityCrestMiniIllustration /> : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
    minWidth: 0,
  },
  sectionTitleRow: {
    gap: 2,
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: palette.teal,
    letterSpacing: 0.4,
  },
  sectionSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: palette.muted,
  },
  card: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: palette.gold,
    minHeight: 86,
    overflow: 'hidden',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    minWidth: 0,
  },
  metricCell: {
    flex: 1,
    minWidth: 0,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  metricTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  metricLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.72)',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  metricValue: {
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  metricHelper: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '600',
  },
  progressBlock: {
    gap: 4,
    paddingRight: 58,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  progressLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
  },
  progressValue: {
    fontSize: 8,
    fontWeight: '800',
    color: palette.goldSoft,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: palette.gold,
  },
  insightBlock: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    gap: 2,
    maxWidth: '78%',
  },
  insightLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: palette.goldSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  insightText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: palette.white,
  },
  crestWrap: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestDiamond: {
    width: 46,
    height: 46,
    borderRadius: 12,
    overflow: 'hidden',
    transform: [{ rotate: '45deg' }],
    borderWidth: 1,
    borderColor: 'rgba(216,167,46,0.35)',
    backgroundColor: 'rgba(7,86,79,0.35)',
  },
  crestSky: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: '#8ECAE6',
  },
  crestBuildingLeft: {
    position: 'absolute',
    left: 6,
    bottom: 4,
    width: 8,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  crestBuildingCenter: {
    position: 'absolute',
    left: 17,
    bottom: 4,
    width: 10,
    height: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  crestBuildingRight: {
    position: 'absolute',
    right: 6,
    bottom: 4,
    width: 8,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  crestSpire: {
    position: 'absolute',
    left: 20,
    top: 8,
    width: 4,
    height: 10,
    backgroundColor: palette.goldSoft,
  },
  crestGoldAccent: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.gold,
  },
});
