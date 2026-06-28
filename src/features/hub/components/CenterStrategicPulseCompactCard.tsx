import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import type { CenterStrategicPulsePresentation } from '@/features/hub/utils/centerHubGameplayPresentation';
import { CENTER_MIN_TOUCH_TARGET } from '@/features/hub/utils/centerLayoutTokens';
import { CreviaAnimatedPressable } from '@/shared/motion';

import { CenterStrategicPulseDetailSheet } from './CenterStrategicPulseDetailSheet';

type CenterStrategicPulseCompactCardProps = {
  presentation: CenterStrategicPulsePresentation;
  compact?: boolean;
  reducedMotion?: boolean;
};

type MetricName = keyof Pick<CenterStrategicPulsePresentation['compact'], 'pressure' | 'risk' | 'opportunity'>;

function metricIcon(metric: MetricName): keyof typeof Ionicons.glyphMap {
  switch (metric) {
    case 'risk':
      return 'warning-outline';
    case 'opportunity':
      return 'trending-up-outline';
    default:
      return 'pulse-outline';
  }
}

function MetricChip({
  metric,
  value,
}: {
  metric: MetricName;
  value: CenterStrategicPulsePresentation['compact']['pressure'];
}) {
  const width = `${Math.max(4, Math.min(100, value.percent))}%` as `${number}%`;

  return (
    <View style={styles.metricChip}>
      <View style={styles.metricTop}>
        <Ionicons name={metricIcon(metric)} size={13} color="#F5E3AF" />
        <Text style={styles.metricLabel} numberOfLines={1}>
          {value.label}
        </Text>
      </View>
      <Text style={styles.metricValue} numberOfLines={1}>
        {value.valueText}
      </Text>
      <View style={styles.metricTrack}>
        <View style={[styles.metricFill, { width }]} />
      </View>
    </View>
  );
}

function LiveSignalDot({ reducedMotion }: { reducedMotion: boolean }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse, reducedMotion]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.16 + pulse.value * 0.22,
    transform: [{ scale: 1 + pulse.value * 0.55 }],
  }));

  return (
    <View style={styles.liveDotWrap}>
      <Animated.View style={[styles.liveDotHalo, haloStyle]} />
      <View style={styles.liveDot} />
    </View>
  );
}

export function CenterStrategicPulseCompactCard({
  presentation,
  compact = false,
  reducedMotion = false,
}: CenterStrategicPulseCompactCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { compact: pulse } = presentation;

  return (
    <>
      <View style={[styles.card, compact && styles.cardCompact]}>
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow} numberOfLines={1}>
              ŞEHİR NABZI
            </Text>
            <Text style={styles.signalCaption} numberOfLines={1}>
              Canlı Sinyal
            </Text>
          </View>
          <View style={styles.liveBadge}>
            <LiveSignalDot reducedMotion={reducedMotion} />
          </View>
        </View>

        <View style={styles.metricRow}>
          <MetricChip metric="pressure" value={pulse.pressure} />
          <MetricChip metric="risk" value={pulse.risk} />
          <MetricChip metric="opportunity" value={pulse.opportunity} />
        </View>

        <View style={styles.signalPanel}>
          <LiveSignalDot reducedMotion={reducedMotion} />
          <Text style={styles.signalText} numberOfLines={2}>
            {pulse.liveSignalLabel}
          </Text>
        </View>

        {pulse.advisorHint ? (
          <View style={styles.advisorRow}>
            <Text style={styles.advisorLabel} numberOfLines={1}>
              ECE
            </Text>
            <Text style={styles.advisorHint} numberOfLines={2}>
              {pulse.advisorHint}
            </Text>
          </View>
        ) : null}

        <CreviaAnimatedPressable
          onPress={() => setSheetOpen(true)}
          reducedMotion={reducedMotion}
          pressScale={0.985}
          accessibilityRole="button"
          accessibilityLabel="Şehir nabzı detayına git"
          style={styles.ctaPill}>
          <Text style={styles.ctaText} numberOfLines={1}>
            {pulse.cta.label}
          </Text>
          <Ionicons name="chevron-forward" size={13} color="#0D3F39" />
        </CreviaAnimatedPressable>
      </View>

      <CenterStrategicPulseDetailSheet
        visible={sheetOpen}
        detail={presentation.detail}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245,227,175,0.22)',
    backgroundColor: '#0D3F39',
    padding: 14,
    gap: 10,
    shadowColor: 'rgba(15, 60, 52, 0.22)',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  cardCompact: {
    padding: 12,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minWidth: 0,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  eyebrow: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    letterSpacing: 0.7,
    color: '#F5E3AF',
  },
  signalCaption: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.72)',
  },
  liveBadge: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  liveDotWrap: {
    width: 13,
    height: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDotHalo: {
    position: 'absolute',
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#9DF2D2',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#9DF2D2',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 7,
    minWidth: 0,
  },
  metricChip: {
    flex: 1,
    minWidth: 0,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,227,175,0.16)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    padding: 8,
    gap: 4,
  },
  metricTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  metricLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.68)',
  },
  metricValue: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  metricTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  metricFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#D8A72E',
  },
  signalPanel: {
    minHeight: 40,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(157,242,210,0.16)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signalText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    color: '#9DF2D2',
  },
  advisorRow: {
    minHeight: 38,
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245,227,175,0.10)',
  },
  advisorLabel: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '900',
    color: '#F5E3AF',
  },
  advisorHint: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.68)',
  },
  ctaPill: {
    alignSelf: 'flex-start',
    minHeight: CENTER_MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: '#F5E3AF',
    paddingHorizontal: 12,
  },
  ctaText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0D3F39',
  },
});
