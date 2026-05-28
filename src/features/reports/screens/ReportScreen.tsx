import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { DailyReport } from '@/core/models/DailyReport';
import type { GameMetrics } from '@/core/models/GameMetrics';
import { PilotReportSummaryCard } from '@/features/reports/components/PilotReportSummaryCard';
import { ReportContainerSummary } from '@/features/reports/components/ReportContainerSummary';
import { ReportVehicleSummary } from '@/features/reports/components/ReportVehicleSummary';
import { ReportSocialSummary } from '@/features/reports/components/ReportSocialSummary';
import { ReportDailyGoalsSummary } from '@/features/reports/components/ReportDailyGoalsSummary';
import { ReportDailyPrioritySummary } from '@/features/reports/components/ReportDailyPrioritySummary';
import { buildDay1TutorialPriorityLine } from '@/core/dailyPriority/dailyPriorityPresentation';
import { ReportButterflySummary } from '@/features/reports/components/ReportButterflySummary';
import { ReportPersonnelSummary } from '@/features/reports/components/ReportPersonnelSummary';
import { getPilotReportContext } from '@/features/reports/utils/pilotReportPresentation';
import { TutorialCoachOverlay } from '@/features/tutorial/TutorialCoachOverlay';
import {
  applyDay1TutorialReportCopy,
  selectShowDay1TutorialReportCopy,
} from '@/features/tutorial/tutorialSelectors';
import { buildDailyEconomyReport } from '@/core/economy/economyReport';
import {
  formatSourceAmount,
  formatSourceWithLabel,
} from '@/core/economy/economyFormatter';
import { buildDailyXpReport } from '@/core/xp/xpReport';
import { createInitialPlayerProgress } from '@/core/xp/levelProgress';
import {
  selectDecisionHistory,
  selectLastDailyReport,
  useGameMetrics,
  selectSnapshots,
  useGameStore,
} from '@/store/useGameStore';
import { DailyXpSummaryCard } from '@/ui/components/xp/DailyXpSummaryCard';
import { GameScreenShell } from '@/ui/components/GameScreenShell';
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

function goToHub(router: ReturnType<typeof useRouter>) {
  router.push('/');
}

type ReportEmptyProps = {
  onGoHub: () => void;
};

function ReportEmpty({ onGoHub }: ReportEmptyProps) {
  return (
    <GameScreenShell screenTitle="Raporlar">
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
    </GameScreenShell>
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
  dayDecisions: DecisionRecord[];
  snapshotCount: number;
  pilotReportContext: ReturnType<typeof getPilotReportContext>;
  dailyXpReport: ReturnType<typeof buildDailyXpReport>;
  dailySourceSpentLabel: string | null;
  currentLevel: number;
  currentLevelXp: number;
  nextLevelXp: number;
  xpToNextLevel: number;
  onGoHub: () => void;
};

function ReportContent({
  report,
  metrics,
  dayDecisions,
  snapshotCount,
  pilotReportContext,
  dailyXpReport,
  dailySourceSpentLabel,
  currentLevel,
  currentLevelXp,
  nextLevelXp,
  xpToNextLevel,
  onGoHub,
}: ReportContentProps) {
  const summaryLines = report.summaryLines ?? [];
  const identityLine = report.neighborhoodIdentityLine;
  const warnings = report.warnings ?? [];
  const highlights = report.highlights ?? [];

  return (
    <GameScreenShell screenTitle="Raporlar">
      <Text style={typography.title}>{report.title}</Text>
      <Text style={typography.caption}>Gün {report.day} tamamlandı</Text>

      {pilotReportContext ? (
        <PilotReportSummaryCard context={pilotReportContext} />
      ) : null}

      <LineList title="Özet" lines={summaryLines} />
      {identityLine ? (
        <Text style={typography.caption}>{identityLine}</Text>
      ) : null}
      <ReportDailyPrioritySummary
        result={report.dailyPriorityResult}
        day1Line={
          report.day === 1 ? buildDay1TutorialPriorityLine() : undefined
        }
      />
      <ReportDailyGoalsSummary results={report.dailyGoalResults} />
      <ReportButterflySummary lines={report.butterflySummaryLines ?? []} />
      <ReportPersonnelSummary lines={report.personnelSummaryLines ?? []} />
      <ReportContainerSummary lines={report.containerSummaryLines ?? []} />
      <ReportVehicleSummary lines={report.vehicleSummaryLines ?? []} />
      <ReportSocialSummary lines={report.socialSummaryLines ?? []} />
      <LineList title="Uyarılar" lines={warnings} tone="warning" />
      <LineList title="Öne Çıkanlar" lines={highlights} tone="highlight" />

      <GameCard padding="lg" style={styles.sectionCard}>
        <Text style={typography.label}>Güncel Metrikler</Text>
        <View style={styles.metricsGrid}>
          <MetricItem
            label="Halk Memnuniyeti"
            value={`%${metrics.publicSatisfaction}`}
          />
          <MetricItem label="Kaynak" value={formatSourceWithLabel(metrics.budget)} />
          <MetricItem
            label="Personel Morali"
            value={`%${metrics.staffMorale}`}
          />
        </View>
      </GameCard>

      {dailySourceSpentLabel ? (
        <Text style={[typography.body, styles.sourceSpentLine]}>
          Bugün Harcanan Kaynak: {dailySourceSpentLabel}
        </Text>
      ) : null}

      <DailyXpSummaryCard
        report={dailyXpReport}
        currentLevel={currentLevel}
        currentLevelXp={currentLevelXp}
        nextLevelXp={nextLevelXp}
        xpToNextLevel={xpToNextLevel}
      />

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
      <TutorialCoachOverlay screen="daily_report" />
    </GameScreenShell>
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
  const playerProgress = useGameStore(
    (s) => s.playerProgress ?? createInitialPlayerProgress(),
  );
  const decisionHistory = useGameStore(selectDecisionHistory);
  const snapshots = useGameStore(selectSnapshots);

  const onGoHub = () => goToHub(router);

  if (!report) {
    return <ReportEmpty onGoHub={onGoHub} />;
  }

  const dayDecisions = decisionHistory.filter((r) => r.day === report.day);
  const economyState = useGameStore((s) => s.economyState);
  const dailyXpReport = useMemo(
    () => buildDailyXpReport(playerProgress.xpHistory, report.day),
    [playerProgress.xpHistory, report.day],
  );
  const dailySourceSpentLabel = useMemo(() => {
    const spent = buildDailyEconomyReport(economyState, report.day).spent;
    return spent > 0 ? formatSourceAmount(spent) : null;
  }, [economyState, report.day]);
  const pilotReportContext = getPilotReportContext({
    gameState,
    lastDailyReport: report,
    lastClosedDay,
    decisionHistory,
  });

  const useDay1ReportCopy = useGameStore(selectShowDay1TutorialReportCopy);
  const displayReport = useMemo(
    () => applyDay1TutorialReportCopy(report, useDay1ReportCopy),
    [report, useDay1ReportCopy],
  );

  return (
    <ReportContent
      report={displayReport}
      metrics={metrics}
      dayDecisions={dayDecisions}
      snapshotCount={snapshots.length}
      pilotReportContext={pilotReportContext}
      dailyXpReport={dailyXpReport}
      dailySourceSpentLabel={dailySourceSpentLabel}
      currentLevel={playerProgress.currentLevel}
      currentLevelXp={playerProgress.currentLevelXp}
      nextLevelXp={playerProgress.nextLevelXp}
      xpToNextLevel={playerProgress.xpToNextLevel}
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
  sourceSpentLine: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
});
