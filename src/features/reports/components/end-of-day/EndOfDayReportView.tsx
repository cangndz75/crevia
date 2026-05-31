import Animated, { FadeInUp } from 'react-native-reanimated';
import { StyleSheet, Text, View } from 'react-native';
import { useEffect, useMemo } from 'react';

import {
  buildCrisisAnalyticsPayload,
  buildResourceAnalyticsPayload,
  buildSeasonEndAnalyticsPayload,
} from '@/core/analytics/analyticsPayloadBuilders';
import {
  buildCommonAnalyticsBase,
  trackOncePerRuntime,
} from '@/core/analytics/analyticsRuntime';
import { normalizeAuthorityState } from '@/core/authority/authoritySeed';
import { buildSeasonEndEvaluationModel, buildSeasonEndReportCardModel } from '@/core/seasonEnd';
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
import { ReportSeasonEndEvaluationCard } from '@/features/reports/components/ReportSeasonEndEvaluationCard';
import { ReportMicroDecisionsCard } from '@/features/reports/components/ReportMicroDecisionsCard';
import { ReportDailyPlanImpactCard } from '@/features/reports/components/ReportDailyPlanImpactCard';
import { ReportOperationSignalsCard } from '@/features/reports/components/ReportOperationSignalsCard';
import { ReportOperationalResourcesCard } from '@/features/reports/components/ReportOperationalResourcesCard';
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
import {
  buildFirstTenMinutesReportGuard,
  DAY1_REPORT_EDUCATIONAL_LINES,
  resolveFirstTenMinutesDay,
} from '@/core/onboarding/firstTenMinutesPresentation';
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
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const crisisState = useGameStore((s) => s.crisisState);
  const operationalResources = useGameStore((s) => s.operationalResources);
  const mainOperationSeason = useGameStore((s) => s.mainOperationSeason);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const crisisActionState = useGameStore((s) => s.crisisActionState);
  const assignments = useGameStore((s) => s.assignments);
  const microDecisionState = useGameStore((s) => s.microDecisionState);
  const socialPulseState = useGameStore((s) => s.socialPulseState);

  const reportGuard = useMemo(
    () => buildFirstTenMinutesReportGuard(gameState),
    [gameState],
  );
  const firstTenMinutesDay = resolveFirstTenMinutesDay(gameState);
  const educationalLines = useMemo(() => {
    if (firstTenMinutesDay > 2) return [];
    const cap = reportGuard.educationalLineCap;
    return DAY1_REPORT_EDUCATIONAL_LINES.slice(0, cap);
  }, [firstTenMinutesDay, reportGuard.educationalLineCap]);

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

  const seasonEndInput = useMemo(
    () => ({
      gameState,
      monetization,
      mainOperationSeason,
      operationSignals,
      operationalResources,
      crisisState,
      crisisActionState,
      assignments,
      microDecisionState,
      socialPulseState,
    }),
    [
      assignments,
      crisisActionState,
      crisisState,
      gameState,
      mainOperationSeason,
      microDecisionState,
      monetization,
      operationSignals,
      operationalResources,
      socialPulseState,
    ],
  );

  const seasonEndEvaluation = useMemo(
    () => buildSeasonEndEvaluationModel(seasonEndInput),
    [seasonEndInput],
  );

  const seasonEndCardModel = useMemo(
    () => buildSeasonEndReportCardModel(seasonEndInput),
    [seasonEndInput],
  );

  useEffect(() => {
    const base = buildCommonAnalyticsBase(gameState, 'report', monetization);
    const dayKey = report.day;

    trackOncePerRuntime(`report_opened:${dayKey}`, 'report_opened', base);
    trackOncePerRuntime(`report_primary_impact_seen:${dayKey}`, 'report_primary_impact_seen', base);

    if (!reportGuard.compactPrimaryImpact) {
      trackOncePerRuntime(`report_daily_plan_seen:${dayKey}`, 'report_daily_plan_seen', base);
      trackOncePerRuntime(
        `report_assignment_seen:${dayKey}`,
        'report_assignment_seen',
        base,
        { assignmentFitBand: 'steady' },
      );
    }

    if (!reportGuard.hideCrisis) {
      trackOncePerRuntime(
        `report_crisis_seen:${dayKey}`,
        'report_crisis_seen',
        base,
        buildCrisisAnalyticsPayload(crisisState, gameState, monetization),
      );
    }

    const activeCrisisAction = crisisActionState.activeActionId
      ? crisisActionState.actionsById[crisisActionState.activeActionId]
      : undefined;
    if (!reportGuard.hideCrisisActions && activeCrisisAction?.type) {
      trackOncePerRuntime(
        `crisis_action_processed:${dayKey}`,
        'crisis_action_processed',
        buildCommonAnalyticsBase(gameState, 'hub', monetization),
        {
          ...buildCrisisAnalyticsPayload(crisisState, gameState, monetization),
          hasCrisisAction: true,
          optionId: activeCrisisAction.type,
        },
      );
    }

    trackOncePerRuntime(
      `report_resources_seen:${dayKey}`,
      'report_resources_seen',
      base,
      buildResourceAnalyticsPayload(operationalResources),
    );

    if (!reportGuard.hideMicroDecisions) {
      trackOncePerRuntime(`report_micro_decision_seen:${dayKey}`, 'report_micro_decision_seen', base);
    }

    if (!reportGuard.hideMainOperation) {
      trackOncePerRuntime(`report_main_operation_seen:${dayKey}`, 'report_main_operation_seen', base);
    }

    if (seasonEndEvaluation) {
      const seasonPayload = buildSeasonEndAnalyticsPayload(
        seasonEndEvaluation,
        gameState,
        monetization,
      );
      trackOncePerRuntime(`season_end_seen:${dayKey}`, 'season_end_seen', base, seasonPayload);
      trackOncePerRuntime(
        `report_season_end_seen:${dayKey}`,
        'report_season_end_seen',
        base,
        seasonPayload,
      );
    }
  }, [
    crisisActionState.activeActionId,
    crisisState,
    gameState,
    monetization,
    operationalResources,
    report.day,
    reportGuard.compactPrimaryImpact,
    reportGuard.hideCrisis,
    reportGuard.hideCrisisActions,
    reportGuard.hideMainOperation,
    reportGuard.hideMicroDecisions,
    seasonEndEvaluation,
  ]);

  return (
    <View style={styles.stack}>
      <Animated.View entering={ENTER.header}>
        <ReportHeaderCard model={headerModel} />
      </Animated.View>

      <Animated.View entering={ENTER.hero}>
        <EndOfDayReportHero
          day={model.day}
          statusTitle={model.statusTitle}
          successScore={reportGuard.hideMetaProgressHeavy ? 0 : model.successScore}
          subtitle={model.heroSubtitle}
          hideScoreRing={reportGuard.hideMetaProgressHeavy}
        />
      </Animated.View>

      {educationalLines.length > 0 ? (
        <View style={styles.educationalBlock}>
          {educationalLines.map((line) => (
            <Text key={line} style={styles.educationalLine} numberOfLines={2}>
              {line}
            </Text>
          ))}
        </View>
      ) : null}

      <Animated.View entering={ENTER.impact}>
        <ReportPrimaryImpactSection model={impactModel} />
      </Animated.View>

      <ReportOperationSignalsCard
        report={report}
        compact={model.isDay1 || reportGuard.compactPrimaryImpact}
      />

      <ReportOperationalResourcesCard
        report={report}
        compact={model.isDay1 || reportGuard.compactPrimaryImpact}
      />

      {!reportGuard.hideCrisis ? (
        <ReportCrisisDeskCard report={report} compact={model.isDay1} />
      ) : null}

      {!reportGuard.hideCrisisActions ? (
        <ReportCrisisActionCard report={report} compact={model.isDay1} />
      ) : null}

      <ReportDailyPlanImpactCard
        report={report}
        compact={model.isDay1 || reportGuard.compactPrimaryImpact}
      />

      <ReportAssignmentBalanceCard
        report={report}
        compact={model.isDay1 || reportGuard.compactPrimaryImpact}
      />

      {!reportGuard.hideMicroDecisions ? (
        <ReportMicroDecisionsCard report={report} compact={model.isDay1} />
      ) : null}

      {!reportGuard.hideMainOperation ? (
        <ReportSeasonEndEvaluationCard report={report} compact={model.isDay1} />
      ) : null}

      {!reportGuard.hideMainOperation ? (
        <ReportMainOperationSeasonCard report={report} compact={model.isDay1} />
      ) : null}

      <ReportAdvisorCommentCard
        report={report}
        compact={model.isDay1 || reportGuard.shortAdvisor}
      />

      {!reportGuard.hideMetaProgressHeavy ? (
        <Animated.View entering={ENTER.authority}>
          <ReportAuthorityTrustCard model={authorityModel} />
        </Animated.View>
      ) : null}

      {!reportGuard.hideMetaProgressHeavy ? (
        <Animated.View entering={ENTER.badge}>
          <EndOfDayReportMetaProgressSection
            authorityLines={[]}
            badgeEvaluation={report.badgeEvaluation}
            compact={model.isDay1}
            badgeOnly
          />
        </Animated.View>
      ) : null}

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
  educationalBlock: {
    gap: 6,
    paddingHorizontal: 4,
    minWidth: 0,
  },
  educationalLine: {
    fontSize: 13,
    lineHeight: 18,
    color: '#3D4F4C',
    flexShrink: 1,
  },
});
