import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

import type { Container, ContainerSummary } from '../types/map';

type Props = {
  summary: ContainerSummary;
  containers: Container[];
  emphasizeRouteCta?: boolean;
};

const statusColors: Record<string, string> = {
  empty: colors.success,
  normal: colors.hubGold,
  full: colors.warning,
  critical: colors.danger,
};

function ContainerRow({ container }: { container: Container }) {
  const col = statusColors[container.status] ?? colors.textSecondary;
  return (
    <View style={[styles.containerRow, shadows.soft]}>
      <View style={[styles.fillCircle, { borderColor: col }]}>
        <Text style={[styles.fillText, { color: col }]}>%{container.fillPercentage}</Text>
      </View>
      <View style={styles.containerInfo}>
        <Text style={styles.containerAddress}>{container.address}</Text>
        <Text style={styles.containerDistrict}>{container.district}</Text>
      </View>
      <View style={[styles.statusPill, { backgroundColor: `${col}18` }]}>
        <Text style={[styles.statusText, { color: col }]}>
          {container.status === 'critical' ? 'Kritik' : container.status === 'full' ? 'Dolu' : container.status === 'normal' ? 'Normal' : 'Boş'}
        </Text>
      </View>
    </View>
  );
}

export function ContainerPanel({
  summary,
  containers,
  emphasizeRouteCta = false,
}: Props) {
  const criticals = containers.filter((c) => c.status === 'critical');

  return (
    <View style={styles.container}>
      {/* Summary cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, shadows.soft]}>
          <Text style={styles.summaryLabel}>Doluluk Özeti</Text>
          <View style={styles.donutWrap}>
            <View style={[styles.donutOuter, { borderColor: colors.warning }]}>
              <Text style={styles.donutValue}>%{summary.averageFill}</Text>
            </View>
          </View>
          <View style={styles.legendCol}>
            <LegendItem color={colors.success} label="Boş" count={summary.empty} pct={18} />
            <LegendItem color={colors.hubGold} label="Normal" count={summary.normal} pct={46} />
            <LegendItem color={colors.warning} label="Dolu" count={summary.full} pct={30} />
            <LegendItem color={colors.danger} label="Kritik" count={summary.critical} pct={6} />
          </View>
        </View>
        <View style={[styles.summaryCard, shadows.soft]}>
          <Text style={styles.summaryLabel}>Geciken Toplama</Text>
          <Text style={styles.delayValue}>{summary.delayedCollection}</Text>
          <Text style={styles.delayUnit}>konteyner</Text>
          <Text style={styles.delaySub}>24 saati geçti</Text>
        </View>
      </View>

      {/* Critical list */}
      <View style={styles.criticalSection}>
        <View style={styles.criticalHeader}>
          <View>
            <Text style={styles.criticalTitle}>Kritik Noktalar</Text>
            <Text style={styles.criticalSubtitle}>Müdahale edilmesi gereken dolu konteynerler</Text>
          </View>
          <Pressable
            style={[
              styles.routeBtn,
              emphasizeRouteCta && styles.routeBtnEmphasized,
            ]}
          >
            <Text
              style={[
                styles.routeBtnText,
                emphasizeRouteCta && styles.routeBtnTextEmphasized,
              ]}
            >
              Rota Oluştur
            </Text>
          </Pressable>
        </View>
        {criticals.map((c) => (
          <ContainerRow key={c.id} container={c} />
        ))}
      </View>
    </View>
  );
}

function LegendItem({ color, label, count, pct }: { color: string; label: string; count: number; pct: number }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendCount}>{count}</Text>
      <Text style={styles.legendPct}>%{pct}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    alignSelf: 'flex-start',
  },
  donutWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  legendCol: {
    width: '100%',
    gap: 3,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    flex: 1,
  },
  legendCount: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
    width: 28,
    textAlign: 'right',
  },
  legendPct: {
    fontSize: 10,
    color: colors.textSecondary,
    width: 24,
    textAlign: 'right',
  },
  delayValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.danger,
    marginTop: spacing.sm,
  },
  delayUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  delaySub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  criticalSection: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  criticalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  criticalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  criticalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  routeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
  },
  routeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  routeBtnEmphasized: {
    backgroundColor: colors.warningMuted,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  routeBtnTextEmphasized: {
    color: colors.warning,
  },
  containerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fillCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  containerInfo: {
    flex: 1,
    gap: 2,
  },
  containerAddress: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  containerDistrict: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
