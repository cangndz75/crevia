import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { ReportImpactMetricCard } from '@/features/reports/components/end-of-day/premium/ReportImpactMetricCard';
import type { ReportPrimaryImpactModel } from '@/features/reports/presentation/reportPremiumPresentation';

type Props = {
  model: ReportPrimaryImpactModel;
};

export function ReportPrimaryImpactSection({ model }: Props) {
  if (model.metrics.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View style={styles.crest}>
            <Ionicons name="ribbon" size={14} color="#C89225" />
          </View>
          <Text style={styles.title} numberOfLines={1}>
            Bugünkü Ana Etki
          </Text>
        </View>
        <View style={styles.timePill}>
          <Ionicons name="time-outline" size={12} color="#4A6B67" />
          <Text style={styles.timeText} numberOfLines={1}>
            {model.timePill}
          </Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        {model.metrics.map((metric) => (
          <ReportImpactMetricCard key={metric.key} model={metric} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(16, 85, 78, 0.08)',
    padding: 16,
    gap: 14,
    minWidth: 0,
    shadowColor: '#152C27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  crest: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FBF3E0',
    borderWidth: 1,
    borderColor: 'rgba(215, 164, 60, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#173B3A',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F3F7F6',
    borderWidth: 1,
    borderColor: 'rgba(16, 85, 78, 0.08)',
    flexShrink: 0,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A6B67',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
});
