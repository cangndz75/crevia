import Animated, { FadeInUp } from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';
import { useMemo } from 'react';

import { normalizeAuthorityState } from '@/core/authority/authoritySeed';
import type { DailyReport } from '@/core/models/DailyReport';
import type { GameMetrics } from '@/core/models/GameMetrics';
import type { DailyXpReport } from '@/core/xp/xpReport';
import { EndOfDayReportHero } from '@/features/reports/components/end-of-day/EndOfDayReportHero';
import { EndOfDayReportMetaProgressSection } from '@/features/reports/components/end-of-day/EndOfDayReportMetaProgressSection';
import { ReportAuthorityTrustCard } from '@/features/reports/components/end-of-day/premium/ReportAuthorityTrustCard';
import { ReportPilotSummaryPremiumCard } from '@/features/reports/components/end-of-day/premium/ReportPilotSummaryPremiumCard';
import { ReportPrimaryImpactSection } from '@/features/reports/components/end-of-day/premium/ReportPrimaryImpactSection';
import { ReportTomorrowNotesCard } from '@/features/reports/components/end-of-day/premium/ReportTomorrowNotesCard';
import { ReportAdvisorCommentCard } from '@/features/reports/components/ReportAdvisorCommentCard';
import { ReportAssignmentBalanceCard } from '@/features/reports/components/ReportAssignmentBalanceCard';
import { ReportCrisisActionCard } from '@/features/reports/components/ReportCrisisActionCard';
import { ReportCrisisDeskCard } from '@/features/reports/components/ReportCrisisDeskCard';
import { ReportMainOperationSeasonCard } from '@/features/reports/components/ReportMainOperationSeasonCard';
import { ReportMicroDecisionsCard } from '@/features/reports/components/ReportMicroDecisionsCard';
import { ReportDailyPlanImpactCard } from '@/features/reports/components/ReportDailyPlanImpactCard';
import { ReportOperationSignalsCard } from '@/features/reports/components/ReportOperationSignalsCard';
import { ReportHeaderCard } from '@/features/reports/components/ReportHeaderCard';
import { ReportPilotCompletionCard } from '@/features/reports/components/ReportPilotCompletionCard';
import {
  buildReportAuthorityTrustModel,
  buildReportPilotSummaryPremiumModel,
  buildReportPrimaryImpactModel,
  buildReportTomorrowNotesModel,
} from '@/features/reports/presentation/reportPremiumPresentation';
import {
  buildReportHeaderModel,
} from '@/features/reports/presentation/reportScreenPresentation';
import type { PilotReportContext } from '@/features/reports/utils/pilotReportPresentation';
import { buildEndOfDayReportViewModel } from '@/features/reports/utils/endOfDayReportPresentation';
import type { useReportPilotCompletionSummary } from '@/features/pilot/hooks/usePilotCompletionSummary';
import { normalizePostPilotOperationState } from '@/core/postPilot';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import {
  selectDecisionHistory,
  useGameStore,
} from '@/store/useGameStore';
import { useGameStatus } from '@/store/gameSelectors';

type Props = {
  report: DailyReport;
  metrics: GameMetrics;
  dailyXpReport: DailyXpReport;
  day1PriorityLine?: string | null;
  day1GoalsLine?: string | null;
  pilotReportContext: PilotReportContext | null;
  pilotCompletionSummary: ReturnType<typeof useReportPilotCompletionSummary>;
};

const ENTER = {
  header: FadeInUp.delay(0).duration(260).springify().damping(24),
  hero: FadeInUp.delay(40).duration(260).springify().damping(24),
  impact: FadeInUp.delay(80).duration(260).springify().damping(24),
  authority: FadeInUp.delay(120).duration(260).springify().damping(24),
  badge: FadeInUp.delay(140).duration(260).springify().damping(24),
  notes: FadeInUp.delay(160).duration(260).springify().damping(24),
  pilot: FadeInUp.delay(200).duration(260).springify().damping(24),
  completion: FadeInUp.delay(240).duration(260).springify().damping(24),
} as const;

const PREMIUM_SECTION_GAP = 16;

export function EndOfDayReportView({
  report,
  metrics,
  dailyXpReport,
  day1PriorityLine,
  day1GoalsLine,
  pilotReportContext,
  pilotCompletionSummary,
}: Props) {
  const decisionHistory = useGameStore(selectDecisionHistory);
  const pilotAuthorityState = useGameStore(
    (s) => s.gameState.pilot.authorityState,
  );
  const pilotStatus = useGameStore((s) => s.gameState.pilot.status);
  const postPilotOperation = useGameStore(
    (s) => s.gameState.pilot.postPilotOperation,
  );
  const currentPilotDay = useGameStore((s) => s.gameState.pilot.currentPilotDay);

  const postPilotLightDay = useMemo(() => {
    if (pilotStatus !== 'completed') {
      return false;
    }
    const postPilot = normalizePostPilotOperationState(postPilotOperation, {
      pilotStatus: 'completed',
      currentPilotDay,
    });
    return (
      postPilot.phase === 'main_operation_light' &&
      report.day >= POST_PILOT_FIRST_OPERATION_DAY
    );
  }, [pilotStatus, postPilotOperation, currentPilotDay, report.day]);

  const authorityState = useMemo(
    () => normalizeAuthorityState(pilotAuthorityState, report.day),
    [pilotAuthorityState, report.day],
  );

  const gameStatus = useGameStatus();

  const model = buildEndOfDayReportViewModel({
    report,
    metrics,
    dailyXpReport,
    day1PriorityLine,
    day1GoalsLine,
    postPilotLightDay,
  });

  const headerModel = buildReportHeaderModel(gameStatus, report.day);

  const impactModel = useMemo(
    () =>
      buildReportPrimaryImpactModel({
        metrics,
        decisionHistory,
        day: report.day,
        createdAt: report.createdAt,
      }),
    [metrics, decisionHistory, report.day, report.createdAt],
  );

  const authorityModel = useMemo(
    () =>
      buildReportAuthorityTrustModel({
        authorityLines: report.authoritySummaryLines ?? [],
        authorityDailyGain: report.authorityDailyGain,
        authorityState,
      }),
    [report.authoritySummaryLines, report.authorityDailyGain, authorityState],
  );

  const tomorrowNotesModel = useMemo(
    () => buildReportTomorrowNotesModel(model.tomorrowNotes),
    [model.tomorrowNotes],
  );

  const pilotPremiumModel = useMemo(
    () =>
      pilotReportContext
        ? buildReportPilotSummaryPremiumModel({
            context: pilotReportContext,
            decisionHistory,
            reportDay: report.day,
          })
        : null,
    [pilotReportContext, decisionHistory, report.day],
  );

  return (
    <View style={styles.stack}>
      <Animated.View entering={ENTER.header}>
        <ReportHeaderCard model={headerModel} />
      </Animated.View>

      <Animated.View entering={ENTER.hero}>
        <EndOfDayReportHero
          day={model.day}
          statusTitle={model.statusTitle}
          successScore={model.successScore}
          subtitle={model.heroSubtitle}
        />
      </Animated.View>

      <Animated.View entering={ENTER.impact}>
        <ReportPrimaryImpactSection model={impactModel} />
      </Animated.View>

      <ReportOperationSignalsCard report={report} compact={model.isDay1} />

      <ReportCrisisDeskCard report={report} compact={model.isDay1} />

      <ReportCrisisActionCard report={report} compact={model.isDay1} />

      <ReportDailyPlanImpactCard report={report} compact={model.isDay1} />

      <ReportAssignmentBalanceCard report={report} compact={model.isDay1} />

      <ReportMicroDecisionsCard report={report} compact={model.isDay1} />

      <ReportMainOperationSeasonCard report={report} compact={model.isDay1} />

      <ReportAdvisorCommentCard report={report} compact={model.isDay1} />

      <Animated.View entering={ENTER.authority}>
        <ReportAuthorityTrustCard model={authorityModel} />
      </Animated.View>

      <Animated.View entering={ENTER.badge}>
        <EndOfDayReportMetaProgressSection
          authorityLines={[]}
          badgeEvaluation={report.badgeEvaluation}
          compact={model.isDay1}
          badgeOnly
        />
      </Animated.View>

      {model.showTomorrowNotes ? (
        <Animated.View entering={ENTER.notes}>
          <ReportTomorrowNotesCard model={tomorrowNotesModel} />
        </Animated.View>
      ) : null}

      {pilotPremiumModel ? (
        <Animated.View entering={ENTER.pilot}>
          <ReportPilotSummaryPremiumCard model={pilotPremiumModel} />
        </Animated.View>
      ) : null}

      {pilotCompletionSummary ? (
        <Animated.View entering={ENTER.completion}>
          <ReportPilotCompletionCard summary={pilotCompletionSummary} compact />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: PREMIUM_SECTION_GAP,
    backgroundColor: '#F7F3EB',
    minWidth: 0,
  },
});
