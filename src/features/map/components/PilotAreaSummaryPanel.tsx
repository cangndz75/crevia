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
      <Text style={styles.metricValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.metricLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function PilotAreaSummaryPanel({ pilotAreaId, gameDay }: Props) {
  const preset = getPilotPreset(pilotAreaId);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        Pilot bölge durumu
      </Text>
      <Text style={styles.sectionSubtitle} numberOfLines={1}>
        {preset.name} · Gün {gameDay}/7
      </Text>

      <View style={[styles.card, shadows.soft]}>
        <View style={styles.cardHeader}>
          <View style={[styles.colorDot, { backgroundColor: preset.themeColor }]} />
          <View style={styles.headerText}>
            <Text style={styles.cardName} numberOfLines={1}>
              {preset.name}
            </Text>
            <Text style={styles.cardDesc} numberOfLines={2}>
              {preset.character}
            </Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <MetricPill label="Sosyal Risk" value={preset.socialRisk} />
          <MetricPill label="Personel" value={preset.staffTempo} />
          <MetricPill label="Operasyon" value={preset.operationDifficulty} />
        </View>

        <View style={styles.recommendRow}>
          <Ionicons name="bulb" size={14} color={colors.hubGold} />
          <Text style={styles.recommendText} numberOfLines={2}>
            {preset.recommendedAction}
          </Text>
        </View>
      </View>

      <View style={styles.teaser}>
        <Ionicons name="map" size={14} color={colors.textSecondary} />
        <Text style={styles.teaserText} numberOfLines={2}>
          Diğer mahalleler operasyon önizlemesinde. Pilot tamamlandıkça saha genişler.
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
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
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
    minWidth: 0,
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
    minWidth: 0,
    fontSize: 12,
    fontWeight: '600',
    color: colors.hubGoldDark,
  },
  teaser: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  teaserText: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
