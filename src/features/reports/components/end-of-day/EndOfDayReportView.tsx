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
import { ReportPilotThemeSummary } from '@/features/reports/components/ReportPilotThemeSummary';
import { EndOfDayReportMetaProgressSection } from '@/features/reports/components/end-of-day/EndOfDayReportMetaProgressSection';
import { ReportAuthorityTrustCard } from '@/features/reports/components/end-of-day/premium/ReportAuthorityTrustCard';
import { ReportPilotSummaryPremiumCard } from '@/features/reports/components/end-of-day/premium/ReportPilotSummaryPremiumCard';
import { ReportPrimaryImpactSection } from '@/features/reports/components/end-of-day/premium/ReportPrimaryImpactSection';
import { buildReportCarryOverPreview } from '@/core/carryOver';
import {
  buildDistrictOperationActionDailySummary,
  buildDistrictOperationActionReportLine,
} from '@/core/districtOperationActions';
import { buildReportSystemsIntegrationModel } from '@/core/reports/reportSystemsIntegrationPresentation';
import { getEventAssignment } from '@/core/assignments/assignmentState';
import { buildMapBeforeAfterSummary } from '@/core/mapPresence';
import { ReportSystemsIntegrationCard } from '@/features/reports/components/ReportSystemsIntegrationCard';
import {
  buildReportTomorrowPreviewSummary,
  isReportTomorrowPreviewDuplicateOf,
  shouldShowReportTomorrowPreview,
} from '@/core/reports/reportTomorrowPreviewPresentation';
import { buildSocialDecisionEcho } from '@/core/socialEcho/socialEchoSelectors';
import { buildSocialEchoContextFromPulseArgs } from '@/core/socialEcho/socialEchoPresentation';
import { buildEventDomainFocusModel } from '@/core/events/eventDomainPresentation';
import { ReportCarryOverPreviewCard } from '@/features/reports/components/ReportCarryOverPreviewCard';
import {
  buildResourceFatiguePanelLine,
  buildResourceFatigueVisualSummary,
} from '@/core/resources';
import { ResourceFatigueStateChip } from '@/features/resources/components/ResourceFatigueStateChip';
import { ReportTomorrowPreviewCard } from '@/features/reports/components/ReportTomorrowPreviewCard';
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
  const districtOperationActionState = useGameStore(
    (s) => s.districtOperationActionState,
  );
  const assignments = useGameStore((s) => s.assignments);
  const microDecisionState = useGameStore((s) => s.microDecisionState);
  const socialPulseScore = useGameStore((s) => s.socialPulseState.globalPulseScore);
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

  const districtOperationActionSummary = useMemo(
    () =>
      buildDistrictOperationActionDailySummary(
        districtOperationActionState,
        report.day,
      ),
    [districtOperationActionState, report.day],
  );

  const districtOperationActionReportLine = useMemo(() => {
    const selected = districtOperationActionSummary.selectedAction;
    return selected ? buildDistrictOperationActionReportLine(selected) : null;
  }, [districtOperationActionSummary.selectedAction]);

  const gameStatus = useGameStatus();

  const model = useMemo(
    () =>
      buildEndOfDayReportViewModel({
        report,
        metrics,
        dailyXpReport,
        day1PriorityLine,
        day1GoalsLine,
        postPilotLightDay,
      }),
    [
      report,
      metrics,
      dailyXpReport,
      day1PriorityLine,
      day1GoalsLine,
      postPilotLightDay,
    ],
  );

  const tomorrowNotesKey = useMemo(
    () => (model.tomorrowNotes ?? []).join('\u0001'),
    [model.tomorrowNotes],
  );

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

  const lastDecisionForDay = useMemo(() => {
    const dayRecords = decisionHistory.filter((r) => r.day === report.day);
    return dayRecords[dayRecords.length - 1];
  }, [decisionHistory, report.day]);

  const reportCarryOverMemory = useMemo(
    () =>
      buildReportCarryOverPreview({
        day: report.day,
        currentDailyReport: report,
        recentDecisions: decisionHistory,
        currentEvent: lastDecisionForDay
          ? {
              id: lastDecisionForDay.eventId,
              title: lastDecisionForDay.eventTitle,
              neighborhoodId: lastDecisionForDay.neighborhoodId,
              category: 'operations',
            }
          : undefined,
      }),
    [decisionHistory, lastDecisionForDay, report],
  );

  const eventDomainFocus = useMemo(() => {
    if (!lastDecisionForDay) return null;
    return buildEventDomainFocusModel({
      event: {
        id: lastDecisionForDay.eventId,
        title: lastDecisionForDay.eventTitle,
        neighborhoodId: lastDecisionForDay.neighborhoodId,
      },
      day: report.day,
      includeEcho: true,
    });
  }, [lastDecisionForDay, report.day]);

  const socialEchoForReport = useMemo(() => {
    const ctx = buildSocialEchoContextFromPulseArgs({
      day: report.day,
      lastDecisionResult: lastDecisionForDay
        ? {
            eventId: lastDecisionForDay.eventId,
            resultTone: 'mixed',
          }
        : undefined,
      currentEvent: lastDecisionForDay
        ? {
            id: lastDecisionForDay.eventId,
            title: lastDecisionForDay.eventTitle,
            neighborhoodId: lastDecisionForDay.neighborhoodId,
          }
        : undefined,
      eventDomainFocus: eventDomainFocus ?? undefined,
      carryOverMemory: reportCarryOverMemory ?? undefined,
      dailyReport: report,
      operationSignals,
      socialPulseState: { score: socialPulseScore },
    });
    return buildSocialDecisionEcho(ctx);
  }, [
    eventDomainFocus,
    lastDecisionForDay,
    operationSignals,
    report,
    reportCarryOverMemory,
    socialPulseScore,
  ]);

  const tomorrowPreviewBundle = useMemo(() => {
    const existingLines = [
      ...(model.tomorrowNotes ?? []),
      reportCarryOverMemory?.summary ?? '',
      socialEchoForReport?.mention ?? '',
      eventDomainFocus?.reportEchoLine ?? '',
      districtOperationActionReportLine ?? '',
    ].filter(Boolean);

    const previewInput = {
      day: report.day,
      currentReport: report,
      lastEventResult: lastDecisionForDay
        ? {
            eventId: lastDecisionForDay.eventId,
            summaryTitle: lastDecisionForDay.decisionLabel,
          }
        : undefined,
      carryOverMemory: reportCarryOverMemory ?? undefined,
      eventDomainFocus: eventDomainFocus ?? undefined,
      socialEcho: socialEchoForReport ?? undefined,
      operationSignals,
      existingLines,
    };

    const summary = buildReportTomorrowPreviewSummary(previewInput);
    const showPreview = shouldShowReportTomorrowPreview(report.day, previewInput);
    const carryOverDuplicatesPreview = isReportTomorrowPreviewDuplicateOf(
      summary.preview,
      reportCarryOverMemory?.summary,
    );

    return { summary, showPreview, carryOverDuplicatesPreview };
  }, [
    eventDomainFocus,
    districtOperationActionReportLine,
    lastDecisionForDay,
    model.tomorrowNotes,
    operationSignals,
    report,
    reportCarryOverMemory,
    socialEchoForReport,
    tomorrowNotesKey,
  ]);

  const tomorrowNotesModel = useMemo(
    () => buildReportTomorrowNotesModel(model.tomorrowNotes),
    [model.tomorrowNotes],
  );

  const reportFatigueState = useMemo(() => {
    if (report.day <= 1) return null;
    const preview = tomorrowPreviewBundle.summary.preview;
    if (tomorrowPreviewBundle.showPreview && preview) {
      if (preview.domain === 'container' || preview.domain === 'vehicle_route') {
        return null;
      }
    }
    return buildResourceFatigueVisualSummary({
      day: report.day,
      surface: 'report',
      operationalResources,
      operationSignals: {
        dailyFocus: operationSignals.dailyFocus,
        overall: { status: operationSignals.overall.status },
        vehicles: { status: operationSignals.vehicles.status },
        personnel: { status: operationSignals.personnel.status },
        containers: { status: operationSignals.containers.status },
      },
      carryOverMemory: reportCarryOverMemory ?? undefined,
      reportTomorrowPreview: preview
        ? { domain: preview.domain, visible: true }
        : undefined,
    }).primaryState;
  }, [
    operationSignals,
    operationalResources,
    report.day,
    reportCarryOverMemory,
    tomorrowPreviewBundle.showPreview,
    tomorrowPreviewBundle.summary.preview,
  ]);

  const reportSystemsIntegration = useMemo(() => {
    const existingEchoLines: string[] = [
      ...(model.tomorrowNotes ?? []),
      ...(report.summaryLines ?? []),
      ...(report.carryOverSummaryLines ?? []),
      reportCarryOverMemory?.summary ?? '',
      socialEchoForReport?.mention ?? '',
      eventDomainFocus?.reportEchoLine ?? '',
      districtOperationActionReportLine ?? '',
      tomorrowPreviewBundle.summary.preview?.summary ?? '',
    ].filter(Boolean);

    const fatiguePanelLine = reportFatigueState
      ? buildResourceFatiguePanelLine(reportFatigueState)
      : undefined;
    if (fatiguePanelLine) existingEchoLines.push(fatiguePanelLine);

    const mapSummary = buildMapBeforeAfterSummary({
      day: report.day,
      surface: 'report',
      activeEvent: lastDecisionForDay
        ? {
            id: lastDecisionForDay.eventId,
            title: lastDecisionForDay.eventTitle,
            neighborhoodId: lastDecisionForDay.neighborhoodId,
          }
        : undefined,
      carryOverMemory: reportCarryOverMemory
        ? {
            domain: reportCarryOverMemory.domain,
            summary: reportCarryOverMemory.summary,
            resolved: reportCarryOverMemory.direction === 'positive_memory',
          }
        : null,
      eventDomainFocus: eventDomainFocus
        ? {
            focus: eventDomainFocus.focus,
            reportEchoLine: eventDomainFocus.reportEchoLine ?? undefined,
            summary: eventDomainFocus.summary,
          }
        : null,
    });

    const assignment = lastDecisionForDay
      ? getEventAssignment(assignments, lastDecisionForDay.eventId)
      : undefined;

    return buildReportSystemsIntegrationModel({
      dailyReport: report,
      day: report.day,
      focusDistrictId: lastDecisionForDay?.neighborhoodId,
      lastEvent: lastDecisionForDay
        ? {
            id: lastDecisionForDay.eventId,
            title: lastDecisionForDay.eventTitle,
            neighborhoodId: lastDecisionForDay.neighborhoodId,
            category: 'operations',
            riskLevel: 'medium',
            district: lastDecisionForDay.neighborhoodName ?? 'Merkez',
            description: '',
            contextTag: '',
            urgencyHours: 4,
            day: report.day,
            previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
            decisions: [],
          }
        : undefined,
      operationSignals,
      resourceFatigue: operationalResources,
      crisisState,
      carryOverMemory: reportCarryOverMemory ?? undefined,
      reportTomorrowPreview: tomorrowPreviewBundle.summary,
      mapAfterEffectSummary: mapSummary.impact?.summary,
      rankKey: authorityState?.formalRankId,
      unlockedPermissionIds: authorityState?.unlockedPermissionIds,
      isPostPilot: report.day >= POST_PILOT_FIRST_OPERATION_DAY,
      isPilotCompleted: pilotStatus === 'completed',
      existingEchoLines,
      suppressResourceFatigue: Boolean(reportFatigueState),
      resourceFatiguePanelLine: fatiguePanelLine,
      activeTaskRouteContext: {
        day: report.day,
        assignment,
        operationSignals,
        operationalResources,
        crisisState,
        isResultPhase: true,
        eventPhase: 'result',
        rankKey: authorityState?.formalRankId,
        unlockedPermissionIds: authorityState?.unlockedPermissionIds,
        activeEvent: lastDecisionForDay
          ? {
              id: lastDecisionForDay.eventId,
              title: lastDecisionForDay.eventTitle,
              neighborhoodId: lastDecisionForDay.neighborhoodId,
              category: 'operations',
              riskLevel: 'medium',
              district: lastDecisionForDay.neighborhoodName ?? 'Merkez',
              description: '',
              contextTag: '',
              urgencyHours: 4,
              day: report.day,
              previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
              decisions: [],
            }
          : undefined,
      },
    });
  }, [
    assignments,
    authorityState?.formalRankId,
    authorityState?.unlockedPermissionIds,
    crisisState,
    districtOperationActionReportLine,
    eventDomainFocus?.focus,
    eventDomainFocus?.reportEchoLine,
    eventDomainFocus?.summary,
    lastDecisionForDay,
    model.tomorrowNotes,
    operationalResources,
    operationSignals,
    pilotStatus,
    report,
    reportCarryOverMemory,
    reportFatigueState,
    socialEchoForReport?.mention,
    tomorrowPreviewBundle.summary,
    tomorrowPreviewBundle.summary.preview?.summary,
  ]);
  const reportSystemsAnalyticsContext = useMemo(
    () => ({
      day: report.day,
      rankId: authorityState?.formalRankId,
      isPostPilot: report.day >= POST_PILOT_FIRST_OPERATION_DAY,
      source: 'end_of_day_report_systems_integration',
    }),
    [authorityState?.formalRankId, report.day],
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

      <ReportPilotThemeSummary day={report.day} />

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

      {tomorrowPreviewBundle.showPreview && tomorrowPreviewBundle.summary.preview ? (
        <ReportTomorrowPreviewCard
          preview={tomorrowPreviewBundle.summary.preview}
          compact={
            model.isDay7 ||
            tomorrowPreviewBundle.summary.preview.visibility === 'compact' ||
            tomorrowPreviewBundle.summary.preview.visibility === 'final_safe'
          }
        />
      ) : null}

      <ReportOperationSignalsCard
        report={report}
        compact={model.isDay1 || reportGuard.compactPrimaryImpact}
      />

      <ReportOperationalResourcesCard
        report={report}
        compact={model.isDay1 || reportGuard.compactPrimaryImpact}
      />

      {reportFatigueState ? (
        <View style={styles.fatigueReportRow}>
          <ResourceFatigueStateChip model={reportFatigueState} compact />
          <Text style={styles.fatigueReportText} numberOfLines={2}>
            {buildResourceFatiguePanelLine(reportFatigueState)}
          </Text>
        </View>
      ) : null}

      {districtOperationActionReportLine ? (
        <View style={styles.districtActionReportRow}>
          <Text style={styles.districtActionReportLabel} numberOfLines={1}>
            Mahalle hamlesi
          </Text>
          <Text style={styles.districtActionReportText} numberOfLines={2}>
            {districtOperationActionReportLine}
          </Text>
        </View>
      ) : null}

      {reportSystemsIntegration?.visible ? (
        <ReportSystemsIntegrationCard
          model={reportSystemsIntegration}
          analyticsContext={reportSystemsAnalyticsContext}
        />
      ) : null}

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
          {reportCarryOverMemory?.visible && !tomorrowPreviewBundle.carryOverDuplicatesPreview ? (
            <ReportCarryOverPreviewCard
              memory={reportCarryOverMemory}
              compact={model.isDay7}
            />
          ) : (
            <ReportTomorrowNotesCard model={tomorrowNotesModel} />
          )}
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
  fatigueReportRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: 0,
    paddingHorizontal: 4,
  },
  fatigueReportText: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 18,
    color: '#3D4F4C',
  },
  districtActionReportRow: {
    gap: 4,
    minWidth: 0,
    paddingHorizontal: 4,
  },
  districtActionReportLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0E5F5B',
  },
  districtActionReportText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#3D4F4C',
    flexShrink: 1,
  },
});
