import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

import { getPilotPreset } from '../data/mapSelectors';
import type { PilotAreaId } from '../types/map';

type Props = {
  pilotAreaId: PilotAreaId;
  gameDay: number;
};

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricPill}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export function PilotAreaSummaryPanel({ pilotAreaId, gameDay }: Props) {
  const preset = getPilotPreset(pilotAreaId);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Pilot Bölge Durumu</Text>
      <Text style={styles.sectionSubtitle}>
        {preset.name} · Gün {gameDay}/7
      </Text>

      <View style={[styles.card, shadows.soft]}>
        <View style={styles.cardHeader}>
          <View style={[styles.colorDot, { backgroundColor: preset.themeColor }]} />
          <View style={styles.headerText}>
            <Text style={styles.cardName}>{preset.name}</Text>
            <Text style={styles.cardDesc}>{preset.character}</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <MetricPill label="Sosyal Risk" value={preset.socialRisk} />
          <MetricPill label="Personel" value={preset.staffTempo} />
          <MetricPill label="Operasyon" value={preset.operationDifficulty} />
        </View>

        <View style={styles.recommendRow}>
          <Ionicons name="bulb" size={16} color={colors.hubGold} />
          <Text style={styles.recommendText}>{preset.recommendedAction}</Text>
        </View>
      </View>

      <View style={styles.teaser}>
        <Ionicons name="map" size={14} color={colors.textSecondary} />
        <Text style={styles.teaserText}>
          Pilot tamamlandığında diğer bölgeler ana operasyonda açılacak.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    gap: 2,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  metricLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  recommendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.hubGoldMuted,
  },
  recommendText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.hubGoldDark,
  },
  teaser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  teaserText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
