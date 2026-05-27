import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

import type { RiskSummary } from '../types/map';
import { MapSummaryCards } from './MapSummaryCards';

type Props = {
  riskSummary: RiskSummary;
};

export function RiskPanel({ riskSummary }: Props) {
  const cards = [
    {
      icon: 'flag' as const,
      iconColor: colors.danger,
      value: riskSummary.highRiskPoints,
      label: 'Yüksek Risk',
      sublabel: 'Son 24 saatte',
    },
    {
      icon: 'flash' as const,
      iconColor: colors.warning,
      value: riskSummary.activeThreatCount,
      label: 'Aktif Tehdit',
      sublabel: 'Müdahale gerekli',
    },
    {
      icon: 'eye' as const,
      iconColor: colors.primary,
      value: riskSummary.earlyWarningCount,
      label: 'Erken Uyarı',
      sublabel: 'Takipteki bölgeler',
    },
  ];

  const { featuredRisk } = riskSummary;

  return (
    <View style={styles.container}>
      <MapSummaryCards cards={cards} />

      {/* Featured risk card */}
      <View style={[styles.featuredCard, shadows.soft]}>
        <View style={styles.featuredHeader}>
          <View style={styles.warningIcon}>
            <Ionicons name="warning" size={18} color={colors.hubGold} />
          </View>
          <View style={styles.featuredHeaderText}>
            <View style={styles.featuredPill}>
              <Text style={styles.featuredPillText}>Öne Çıkan Risk</Text>
            </View>
            <Text style={styles.featuredTitle}>{featuredRisk.title}</Text>
          </View>
        </View>

        <Text style={styles.featuredDesc}>{featuredRisk.description}</Text>

        <View style={styles.probabilityRow}>
          <Text style={styles.probLabel}>Olasılık</Text>
          <View style={styles.probTrack}>
            <View
              style={[
                styles.probFill,
                { width: `${featuredRisk.probability}%` },
              ]}
            />
          </View>
          <Text style={styles.probValue}>%{featuredRisk.probability}</Text>
        </View>

        <Pressable style={styles.detailBtn}>
          <Text style={styles.detailBtnText}>Detaya Git</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.warning} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  featuredCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featuredHeader: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  warningIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.warningMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredHeaderText: {
    flex: 1,
    gap: 4,
  },
  featuredPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.warningMuted,
  },
  featuredPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.warning,
  },
  featuredTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  featuredDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  probabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  probLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  probTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.backgroundAlt,
    overflow: 'hidden',
  },
  probFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.warning,
  },
  probValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning,
    minWidth: 28,
    textAlign: 'right',
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.warningMuted,
  },
  detailBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.warning,
  },
});
