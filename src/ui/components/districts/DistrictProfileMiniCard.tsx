import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { DistrictProfile } from '@/core/districts/types';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type DistrictProfileMiniCardProps = {
  profile: DistrictProfile;
};

function formatMetric(value: number): string {
  return String(Math.round(value));
}

function getHighlightMetrics(profile: DistrictProfile): {
  label: string;
  value: number;
}[] {
  const extras = [
    { label: 'Trafik', value: profile.trafficDensity },
    { label: 'Atık', value: profile.wastePressure },
    { label: 'Araç', value: profile.vehicleDependency },
    { label: 'Ekip', value: profile.staffLoadPressure },
  ];
  const topExtra = extras.reduce((best, cur) =>
    cur.value > best.value ? cur : best,
  );

  return [
    { label: 'Risk', value: profile.baseRisk },
    { label: 'Şikayet', value: profile.complaintSensitivity },
    topExtra,
  ];
}

export function DistrictProfileMiniCard({ profile }: DistrictProfileMiniCardProps) {
  const metrics = getHighlightMetrics(profile);
  const tagLine = profile.tags.slice(0, 3).join(' · ');

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="map-outline" size={16} color={colors.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.name}>{profile.name}</Text>
          {tagLine ? <Text style={styles.tags}>{tagLine}</Text> : null}
        </View>
      </View>

      <Text style={styles.description}>{profile.description}</Text>

      <View style={styles.metricsRow}>
        {metrics.map((metric) => (
          <View key={metric.label} style={styles.metric}>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <Text style={styles.metricValue}>{formatMetric(metric.value)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  tags: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  metric: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
});
