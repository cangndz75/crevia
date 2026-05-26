import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { DailyReport } from '@/core/models/DailyReport';
import type { GameMetrics } from '@/core/models/GameMetrics';
import { PilotReportSummaryCard } from '@/features/reports/components/PilotReportSummaryCard';
import { getPilotReportContext } from '@/features/reports/utils/pilotReportPresentation';
import {
  selectDecisionHistory,
  selectLastDailyReport,
  selectLevel,
  useGameMetrics,
  selectSnapshots,
  selectXp,
  useGameStore,
} from '@/store/useGameStore';
import { AppScreen } from '@/ui/components/AppScreen';
import { GameButton } from '@/ui/components/GameButton';
import { GameCard } from '@/ui/components/GameCard';
import { GameChip } from '@/ui/components/GameChip';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

const toneColor = {
  positive: colors.success,
  negative: colors.danger,
  neutral: colors.textPrimary,
};

function formatCurrency(amount: number): string {
  return `₺${Math.round(amount).toLocaleString('tr-TR')}`;
}

function goToHub(router: ReturnType<typeof useRouter>) {
  router.push('/');
}

type ReportEmptyProps = {
  onGoHub: () => void;
};

function ReportEmpty({ onGoHub }: ReportEmptyProps) {
  return (
    <AppScreen>
      <Text style={typography.title}>Henüz Gün Sonu Raporu Yok</Text>
      <Text style={[typography.body, styles.emptyBody]}>
        Operasyon merkezinden günü bitirdiğinde burada günlük raporunu
        göreceksin.
      </Text>
      <GameButton
        title="Operasyon Merkezine Dön"
        onPress={onGoHub}
        style={styles.primaryAction}
      />
    </AppScreen>
  );
}

type LineListProps = {
  title: string;
  lines: string[];
  tone?: 'default' | 'warning' | 'highlight';
};

function LineList({ title, lines, tone = 'default' }: LineListProps) {
  if (lines.length === 0) return null;

  const textStyle =
    tone === 'warning'
      ? styles.warningLine
      : tone === 'highlight'
        ? styles.highlightLine
        : styles.summaryLine;

  return (
    <GameCard padding="lg" style={styles.sectionCard}>
      <Text style={typography.label}>{title}</Text>
      <View style={styles.lineList}>
        {lines.map((line, index) => (
          <Text key={`${title}-${index}`} style={textStyle}>
            • {line}
          </Text>
        ))}
      </View>
    </GameCard>
  );
}

type DecisionRowProps = {
  record: DecisionRecord;
};

function DecisionRow({ record }: DecisionRowProps) {
  return (
    <View style={styles.decisionRow}>
      <Text style={typography.subtitle}>{record.eventTitle}</Text>
      <Text style={typography.body}>{record.decisionLabel}</Text>
      {record.neighborhoodName ? (
        <Text style={typography.caption}>{record.neighborhoodName}</Text>
      ) : null}
    </View>
  );
}

type ReportContentProps = {
  report: DailyReport;
  metrics: GameMetrics;
  xp: number;
  level: number;
  dayDecisions: DecisionRecord[];
  snapshotCount: number;
  pilotReportContext: ReturnType<typeof getPilotReportContext>;
  onGoHub: () => void;
};

function ReportContent({
  report,
  metrics,
  xp,
  level,
  dayDecisions,
  snapshotCount,
  pilotReportContext,
  onGoHub,
}: ReportContentProps) {
  const summaryLines = report.summaryLines ?? [];
  const warnings = report.warnings ?? [];
  const highlights = report.highlights ?? [];

  return (
    <AppScreen>
      <Text style={typography.title}>Gün Sonu Raporu</Text>
      <Text style={typography.caption}>Gün {report.day} tamamlandı</Text>

      {pilotReportContext ? (
        <PilotReportSummaryCard context={pilotReportContext} />
      ) : null}

      <LineList title="Özet" lines={summaryLines} />
      <LineList title="Uyarılar" lines={warnings} tone="warning" />
      <LineList title="Öne Çıkanlar" lines={highlights} tone="highlight" />

      <GameCard padding="lg" style={styles.sectionCard}>
        <Text style={typography.label}>Güncel Metrikler</Text>
        <View style={styles.metricsGrid}>
          <MetricItem
            label="Halk Memnuniyeti"
            value={`%${metrics.publicSatisfaction}`}
          />
          <MetricItem label="Bütçe" value={formatCurrency(metrics.budget)} />
          <MetricItem
            label="Personel Morali"
            value={`%${metrics.staffMorale}`}
          />
        </View>
      </GameCard>

      <GameCard padding="md" style={styles.statCard}>
        <Text style={styles.statLabel}>XP</Text>
        <Text style={typography.stat}>{xp.toLocaleString('tr-TR')}</Text>
      </GameCard>
      <GameCard padding="md" style={styles.statCard}>
        <Text style={styles.statLabel}>Seviye</Text>
        <Text style={typography.stat}>{level}</Text>
      </GameCard>

      {report.stats.length > 0 ? (
        <View style={styles.stats}>
          {report.stats.map((stat) => (
            <GameCard key={stat.label} padding="md" style={styles.statCard}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text
                style={[
                  typography.stat,
                  stat.tone ? { color: toneColor[stat.tone] } : null,
                ]}>
                {stat.value}
              </Text>
            </GameCard>
          ))}
        </View>
      ) : null}

      {dayDecisions.length > 0 || snapshotCount > 0 ? (
        <GameCard padding="lg" style={styles.sectionCard}>
          <Text style={typography.label}>Bugün alınan kararlar</Text>
          {snapshotCount > 0 ? (
            <Text style={[typography.caption, styles.snapshotHint]}>
              {snapshotCount} operasyon kaydı oluşturuldu.
            </Text>
          ) : null}
          <View style={styles.decisionsList}>
            {dayDecisions.map((record) => (
              <DecisionRow key={record.id} record={record} />
            ))}
          </View>
        </GameCard>
      ) : null}

      {report.rewardTitle && report.rewardTitle !== '—' ? (
        <GameCard soft padding="lg">
          <Text style={typography.label}>Ödül</Text>
          <View style={styles.rewardRow}>
            <Text style={typography.subtitle}>{report.rewardTitle}</Text>
            <GameChip label="Kazanıldı" tone="purple" />
          </View>
          {report.rewardDescription ? (
            <Text style={[typography.caption, styles.rewardDesc]}>
              {report.rewardDescription}
            </Text>
          ) : null}
        </GameCard>
      ) : null}

      <GameButton
        title="Operasyon Merkezine Dön"
        onPress={onGoHub}
        style={styles.primaryAction}
      />
    </AppScreen>
  );
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricItem}>
      <Text style={typography.caption}>{label}</Text>
      <Text style={typography.subtitle}>{value}</Text>
    </View>
  );
}

export function ReportScreen() {
  const router = useRouter();
  const report = useGameStore(selectLastDailyReport);
  const gameState = useGameStore((s) => s.gameState);
  const lastClosedDay = useGameStore((s) => s.lastClosedDay);
  const metrics = useGameMetrics();
  const xp = useGameStore(selectXp);
  const level = useGameStore(selectLevel);
  const decisionHistory = useGameStore(selectDecisionHistory);
  const snapshots = useGameStore(selectSnapshots);

  const onGoHub = () => goToHub(router);

  if (!report) {
    return <ReportEmpty onGoHub={onGoHub} />;
  }

  const dayDecisions = decisionHistory.filter((r) => r.day === report.day);
  const pilotReportContext = getPilotReportContext({
    gameState,
    lastDailyReport: report,
    lastClosedDay,
    decisionHistory,
  });

  return (
    <ReportContent
      report={report}
      metrics={metrics}
      xp={xp}
      level={level}
      dayDecisions={dayDecisions}
      snapshotCount={snapshots.length}
      pilotReportContext={pilotReportContext}
      onGoHub={onGoHub}
    />
  );
}

const styles = StyleSheet.create({
  emptyBody: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
  primaryAction: {
    marginTop: spacing.lg,
  },
  sectionCard: {
    gap: spacing.md,
  },
  lineList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  summaryLine: {
    ...typography.body,
  },
  warningLine: {
    ...typography.body,
    color: colors.danger,
  },
  highlightLine: {
    ...typography.body,
    color: colors.success,
  },
  metricsGrid: {
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  metricItem: {
    gap: spacing.xs,
  },
  stats: {
    gap: spacing.sm,
  },
  statCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    gap: spacing.md,
  },
  rewardDesc: {
    marginTop: spacing.sm,
  },
  decisionsList: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  decisionRow: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  snapshotHint: {
    marginTop: spacing.xs,
  },
});
