import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { EventPlanTuningPresentation } from '@/features/events/utils/eventPlanTuningPresentation';
import { shadows } from '@/ui/theme/shadows';

import { LiveImpactMetricCard } from './LiveImpactMetricCard';

type LiveImpactSummaryProps = {
  liveImpact: EventPlanTuningPresentation['liveImpact'];
  reducedMotion?: boolean;
};

export function LiveImpactSummary({ liveImpact, reducedMotion = false }: LiveImpactSummaryProps) {
  const prevValuesRef = useRef(liveImpact.metrics.map((metric) => metric.value));

  const highlightedIds = liveImpact.metrics
    .filter((metric, index) => metric.value !== prevValuesRef.current[index])
    .map((metric) => metric.id);

  useEffect(() => {
    prevValuesRef.current = liveImpact.metrics.map((metric) => metric.value);
  }, [liveImpact.metrics]);

  return (
    <View
      style={[styles.card, shadows.soft]}
      accessibilityRole="summary"
      accessibilityLabel={liveImpact.accessibilityLabel}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="bar-chart-outline" size={16} color={eventDetail.tealDark} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{liveImpact.title}</Text>
          <Text style={styles.description}>{liveImpact.description}</Text>
        </View>
      </View>
      <View style={styles.metricsRow}>
        {liveImpact.metrics.map((metric) => (
          <LiveImpactMetricCard
            key={metric.id}
            metric={metric}
            highlight={highlightedIds.includes(metric.id)}
            reducedMotion={reducedMotion}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: eventDetail.screenPadding,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 107, 97, 0.10)',
    marginTop: 2,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  description: {
    fontSize: 13,
    fontWeight: '500',
    color: eventDetail.textMuted,
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
