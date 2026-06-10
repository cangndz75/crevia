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
  getAnalyticsAccessModeFromGameState,
  trackOncePerRuntime,
} from '@/core/analytics/analyticsRuntime';
import { breadcrumbEndOfDayReportOpened } from '@/core/crashPerformance/crashBreadcrumbs';
import { startScreenTiming } from '@/core/crashPerformance/performanceLite';
import { normalizeAuthorityState } from '@/core/authority/authoritySeed';
import {
  buildCityEchoBinding,
  buildCityEchoReportLine,
} from '@/core/cityEchoBinding';
import {
  buildCityJournalLiteModel,
  buildCityJournalReportLine,
} from '@/core/cityJournal';
import { buildRewardComebackReportPresentation } from '@/core/rewardComeback';
import {
  buildDistrictReportCardFullModel,
  buildDistrictReportCardLineForReport,
} from '@/core/districtReportCard';
import { buildReportArchiveContinuityFromCandidates } from '@/core/cityArchive/cityArchiveSurfaceWiring';
import { buildPersistentStoryChainReportLine } from '@/core/storyChains/storyChainPersistentPresentation';
import {
  resolveTeamVehicleStrainReportPresentation,
  selectTeamSpecializationSurfaceLines,
} from '@/core/teamSpecialization/teamSpecializationSelectors';
import { selectVehicleMaintenanceSurfaceLines } from '@/core/vehicleMaintenance/vehicleMaintenanceSelectors';
import {
  reportSecondaryLineMaxLines,
  resolveReportSecondaryCompactMode,
} from '@/core/releaseCandidatePolish/reportSecondaryCompactPresentation';
import {
  buildOperationalResourcePresenceLiteInputFromEngine,
  buildOperationalResourcePresenceLiteModel,
  buildOperationalResourcePresenceReportLine,
} from '@/core/operationalResourcePresence';
import {
  buildDecisionImpactExplanation,
  buildDecisionImpactReportEcho,
} from '@/core/decisionImpactExplanation';
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
import { resolveContentPackMetaForWiring } from '@/core/contentRuntimeActivation';
import { resolveEventCardById } from '@/core/liveFlow/eventLifecycleEngine';
import { buildTomorrowRiskPresentation } from '@/core/tomorrowRisk';
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
import { ReportTomorrowRiskCard } from '@/features/reports/components/ReportTomorrowRiskCard';
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
import { CreviaAnimatedChip, CreviaAnimatedLine, useCreviaReducedMotion } from '@/shared/motion';

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
  const cityArchive = useGameStore((s) => s.cityArchive);
  const vehicleMaintenance = useGameStore((s) => s.vehicleMaintenance);
  const teamSpecialization = useGameStore((s) => s.teamSpecialization);
  const crisisActionState = useGameStore((s) => s.crisisActionState);
  const districtOperationActionState = useGameStore(
    (s) => s.districtOperationActionState,
  );
  const assignments = useGameStore((s) => s.assignments);
  const microDecisionState = useGameStore((s) => s.microDecisionState);
  const socialPulseScore = useGameStore((s) => s.socialPulseState.globalPulseScore);
  const socialPulseState = useGameStore((s) => s.socialPulseState);
  const eventPool = useGameStore((s) => s.eventPool);
  const reducedMotion = useCreviaReducedMotion();

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

  const reportSecondaryCompactMode = resolveReportSecondaryCompactMode(report.day);
  const reportSecondaryMaxLines = reportSecondaryLineMaxLines(reportSecondaryCompactMode);

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

  const reportPackWiringContext = useMemo(() => {
    if (!lastDecisionForDay?.eventId) {
      return { event: undefined, contentPackMeta: undefined };
    }
    const event = resolveEventCardById(
      lastDecisionForDay.eventId,
      gameState.events,
      eventPool,
    );
    const contentPackMeta = resolveContentPackMetaForWiring({
      event,
      eventId: lastDecisionForDay.eventId,
      districtId: lastDecisionForDay.neighborhoodId,
      day: report.day,
      eventPool,
    });
    return { event, contentPackMeta };
  }, [eventPool, gameState.events, lastDecisionForDay, report.day]);

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

  const decisionImpactReportEcho = useMemo(() => {
    if (!lastDecisionForDay) return null;
    return buildDecisionImpactReportEcho(
      buildDecisionImpactExplanation({
        day: report.day,
        event: reportPackWiringContext.event,
        snapshot: {
          id: `report-${lastDecisionForDay.id}`,
          day: lastDecisionForDay.day,
          eventId: lastDecisionForDay.eventId,
          eventTitle: lastDecisionForDay.eventTitle,
          neighborhoodId: lastDecisionForDay.neighborhoodId,
          neighborhoodName: lastDecisionForDay.neighborhoodName,
          decisionId: lastDecisionForDay.decisionId,
          decisionTitle: lastDecisionForDay.decisionLabel,
          decisionTone: 'balanced',
          createdAt: Date.parse(lastDecisionForDay.createdAt) || Date.now(),
          summaryTitle: lastDecisionForDay.eventTitle,
          summaryText: lastDecisionForDay.decisionLabel,
          resultTone: 'mixed',
          metricChanges: [],
          subsystemOutcomes: [],
          highlightLines: [],
          riskLines: [],
        },
        operationSignals,
        resourceFatigue: operationalResources,
        carryOverSummary: reportCarryOverMemory?.summary,
        dailyReport: report,
      }),
    );
  }, [
    lastDecisionForDay,
    operationSignals,
    operationalResources,
    report,
    reportCarryOverMemory?.summary,
    reportPackWiringContext.event,
  ]);

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
      decisionImpactReportEcho ?? '',
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
    decisionImpactReportEcho,
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

  const tomorrowRiskPresentation = useMemo(
    () =>
      buildTomorrowRiskPresentation({
        day: report.day,
        carryOver: reportCarryOverMemory ?? undefined,
        tomorrowHint: tomorrowPreviewBundle.summary.preview?.summary,
        reportTomorrowPreview: tomorrowPreviewBundle.summary.preview
          ? {
              summary: tomorrowPreviewBundle.summary.preview.summary,
              domain: tomorrowPreviewBundle.summary.preview.domain,
              visible: tomorrowPreviewBundle.showPreview,
            }
          : undefined,
        operationSignals,
        resourceFatigue: operationalResources,
        socialPulse: {
          globalPulseScore: socialPulseState.globalPulseScore,
        },
        postPilotOperation: postPilotOperation ?? undefined,
        contentPackMeta: reportPackWiringContext.contentPackMeta,
        event: reportPackWiringContext.event,
        existingLines: [
          ...(model.tomorrowNotes ?? []),
          ...(report.summaryLines ?? []),
          ...(report.carryOverSummaryLines ?? []),
          reportCarryOverMemory?.summary ?? '',
          socialEchoForReport?.mention ?? '',
          eventDomainFocus?.reportEchoLine ?? '',
          districtOperationActionReportLine ?? '',
          tomorrowPreviewBundle.summary.preview?.summary ?? '',
        ].filter(Boolean),
      }),
    [
      districtOperationActionReportLine,
      eventDomainFocus?.reportEchoLine,
      model.tomorrowNotes,
      operationSignals,
      operationalResources,
      postPilotOperation,
      report.carryOverSummaryLines,
      report.day,
      report.summaryLines,
      reportCarryOverMemory,
      socialEchoForReport?.mention,
      socialPulseState.globalPulseScore,
      tomorrowPreviewBundle.showPreview,
      tomorrowPreviewBundle.summary.preview,
    ],
  );

  const cityEchoReportLine = useMemo(() => {
    if (!lastDecisionForDay) return undefined;
    return buildCityEchoReportLine(
      buildCityEchoBinding({
        day: report.day,
        decisionImpact: buildDecisionImpactExplanation({
          day: report.day,
          event: reportPackWiringContext.event,
          snapshot: {
            id: `report-city-echo-${lastDecisionForDay.id}`,
            day: lastDecisionForDay.day,
            eventId: lastDecisionForDay.eventId,
            eventTitle: lastDecisionForDay.eventTitle,
            neighborhoodId: lastDecisionForDay.neighborhoodId,
            neighborhoodName: lastDecisionForDay.neighborhoodName,
            decisionId: lastDecisionForDay.decisionId,
            decisionTitle: lastDecisionForDay.decisionLabel,
            decisionTone: 'balanced',
            createdAt: Date.parse(lastDecisionForDay.createdAt) || Date.now(),
            summaryTitle: lastDecisionForDay.eventTitle,
            summaryText: lastDecisionForDay.decisionLabel,
            resultTone: 'mixed',
            metricChanges: [],
            subsystemOutcomes: [],
            highlightLines: [],
            riskLines: [],
          },
          operationSignals,
          resourceFatigue: operationalResources,
          carryOverSummary: reportCarryOverMemory?.summary,
          dailyReport: report,
        }),
        tomorrowRisk: tomorrowRiskPresentation.report,
        carryOverSummary: reportCarryOverMemory?.summary,
        event: reportPackWiringContext.event,
        contentPackMeta: reportPackWiringContext.contentPackMeta,
        operationSignals,
        socialPulse: {
          globalPulseScore: socialPulseState.globalPulseScore,
        },
        postPilotPhase: postPilotOperation?.phase,
        existingLines: [
          ...(model.tomorrowNotes ?? []),
          reportCarryOverMemory?.summary ?? '',
          socialEchoForReport?.mention ?? '',
          eventDomainFocus?.reportEchoLine ?? '',
          tomorrowPreviewBundle.summary.preview?.summary ?? '',
          tomorrowRiskPresentation.report?.mainLine ?? '',
          decisionImpactReportEcho ?? '',
        ].filter(Boolean),
      }),
    );
  }, [
    decisionImpactReportEcho,
    eventDomainFocus?.reportEchoLine,
    lastDecisionForDay,
    model.tomorrowNotes,
    operationSignals,
    operationalResources,
    postPilotOperation?.phase,
    report,
    reportCarryOverMemory?.summary,
    reportPackWiringContext.contentPackMeta,
    reportPackWiringContext.event,
    socialEchoForReport?.mention,
    socialPulseState.globalPulseScore,
    tomorrowPreviewBundle.summary.preview?.summary,
    tomorrowRiskPresentation.report,
  ]);

  const cityJournalReportLine = useMemo(() => {
    const existingLines = [
      cityEchoReportLine ?? '',
      decisionImpactReportEcho ?? '',
      reportCarryOverMemory?.summary ?? '',
      tomorrowRiskPresentation.report?.mainLine ?? '',
      socialEchoForReport?.mention ?? '',
      eventDomainFocus?.reportEchoLine ?? '',
    ].filter(Boolean);

    const model = buildCityJournalLiteModel({
      currentDay: report.day,
      isPostPilot: report.day >= POST_PILOT_FIRST_OPERATION_DAY,
      postPilotPhase: postPilotOperation?.phase ?? null,
      currentDailyReport: report,
      carryOverMemory: reportCarryOverMemory ?? undefined,
      decisionImpact: lastDecisionForDay
        ? buildDecisionImpactExplanation({
            day: report.day,
            event: reportPackWiringContext.event,
            snapshot: {
              id: `report-journal-${lastDecisionForDay.id}`,
              day: lastDecisionForDay.day,
              eventId: lastDecisionForDay.eventId,
              eventTitle: lastDecisionForDay.eventTitle,
              neighborhoodId: lastDecisionForDay.neighborhoodId,
              neighborhoodName: lastDecisionForDay.neighborhoodName,
              decisionId: lastDecisionForDay.decisionId,
              decisionTitle: lastDecisionForDay.decisionLabel,
              decisionTone: 'balanced',
              createdAt: Date.parse(lastDecisionForDay.createdAt) || Date.now(),
              summaryTitle: lastDecisionForDay.eventTitle,
              summaryText: lastDecisionForDay.decisionLabel,
              resultTone: 'mixed',
              metricChanges: [],
              subsystemOutcomes: [],
              highlightLines: [],
              riskLines: [],
            },
            operationSignals,
            resourceFatigue: operationalResources,
            carryOverSummary: reportCarryOverMemory?.summary,
            dailyReport: report,
          })
        : undefined,
      tomorrowRisk: tomorrowRiskPresentation.report ?? undefined,
      contentPackMeta: reportPackWiringContext.contentPackMeta,
      operationSignals,
      resourceFatigue: operationalResources,
      socialPulse: {
        globalPulseScore: socialPulseState.globalPulseScore,
      },
      focusDistrictId: lastDecisionForDay?.neighborhoodId,
      existingLines,
      cityArchive,
    });

    return buildCityJournalReportLine(model, existingLines);
  }, [
    cityArchive,
    cityEchoReportLine,
    decisionImpactReportEcho,
    eventDomainFocus?.reportEchoLine,
    lastDecisionForDay,
    operationSignals,
    operationalResources,
    postPilotOperation?.phase,
    report,
    reportCarryOverMemory,
    reportPackWiringContext.contentPackMeta,
    reportPackWiringContext.event,
    socialEchoForReport?.mention,
    socialPulseState.globalPulseScore,
    tomorrowRiskPresentation.report,
  ]);

  const rewardComebackReportLine = useMemo(() => {
    const existingLines = [
      cityEchoReportLine ?? '',
      decisionImpactReportEcho ?? '',
      cityJournalReportLine ?? '',
      tomorrowRiskPresentation.report?.mainLine ?? '',
    ].filter(Boolean);

    const presentation = buildRewardComebackReportPresentation({
      day: report.day,
      surface: 'report',
      isPostPilot: report.day >= POST_PILOT_FIRST_OPERATION_DAY,
      decisionImpact: lastDecisionForDay
        ? buildDecisionImpactExplanation({
            day: report.day,
            event: reportPackWiringContext.event,
            snapshot: {
              id: `report-reward-${lastDecisionForDay.id}`,
              day: lastDecisionForDay.day,
              eventId: lastDecisionForDay.eventId,
              eventTitle: lastDecisionForDay.eventTitle,
              neighborhoodId: lastDecisionForDay.neighborhoodId,
              neighborhoodName: lastDecisionForDay.neighborhoodName,
              decisionId: lastDecisionForDay.decisionId,
              decisionTitle: lastDecisionForDay.decisionLabel,
              decisionTone: 'balanced',
              createdAt: Date.parse(lastDecisionForDay.createdAt) || Date.now(),
              summaryTitle: lastDecisionForDay.eventTitle,
              summaryText: lastDecisionForDay.decisionLabel,
              resultTone: 'positive',
              metricChanges: [],
              subsystemOutcomes: [],
              highlightLines: [],
              riskLines: [],
            },
            operationSignals,
            resourceFatigue: operationalResources,
            carryOverSummary: reportCarryOverMemory?.summary,
            dailyReport: report,
          })
        : null,
      tomorrowRisk: tomorrowRiskPresentation.report ?? undefined,
      carryOverMemory: reportCarryOverMemory ?? undefined,
      contentPackMeta: reportPackWiringContext.contentPackMeta,
      cityJournalEntry: cityJournalReportLine
        ? {
            id: 'journal-echo',
            day: report.day,
            title: 'Günlük',
            line: cityJournalReportLine,
            kind: 'recovery_momentum',
            tone: 'recovery',
            priority: 'medium',
            sourceKind: 'daily_report',
            createdFromDay: report.day,
            maxVisibleLines: 1,
          }
        : undefined,
      operationSignals,
      existingLines,
    });
    return presentation.reportLine;
  }, [
    cityEchoReportLine,
    cityJournalReportLine,
    decisionImpactReportEcho,
    lastDecisionForDay,
    operationSignals,
    operationalResources,
    report,
    reportCarryOverMemory,
    reportPackWiringContext.contentPackMeta,
    reportPackWiringContext.event,
    tomorrowRiskPresentation.report,
  ]);

  const resourcePresenceReportLine = useMemo(() => {
    const existingLines = [
      cityEchoReportLine ?? '',
      decisionImpactReportEcho ?? '',
      cityJournalReportLine ?? '',
      rewardComebackReportLine ?? '',
      tomorrowRiskPresentation.report?.mainLine ?? '',
    ].filter(Boolean);

    const presenceInput = buildOperationalResourcePresenceLiteInputFromEngine({
      day: report.day,
      isPostPilot: report.day >= POST_PILOT_FIRST_OPERATION_DAY,
      operationalResources,
      operationSignals,
      decisionImpact: lastDecisionForDay
        ? buildDecisionImpactExplanation({
            day: report.day,
            event: reportPackWiringContext.event,
            snapshot: {
              id: `report-presence-${lastDecisionForDay.id}`,
              day: lastDecisionForDay.day,
              eventId: lastDecisionForDay.eventId,
              eventTitle: lastDecisionForDay.eventTitle,
              neighborhoodId: lastDecisionForDay.neighborhoodId,
              neighborhoodName: lastDecisionForDay.neighborhoodName,
              decisionId: lastDecisionForDay.decisionId,
              decisionTitle: lastDecisionForDay.decisionLabel,
              decisionTone: 'balanced',
              createdAt: Date.parse(lastDecisionForDay.createdAt) || Date.now(),
              summaryTitle: lastDecisionForDay.eventTitle,
              summaryText: lastDecisionForDay.decisionLabel,
              resultTone: 'mixed',
              metricChanges: [],
              subsystemOutcomes: [],
              highlightLines: [],
              riskLines: [],
            },
            operationSignals,
            resourceFatigue: operationalResources,
            dailyReport: report,
          })
        : undefined,
      tomorrowRisk: tomorrowRiskPresentation.report ?? undefined,
      contentPackMeta: reportPackWiringContext.contentPackMeta,
      existingLines,
    });
    const presenceModel = buildOperationalResourcePresenceLiteModel(presenceInput);
    return buildOperationalResourcePresenceReportLine(presenceModel, existingLines);
  }, [
    cityEchoReportLine,
    cityJournalReportLine,
    decisionImpactReportEcho,
    lastDecisionForDay,
    operationSignals,
    operationalResources,
    report,
    reportPackWiringContext.contentPackMeta,
    reportPackWiringContext.event,
    tomorrowRiskPresentation.report,
  ]);

  const districtReportCardLine = useMemo(() => {
    const districtId =
      operationSignals.priorityDistrictId ?? lastDecisionForDay?.neighborhoodId;
    if (!districtId) return null;

    const existingLines = [
      cityEchoReportLine ?? '',
      decisionImpactReportEcho ?? '',
      cityJournalReportLine ?? '',
      resourcePresenceReportLine ?? '',
      tomorrowRiskPresentation.report?.mainLine ?? '',
    ].filter(Boolean);

    const cardModel = buildDistrictReportCardFullModel({
      districtId,
      day: report.day,
      isPostPilot: report.day >= POST_PILOT_FIRST_OPERATION_DAY,
      postPilotPhase: postPilotOperation?.phase ?? null,
      operationSignals,
      resourceFatigue: operationalResources,
      contentPackMeta: reportPackWiringContext.contentPackMeta,
      cityArchive,
      rewardComebackLine: rewardComebackReportLine ?? undefined,
      existingLines,
    });

    return buildDistrictReportCardLineForReport(cardModel, existingLines);
  }, [
    cityArchive,
    cityEchoReportLine,
    cityJournalReportLine,
    decisionImpactReportEcho,
    lastDecisionForDay?.neighborhoodId,
    operationSignals,
    operationalResources,
    postPilotOperation?.phase,
    rewardComebackReportLine,
    report.day,
    reportPackWiringContext.contentPackMeta,
    resourcePresenceReportLine,
    tomorrowRiskPresentation.report?.mainLine,
  ]);

  const storyChainReportLine = useMemo(() => {
    const existingLines = [
      cityEchoReportLine ?? '',
      cityJournalReportLine ?? '',
      districtReportCardLine ?? '',
      rewardComebackReportLine ?? '',
      tomorrowRiskPresentation.report?.mainLine ?? '',
    ].filter(Boolean);
    return buildPersistentStoryChainReportLine(cityArchive, report.day, existingLines);
  }, [
    cityArchive,
    cityEchoReportLine,
    cityJournalReportLine,
    districtReportCardLine,
    report.day,
    rewardComebackReportLine,
    tomorrowRiskPresentation.report?.mainLine,
  ]);

  const vehicleMaintenanceReportLine = useMemo(() => {
    const existingLines = [
      cityEchoReportLine ?? '',
      cityJournalReportLine ?? '',
      districtReportCardLine ?? '',
      rewardComebackReportLine ?? '',
      storyChainReportLine ?? '',
      tomorrowRiskPresentation.report?.mainLine ?? '',
    ].filter(Boolean);
    return selectVehicleMaintenanceSurfaceLines(vehicleMaintenance, {
      day: report.day,
      existingReportLines: existingLines,
    }).reportLine;
  }, [
    cityEchoReportLine,
    cityJournalReportLine,
    districtReportCardLine,
    report.day,
    rewardComebackReportLine,
    storyChainReportLine,
    tomorrowRiskPresentation.report?.mainLine,
    vehicleMaintenance,
  ]);

  const teamSpecializationSurfaces = useMemo(() => {
    const existingLines = [
      cityEchoReportLine ?? '',
      cityJournalReportLine ?? '',
      districtReportCardLine ?? '',
      rewardComebackReportLine ?? '',
      storyChainReportLine ?? '',
      tomorrowRiskPresentation.report?.mainLine ?? '',
      vehicleMaintenanceReportLine ?? '',
    ].filter(Boolean);
    return selectTeamSpecializationSurfaceLines(teamSpecialization, {
      day: report.day,
      existingReportLines: existingLines,
      vehicleMaintenanceLine: vehicleMaintenanceReportLine ?? undefined,
      vehicleMaintenanceStrainActive: Boolean(
        vehicleMaintenanceReportLine &&
          (vehicleMaintenanceReportLine.toLocaleLowerCase('tr-TR').includes('yorgunluk') ||
            vehicleMaintenanceReportLine.toLocaleLowerCase('tr-TR').includes('bakım')),
      ),
    });
  }, [
    cityEchoReportLine,
    cityJournalReportLine,
    districtReportCardLine,
    report.day,
    rewardComebackReportLine,
    storyChainReportLine,
    teamSpecialization,
    tomorrowRiskPresentation.report?.mainLine,
    vehicleMaintenanceReportLine,
  ]);

  const { vehicleMaintenanceReportLine: resolvedVehicleMaintenanceReportLine, teamSpecializationReportLine } =
    useMemo(
      () =>
        resolveTeamVehicleStrainReportPresentation({
          vehicleMaintenanceReportLine,
          teamSurfaces: teamSpecializationSurfaces,
        }),
      [teamSpecializationSurfaces, vehicleMaintenanceReportLine],
    );

  const reportArchiveContinuity = useMemo(() => {
    const existingLines = [
      cityEchoReportLine ?? '',
      decisionImpactReportEcho ?? '',
      tomorrowRiskPresentation.report?.mainLine ?? '',
      resourcePresenceReportLine ?? '',
    ].filter(Boolean);
    return buildReportArchiveContinuityFromCandidates({
      day: report.day,
      cityArchive,
      storyChainLine: storyChainReportLine,
      rewardComebackLine: rewardComebackReportLine,
      districtReportLine: districtReportCardLine,
      cityJournalLine: cityJournalReportLine,
      existingLines,
    });
  }, [
    cityArchive,
    cityEchoReportLine,
    cityJournalReportLine,
    decisionImpactReportEcho,
    districtReportCardLine,
    report.day,
    resourcePresenceReportLine,
    rewardComebackReportLine,
    storyChainReportLine,
    tomorrowRiskPresentation.report?.mainLine,
  ]);

  const reportSystemsIntegration = useMemo(() => {
    const existingEchoLines: string[] = [
      ...(model.tomorrowNotes ?? []),
      ...(report.summaryLines ?? []),
      ...(report.carryOverSummaryLines ?? []),
      reportCarryOverMemory?.summary ?? '',
      cityEchoReportLine ?? '',
      decisionImpactReportEcho ?? '',
      cityJournalReportLine ?? '',
      resourcePresenceReportLine ?? '',
      socialEchoForReport?.mention ?? '',
      eventDomainFocus?.reportEchoLine ?? '',
      districtOperationActionReportLine ?? '',
      tomorrowPreviewBundle.summary.preview?.summary ?? '',
      tomorrowRiskPresentation.report?.mainLine ?? '',
      tomorrowRiskPresentation.report?.supportLine ?? '',
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
    cityEchoReportLine,
    cityJournalReportLine,
    resourcePresenceReportLine,
    districtOperationActionReportLine,
    decisionImpactReportEcho,
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
    tomorrowRiskPresentation.report?.mainLine,
    tomorrowRiskPresentation.report?.supportLine,
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
    startScreenTiming('EndOfDayReportView', { day: report.day, surface: 'report' });
    breadcrumbEndOfDayReportOpened({
      day: report.day,
      phase: getAnalyticsAccessModeFromGameState(gameState, monetization),
    });
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

      {cityEchoReportLine || decisionImpactReportEcho ? (
        <CreviaAnimatedLine
          surface="report"
          index={0}
          day={report.day}
          reducedMotion={reducedMotion}
          containerStyle={styles.decisionImpactReportRow}>
          <Text style={styles.decisionImpactReportLabel} numberOfLines={1}>
            Kararın etkisi
          </Text>
          <Text style={styles.decisionImpactReportText} numberOfLines={2}>
            {cityEchoReportLine ?? decisionImpactReportEcho}
          </Text>
        </CreviaAnimatedLine>
      ) : null}

      {reportArchiveContinuity.storyChainLine ? (
        <View style={styles.districtReportCardRow}>
          <Text style={styles.districtReportCardLabel} numberOfLines={1}>
            Operasyon zinciri
          </Text>
          <Text style={styles.districtReportCardText} numberOfLines={reportSecondaryMaxLines}>
            {reportArchiveContinuity.storyChainLine}
          </Text>
        </View>
      ) : null}

      {resolvedVehicleMaintenanceReportLine ? (
        <View style={styles.districtReportCardRow}>
          <Text style={styles.districtReportCardLabel} numberOfLines={1}>
            Araç bakım izi
          </Text>
          <Text style={styles.districtReportCardText} numberOfLines={reportSecondaryMaxLines}>
            {resolvedVehicleMaintenanceReportLine.replace(/^Araç bakım izi:\s*/i, '')}
          </Text>
        </View>
      ) : null}

      {teamSpecializationReportLine ? (
        <View style={styles.districtReportCardRow}>
          <Text style={styles.districtReportCardLabel} numberOfLines={1}>
            Ekip izi
          </Text>
          <Text style={styles.districtReportCardText} numberOfLines={reportSecondaryMaxLines}>
            {teamSpecializationReportLine.replace(/^Ekip (izi|yorgunluğu|gelişimi):\s*/i, '')}
          </Text>
        </View>
      ) : null}

      {reportArchiveContinuity.positiveLine ? (
        <CreviaAnimatedChip
          surface="report"
          index={2}
          reducedMotion={reducedMotion}
          style={styles.rewardComebackReportRow}
          tone="success">
          <Text style={styles.rewardComebackReportLabel} numberOfLines={1}>
            Olumlu iz
          </Text>
          <Text
            style={styles.rewardComebackReportText}
            numberOfLines={reportSecondaryMaxLines}
            ellipsizeMode="tail">
            {reportArchiveContinuity.positiveLine}
          </Text>
        </CreviaAnimatedChip>
      ) : null}

      {reportArchiveContinuity.districtLine ? (
        <View style={styles.districtReportCardRow}>
          <Text style={styles.districtReportCardLabel} numberOfLines={1}>
            Mahalle notu
          </Text>
          <Text style={styles.districtReportCardText} numberOfLines={reportSecondaryMaxLines}>
            {reportArchiveContinuity.districtLine}
          </Text>
        </View>
      ) : null}

      {reportArchiveContinuity.cityJournalLine ? (
        <CreviaAnimatedChip
          surface="report"
          index={1}
          reducedMotion={reducedMotion}
          style={styles.cityJournalReportRow}>
          <Text style={styles.cityJournalReportLabel} numberOfLines={1}>
            Şehir günlüğü
          </Text>
          <Text style={styles.cityJournalReportText} numberOfLines={reportSecondaryMaxLines}>
            {reportArchiveContinuity.cityJournalLine}
          </Text>
        </CreviaAnimatedChip>
      ) : null}

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

      {resourcePresenceReportLine ? (
        <View style={styles.resourcePresenceReportRow}>
          <Text style={styles.resourcePresenceReportLabel} numberOfLines={1}>
            Saha kapasitesi
          </Text>
          <Text style={styles.resourcePresenceReportText} numberOfLines={reportSecondaryMaxLines}>
            {resourcePresenceReportLine}
          </Text>
        </View>
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

      {tomorrowRiskPresentation.report ? (
        <ReportTomorrowRiskCard
          model={tomorrowRiskPresentation.report}
          compact={tomorrowRiskPresentation.report.shouldShowAsCompact}
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
  decisionImpactReportRow: {
    gap: 4,
    minWidth: 0,
    paddingHorizontal: 4,
  },
  decisionImpactReportLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0E5F5B',
  },
  decisionImpactReportText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#3D4F4C',
    flexShrink: 1,
  },
  cityJournalReportRow: {
    gap: 4,
    minWidth: 0,
    paddingHorizontal: 4,
  },
  cityJournalReportLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#5C4A32',
  },
  cityJournalReportText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#5C4A32',
    flexShrink: 1,
  },
  rewardComebackReportRow: {
    gap: 4,
    minWidth: 0,
    paddingHorizontal: 4,
  },
  rewardComebackReportLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1F6B5E',
    flexShrink: 1,
  },
  rewardComebackReportText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#2A5C56',
    flexShrink: 1,
  },
  districtReportCardRow: {
    gap: 4,
    minWidth: 0,
    paddingHorizontal: 4,
  },
  districtReportCardLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#3D5A52',
  },
  districtReportCardText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#173D3A',
    flexShrink: 1,
  },
  resourcePresenceReportRow: {
    gap: 4,
    minWidth: 0,
    paddingHorizontal: 4,
  },
  resourcePresenceReportLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0E5F5B',
  },
  resourcePresenceReportText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#3D4F4C',
    flexShrink: 1,
  },
});
