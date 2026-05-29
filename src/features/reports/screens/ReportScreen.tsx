import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { resolveReportContinueCtaLabel } from '@/core/ux/uxFlowPresentation';
import { buildDay1TutorialPriorityLine } from '@/core/dailyPriority/dailyPriorityPresentation';
import { MAIN_OPERATION_PREVIEW_ROUTE } from '@/core/pilotCompletion';
import { buildDailyXpReport } from '@/core/xp/xpReport';
import { createInitialPlayerProgress } from '@/core/xp/levelProgress';
import { EndOfDayReportView } from '@/features/reports/components/end-of-day/EndOfDayReportView';
import { getPilotReportContext } from '@/features/reports/utils/pilotReportPresentation';
import { OnboardingCoachBubble } from '@/features/onboarding/components/OnboardingCoachBubble';
import { useOnboardingHint } from '@/features/onboarding/hooks/useOnboardingHint';
import { useReportPilotCompletionSummary } from '@/features/pilot/hooks/usePilotCompletionSummary';
import { TutorialCoachOverlay } from '@/features/tutorial/TutorialCoachOverlay';
import {
  applyDay1TutorialReportCopy,
  selectActiveTutorialStepForScreen,
  selectShowDay1TutorialReportCopy,
} from '@/features/tutorial/tutorialSelectors';
import {
  selectDecisionHistory,
  selectLastDailyReport,
  useGameMetrics,
  useGameStore,
} from '@/store/useGameStore';
import { GameScreenShell } from '@/ui/components/GameScreenShell';
import { GameButton } from '@/ui/components/GameButton';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

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

  const onGoHub = () => goToHub(router);

  if (!report) {
    return <ReportEmpty onGoHub={onGoHub} />;
  }

  const dailyXpReport = useMemo(
    () => buildDailyXpReport(playerProgress.xpHistory, report.day),
    [playerProgress.xpHistory, report.day],
  );

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
  const pilotCompletionSummary = useReportPilotCompletionSummary(
    displayReport.day,
  );

  const legacyTutorialStep = useGameStore((s) =>
    selectActiveTutorialStepForScreen(s, 'daily_report'),
  );
  const { coachHint, dismissHint } = useOnboardingHint('daily_report');

  const day1PriorityLine =
    displayReport.day === 1 ? buildDay1TutorialPriorityLine() : undefined;
  const day1GoalsLine =
    displayReport.day === 1 && useDay1ReportCopy
      ? 'İlk gün hedeflerini tanı; yarın tam takip başlar.'
      : undefined;

  const continueTitle = resolveReportContinueCtaLabel(
    displayReport.day,
    Boolean(pilotCompletionSummary),
  );

  const onContinue = () => {
    if (displayReport.day === 7 && pilotCompletionSummary) {
      router.push(MAIN_OPERATION_PREVIEW_ROUTE);
      return;
    }
    onGoHub();
  };

  return (
    <GameScreenShell screenTitle="Raporlar" contentStyle={styles.content}>
      <View style={styles.stack}>
        <EndOfDayReportView
          report={displayReport}
          metrics={metrics}
          dailyXpReport={dailyXpReport}
          day1PriorityLine={day1PriorityLine}
          day1GoalsLine={day1GoalsLine}
          pilotReportContext={pilotReportContext}
          pilotCompletionSummary={pilotCompletionSummary}
        />
      </View>

      <GameButton
        title={continueTitle}
        onPress={onContinue}
        style={styles.primaryAction}
      />
      <TutorialCoachOverlay screen="daily_report" />
      {coachHint && !legacyTutorialStep ? (
        <OnboardingCoachBubble
          hint={coachHint}
          onDismiss={() => dismissHint(coachHint.id)}
        />
      ) : null}
    </GameScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  stack: {
    gap: spacing.md,
  },
  emptyBody: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
  primaryAction: {
    marginTop: spacing.md,
    backgroundColor: colors.headerTealDark,
  },
});
