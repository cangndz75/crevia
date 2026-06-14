import { buildAuthorityGameplayExpansionSummary } from '@/core/authorityGameplayExpansion';
import { buildCityMemoryVisibility } from '@/core/cityMemoryVisibility';
import type { CityMemoryVisibilityResult } from '@/core/cityMemoryVisibility';
import {
  buildDecisionConsequenceThreadsFromHub,
  buildDecisionConsequenceThreadsFromReport,
} from '@/core/decisionConsequence';
import {
  buildDailyCapacityPortfolio,
  type DailyCapacityPortfolioInput,
  type DailyCapacityPortfolioResult,
} from '@/core/dailyCapacityPortfolio';
import { buildDistrictPersonalityProfile } from '@/core/districtPersonality';
import { buildDistrictNeglectRecovery, collectDistrictNeglectRecoveryLines } from '@/core/districtNeglectRecovery';
import type { DistrictNeglectRecoveryResult } from '@/core/districtNeglectRecovery';
import { buildDay8StrategicContent, collectDay8StrategicContentLines } from '@/core/day8StrategicContent';
import type { Day8StrategicContentResult } from '@/core/day8StrategicContent';
import { buildCityRhythmDirector, collectCityRhythmDirectorLines } from '@/core/cityRhythmDirector';
import type { CityRhythmDirectorResult } from '@/core/cityRhythmDirector';
import type { EceStrategyLineResult } from '@/core/eceStrategyLines';
import { buildEceStrategyLineResult } from '@/core/eceStrategyLines';
import { buildFollowUpActions } from '@/core/followUpActions';
import type { FollowUpActionResult } from '@/core/followUpActions';
import type { CityJournalHubPresentation } from '@/core/cityJournal';
import type { GameState } from '@/core/models/GameState';
import type { DailyReport } from '@/core/models/DailyReport';
import { buildOneMoreDayRetention } from '@/core/oneMoreDayRetention';
import type { OneMoreDayRetentionResult } from '@/core/oneMoreDayRetention';
import { buildPositiveComeback, collectPositiveComebackLines } from '@/core/positiveComeback';
import type { PositiveComebackResult } from '@/core/positiveComeback';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import { buildPortfolioDeferRiskBindings } from '@/core/portfolioDeferRisk';
import type { PortfolioDeferRiskResult } from '@/core/portfolioDeferRisk';
import type { SocialPulseState } from '@/core/social/socialTypes';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskTypes';

export type MemoryFollowUpPresentationSnapshot = {
  day: number;
  gameState: GameState;
  operationSignals?: OperationSignalsState | null;
  socialPulseState?: SocialPulseState | null;
  hubTomorrowRisk?: TomorrowRiskModel | null;
  hubImpactExplanationLine?: string | null;
  hubCityJournal?: CityJournalHubPresentation | null;
  hubDistrictReportLine?: string | null;
  hubStoryChainLine?: string | null;
  hubVehicleMaintenanceLine?: string | null;
  hubTeamSpecializationLine?: string | null;
  report?: DailyReport | null;
  authorityPermissionIds?: string[];
  recentTraceIds?: string[];
  recentTraceTexts?: string[];
  recentActionIds?: string[];
  dailyCapacityPortfolioResult?: DailyCapacityPortfolioResult | null;
};

export type MemoryFollowUpPresentationContext = {
  day: number;
  dailyCapacityPortfolio: DailyCapacityPortfolioResult;
  portfolioDeferRisk: PortfolioDeferRiskResult;
  oneMoreDayRetention: OneMoreDayRetentionResult;
  cityMemoryVisibility: CityMemoryVisibilityResult;
  followUpActions: FollowUpActionResult;
  positiveComeback: PositiveComebackResult;
  districtNeglectRecovery: DistrictNeglectRecoveryResult;
  day8StrategicContent: Day8StrategicContentResult;
  cityRhythmDirector: CityRhythmDirectorResult;
  eceStrategyLines: EceStrategyLineResult;
  suppressSourceIds: string[];
  dedupeLines: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function makeSignal(id: string, title: string, summary: string, score = 55) {
  return { id, title, summary, score, sourceIds: [id] };
}

function buildSocialPulseSignal(socialPulseState?: SocialPulseState | null) {
  if (!socialPulseState) return undefined;
  const score =
    typeof socialPulseState.globalPulseScore === 'number'
      ? socialPulseState.globalPulseScore
      : 56;
  const title = 'Sosyal nabız';
  const summary = 'Şehir tepkisi izleniyor.';
  return makeSignal('hub_social_pulse', title, summary, score);
}

function buildPortfolioInput(snapshot: MemoryFollowUpPresentationSnapshot): DailyCapacityPortfolioInput {
  const rawState = snapshot.gameState as unknown as Record<string, unknown>;
  const pilot = isRecord(rawState.pilot) ? rawState.pilot : undefined;
  const events = asArray(rawState.events);
  const activeEvents = events.filter((event) => {
    if (!isRecord(event)) return true;
    const status = asString(event.status);
    return status !== 'resolved' && status !== 'completed' && status !== 'expired';
  });

  return {
    day: snapshot.day,
    activeEvents,
    postPilotState: pilot?.postPilotOperation,
    operationSignals: snapshot.operationSignals ?? undefined,
    tomorrowRiskSignals: snapshot.hubTomorrowRisk ?? undefined,
    vehicleMaintenanceSignals: snapshot.hubVehicleMaintenanceLine
      ? makeSignal('hub_vehicle_maintenance', 'Bakım uyarısı', snapshot.hubVehicleMaintenanceLine, 62)
      : undefined,
    teamSpecializationSignals: snapshot.hubTeamSpecializationLine
      ? makeSignal('hub_team_specialization', 'Ekip odağı', snapshot.hubTeamSpecializationLine, 54)
      : undefined,
    socialPulseSignals: buildSocialPulseSignal(snapshot.socialPulseState),
    authorityPermissionIds: snapshot.authorityPermissionIds,
  };
}

function buildHubThreads(snapshot: MemoryFollowUpPresentationSnapshot) {
  return buildDecisionConsequenceThreadsFromHub({
    day: snapshot.day,
    impactLine: snapshot.hubImpactExplanationLine,
    tomorrowRisk: snapshot.hubTomorrowRisk,
    districtLine: snapshot.hubDistrictReportLine,
    storyLine: snapshot.hubStoryChainLine,
    cityJournalLine:
      snapshot.hubCityJournal?.primaryLine ?? snapshot.hubCityJournal?.secondaryLine ?? null,
  });
}

function buildReportThreads(snapshot: MemoryFollowUpPresentationSnapshot) {
  if (!snapshot.report) return [];
  return buildDecisionConsequenceThreadsFromReport(snapshot.report);
}

function buildCarryOverSignals(snapshot: MemoryFollowUpPresentationSnapshot, threads: unknown[]) {
  const signals: unknown[] = [];
  if (snapshot.hubImpactExplanationLine?.trim()) {
    signals.push({
      id: 'hub-carry-over',
      title: 'Devam eden etki',
      text: snapshot.hubImpactExplanationLine,
      sourceIds: ['hub-impact'],
    });
  }
  for (const line of snapshot.report?.carryOverSummaryLines ?? []) {
    if (!line?.trim()) continue;
    signals.push({
      id: `report-carry-${signals.length}`,
      title: 'Gün sonu taşınan etki',
      text: line,
      sourceIds: [`report-carry-${signals.length}`],
    });
  }
  for (const thread of threads) {
    if (!isRecord(thread)) continue;
    if (asString(thread.consequenceType) === 'carry_over' || asString(thread.type) === 'carry_over') {
      signals.push({
        id: asString(thread.id) ?? 'thread-carry',
        title: asString(thread.title) ?? 'Karar izi',
        text: asString(thread.causalLine) ?? asString(thread.summary) ?? asString(thread.line),
        sourceIds: asArray(thread.sourceIds).length > 0 ? thread.sourceIds : [asString(thread.id) ?? 'thread-carry'],
      });
    }
  }
  return signals;
}

function buildButterflySignals(snapshot: MemoryFollowUpPresentationSnapshot) {
  const pilot = snapshot.gameState.pilot;
  const hooks = pilot.butterflyHookState?.hooks ?? [];
  return hooks
    .filter((hook) => hook.status !== 'expired')
    .map((hook) => ({
      id: hook.id,
      title: hook.title,
      description: hook.description,
      reportLine: hook.reportLine,
      resultHint: hook.resultHint,
      sourceIds: [hook.id],
    }));
}

function buildDistrictMemorySignals(snapshot: MemoryFollowUpPresentationSnapshot) {
  if (!snapshot.hubDistrictReportLine?.trim()) return undefined;
  return [
    {
      id: 'hub-district-memory',
      title: 'Mahalle hafızası',
      advisorLine: snapshot.hubDistrictReportLine,
      reportLine: snapshot.hubDistrictReportLine,
      sourceIds: ['hub-district-report'],
    },
  ];
}

function buildStoryChainSignals(snapshot: MemoryFollowUpPresentationSnapshot) {
  if (!snapshot.hubStoryChainLine?.trim()) return undefined;
  return [
    {
      chainId: 'hub-story-chain',
      playerVisibleTitle: 'Hikaye zinciri',
      reportLine: snapshot.hubStoryChainLine,
      hubLine: snapshot.hubStoryChainLine,
      sourceIds: ['hub-story-chain'],
    },
  ];
}

function buildCityArchiveSignals(snapshot: MemoryFollowUpPresentationSnapshot) {
  const lines = [
    snapshot.hubCityJournal?.primaryLine,
    snapshot.hubCityJournal?.secondaryLine,
  ].filter((line): line is string => Boolean(line?.trim()));
  if (lines.length === 0) return undefined;
  return lines.map((line, index) => ({
    id: `hub-city-archive-${index}`,
    title: 'Şehir arşivi',
    shortLine: line,
    reportLine: line,
    isPlayerVisible: true,
    sourceIds: [`hub-city-archive-${index}`],
  }));
}

function buildDistrictPersonalityProfilesForNeglect(
  snapshot: MemoryFollowUpPresentationSnapshot,
): unknown[] | undefined {
  const priorityDistrictId = snapshot.operationSignals?.priorityDistrictId;
  if (!priorityDistrictId || typeof priorityDistrictId !== 'string') return undefined;
  return [
    buildDistrictPersonalityProfile({
      day: snapshot.day,
      districtId: priorityDistrictId,
      districtMemorySignals: buildDistrictMemorySignals(snapshot),
      socialSignals: buildSocialPulseSignal(snapshot.socialPulseState),
    }),
  ];
}

function collectDistrictNeglectSuppressLines(context: {
  oneMoreDayRetention: OneMoreDayRetentionResult;
  positiveComeback: PositiveComebackResult;
}): string[] {
  const lines: string[] = [];
  const retention = context.oneMoreDayRetention;
  if (retention.primaryHook?.line) lines.push(retention.primaryHook.line);
  if (retention.primaryHook?.tomorrowLine) lines.push(retention.primaryHook.tomorrowLine);
  if (retention.summaryLine) lines.push(retention.summaryLine);
  lines.push(...collectPositiveComebackLines(context.positiveComeback));
  return lines.filter(Boolean);
}

function collectDistrictNeglectSuppressSourceIds(context: {
  oneMoreDayRetention: OneMoreDayRetentionResult;
  positiveComeback: PositiveComebackResult;
}): string[] {
  const ids = new Set<string>();
  for (const id of context.oneMoreDayRetention.sourceIds ?? []) ids.add(id);
  for (const id of context.oneMoreDayRetention.primaryHook?.sourceIds ?? []) ids.add(id);
  for (const id of context.positiveComeback.sourceIds ?? []) ids.add(id);
  for (const candidate of context.positiveComeback.candidates ?? []) {
    for (const id of candidate.sourceIds ?? []) ids.add(id);
  }
  return [...ids];
}

function collectDay8StrategicSuppressLines(context: {
  oneMoreDayRetention: OneMoreDayRetentionResult;
  positiveComeback: PositiveComebackResult;
  districtNeglectRecovery: DistrictNeglectRecoveryResult;
}): string[] {
  return [
    ...collectDistrictNeglectSuppressLines({
      oneMoreDayRetention: context.oneMoreDayRetention,
      positiveComeback: context.positiveComeback,
    }),
    ...collectDistrictNeglectRecoveryLines(context.districtNeglectRecovery),
    ...collectPositiveComebackLines(context.positiveComeback),
  ].filter(Boolean);
}

function collectDay8StrategicSuppressSourceIds(context: {
  oneMoreDayRetention: OneMoreDayRetentionResult;
  positiveComeback: PositiveComebackResult;
  districtNeglectRecovery: DistrictNeglectRecoveryResult;
}): string[] {
  return [
    ...collectDistrictNeglectSuppressSourceIds({
      oneMoreDayRetention: context.oneMoreDayRetention,
      positiveComeback: context.positiveComeback,
    }),
    ...context.districtNeglectRecovery.sourceIds,
  ];
}

function collectCityRhythmSuppressLines(context: {
  oneMoreDayRetention: OneMoreDayRetentionResult;
  positiveComeback: PositiveComebackResult;
  districtNeglectRecovery: DistrictNeglectRecoveryResult;
  day8StrategicContent: Day8StrategicContentResult;
}): string[] {
  return [
    ...collectDay8StrategicSuppressLines({
      oneMoreDayRetention: context.oneMoreDayRetention,
      positiveComeback: context.positiveComeback,
      districtNeglectRecovery: context.districtNeglectRecovery,
    }),
    ...collectDay8StrategicContentLines(context.day8StrategicContent),
  ].filter(Boolean);
}

function collectDedupeLines(context: {
  oneMoreDayRetention: OneMoreDayRetentionResult;
  eceStrategyLines: EceStrategyLineResult;
}): string[] {
  const lines: string[] = [];
  const retention = context.oneMoreDayRetention;
  if (retention.primaryHook?.line) lines.push(retention.primaryHook.line);
  if (retention.primaryHook?.tomorrowLine) lines.push(retention.primaryHook.tomorrowLine);
  if (retention.summaryLine) lines.push(retention.summaryLine);
  for (const key of ['primaryLine', 'secondaryLine', 'reportLine', 'continuationLine'] as const) {
    const line = context.eceStrategyLines[key];
    if (line?.text) lines.push(line.text);
  }
  return lines.filter(Boolean);
}

function collectSuppressSourceIds(context: {
  oneMoreDayRetention: OneMoreDayRetentionResult;
  eceStrategyLines: EceStrategyLineResult;
}): string[] {
  const ids = new Set<string>();
  for (const id of context.oneMoreDayRetention.sourceIds ?? []) ids.add(id);
  for (const id of context.oneMoreDayRetention.primaryHook?.sourceIds ?? []) ids.add(id);
  for (const key of ['primaryLine', 'secondaryLine', 'reportLine', 'continuationLine'] as const) {
    for (const id of context.eceStrategyLines[key]?.sourceIds ?? []) ids.add(id);
  }
  return [...ids];
}

export function buildMemoryFollowUpPresentationContext(
  snapshot: MemoryFollowUpPresentationSnapshot,
): MemoryFollowUpPresentationContext {
  const day = Math.max(1, snapshot.day);
  const hubThreads = buildHubThreads(snapshot);
  const reportThreads = buildReportThreads(snapshot);
  const decisionThreads = [...hubThreads, ...reportThreads];
  const carryOverSignals = buildCarryOverSignals(snapshot, decisionThreads);
  const butterflySignals = buildButterflySignals(snapshot);
  const districtMemorySignals = buildDistrictMemorySignals(snapshot);
  const storyChainSignals = buildStoryChainSignals(snapshot);
  const cityArchiveSignals = buildCityArchiveSignals(snapshot);

  const dailyCapacityPortfolio =
    snapshot.dailyCapacityPortfolioResult ?? buildDailyCapacityPortfolio(buildPortfolioInput(snapshot));

  const portfolioDeferRisk = buildPortfolioDeferRiskBindings({
    day,
    portfolioResult: dailyCapacityPortfolio,
    decisionConsequenceThreads: decisionThreads,
    tomorrowRiskSignals: snapshot.hubTomorrowRisk ?? undefined,
    carryOverSignals,
    cityArchiveSignals,
    storyChainSignals,
    authorityPermissionIds: snapshot.authorityPermissionIds,
  });

  const oneMoreDayRetention = buildOneMoreDayRetention({
    day,
    portfolioDeferRiskResult: portfolioDeferRisk,
    dailyCapacityPortfolioResult: dailyCapacityPortfolio,
    decisionConsequenceThreads: decisionThreads,
    tomorrowRiskSignals: snapshot.hubTomorrowRisk ?? undefined,
    carryOverSignals,
    butterflySignals,
    districtMemorySignals,
    cityArchiveSignals,
    storyChainSignals,
    reportSummary: snapshot.report
      ? {
          summaryLines: snapshot.report.summaryLines,
          highlights: snapshot.report.highlights,
          carryOverSummaryLines: snapshot.report.carryOverSummaryLines,
        }
      : undefined,
    currentRouteHints: {
      reportRoute: '/reports',
      hubRoute: '/',
      eventsRoute: '/events',
    },
  });

  const oneMoreDaySuppressIds = [
    ...(oneMoreDayRetention.sourceIds ?? []),
    ...(oneMoreDayRetention.primaryHook?.sourceIds ?? []),
  ];

  const cityMemoryVisibility = buildCityMemoryVisibility({
    day,
    decisionConsequenceThreads: decisionThreads,
    carryOverSignals,
    butterflySignals,
    cityArchiveEntries: cityArchiveSignals,
    districtMemorySignals,
    storyChains: storyChainSignals,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    recentTraceIds: snapshot.recentTraceIds,
    recentTraceTexts: snapshot.recentTraceTexts,
    suppressSourceIds: oneMoreDaySuppressIds,
  });

  const authorityExpansionSummary = buildAuthorityGameplayExpansionSummary({
    day,
    authorityState: snapshot.gameState.pilot.authorityState,
    permissionIds: snapshot.authorityPermissionIds,
    portfolioAvailable: dailyCapacityPortfolio.items.length > 0,
  });

  const followUpActions = buildFollowUpActions({
    day,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    dailyCapacityPortfolioResult: dailyCapacityPortfolio,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    decisionConsequenceThreads: decisionThreads,
    tomorrowRiskSignals: snapshot.hubTomorrowRisk ?? undefined,
    districtMemorySignals,
    cityArchiveSignals,
    storyChainSignals,
    carryOverSignals,
    butterflySignals,
    authorityExpansionSummary,
    recentActionIds: snapshot.recentActionIds,
  });

  const positiveComeback = buildPositiveComeback({
    day,
    rewardComebackSignals: undefined,
    dailyCapacityPortfolioResult: dailyCapacityPortfolio,
    followUpActionResult: followUpActions,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    portfolioDeferRiskResult: portfolioDeferRisk,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    decisionConsequenceThreads: decisionThreads,
    carryOverSignals,
    butterflySignals,
    districtMemorySignals,
    cityArchiveSignals,
    storyChainSignals,
    socialPulseSignals: buildSocialPulseSignal(snapshot.socialPulseState),
    authorityExpansionSummary,
    authorityPermissionIds: snapshot.authorityPermissionIds,
    recentCandidateIds: snapshot.recentTraceIds,
  });

  const districtNeglectRecovery = buildDistrictNeglectRecovery({
    day,
    dailyCapacityPortfolioResult: dailyCapacityPortfolio,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    followUpActionResult: followUpActions,
    positiveComebackResult: positiveComeback,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    decisionConsequenceThreads: decisionThreads,
    carryOverSignals,
    butterflySignals,
    districtMemorySignals,
    storyChainSignals,
    cityArchiveSignals,
    socialPulseSignals: buildSocialPulseSignal(snapshot.socialPulseState),
    authorityExpansionSummary,
    districtPersonalityProfiles: buildDistrictPersonalityProfilesForNeglect(snapshot),
    suppressLines: collectDistrictNeglectSuppressLines({ oneMoreDayRetention, positiveComeback }),
    suppressSourceIds: collectDistrictNeglectSuppressSourceIds({
      oneMoreDayRetention,
      positiveComeback,
    }),
    recentSignalIds: snapshot.recentTraceIds,
  });

  const day8StrategicContent = buildDay8StrategicContent({
    day,
    authorityPermissionIds: snapshot.authorityPermissionIds,
    dailyCapacityPortfolioResult: dailyCapacityPortfolio,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    followUpActionResult: followUpActions,
    positiveComebackResult: positiveComeback,
    districtNeglectRecoveryResult: districtNeglectRecovery,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    authorityExpansionSummary,
    decisionConsequenceThreads: decisionThreads,
    carryOverSignals,
    butterflySignals,
    districtMemorySignals,
    storyChainSignals,
    cityArchiveSignals,
    socialPulseSignals: buildSocialPulseSignal(snapshot.socialPulseState),
    suppressLines: collectDay8StrategicSuppressLines({
      oneMoreDayRetention,
      positiveComeback,
      districtNeglectRecovery,
    }),
    suppressSourceIds: collectDay8StrategicSuppressSourceIds({
      oneMoreDayRetention,
      positiveComeback,
      districtNeglectRecovery,
    }),
    recentCandidateIds: snapshot.recentTraceIds,
  });

  const cityRhythmDirector = buildCityRhythmDirector({
    day,
    day8StrategicContentResult: day8StrategicContent,
    districtNeglectRecoveryResult: districtNeglectRecovery,
    positiveComebackResult: positiveComeback,
    followUpActionResult: followUpActions,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    portfolioDeferRiskResult: portfolioDeferRisk,
    dailyCapacityPortfolioResult: dailyCapacityPortfolio,
    authorityExpansionSummary,
    decisionConsequenceThreads: decisionThreads,
    carryOverSignals,
    butterflySignals,
    suppressLines: collectCityRhythmSuppressLines({
      oneMoreDayRetention,
      positiveComeback,
      districtNeglectRecovery,
      day8StrategicContent,
    }),
    suppressSourceIds: [
      ...collectDay8StrategicSuppressSourceIds({
        oneMoreDayRetention,
        positiveComeback,
        districtNeglectRecovery,
      }),
      ...(oneMoreDayRetention.sourceIds ?? []),
    ],
  });

  const eceStrategyLines = buildEceStrategyLineResult({
    day,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    dailyCapacityPortfolioResult: dailyCapacityPortfolio,
    authorityExpansionSummary,
    decisionConsequenceThreads: decisionThreads,
    tomorrowRiskSignals: snapshot.hubTomorrowRisk ?? undefined,
    carryOverSignals,
    butterflySignals,
    districtMemorySignals,
    cityArchiveSignals,
    storyChainSignals,
    districtNeglectRecoveryResult: districtNeglectRecovery,
    day8StrategicContentResult: day8StrategicContent,
    cityRhythmDirectorResult: cityRhythmDirector,
    recentLineTexts: [
      ...(snapshot.recentTraceTexts ?? []),
      ...cityMemoryVisibility.traces.map((trace) => trace.line),
      ...collectDistrictNeglectRecoveryLines(districtNeglectRecovery),
      ...collectDay8StrategicContentLines(day8StrategicContent),
      ...collectCityRhythmDirectorLines(cityRhythmDirector),
    ],
  });

  const dedupeLines = collectDedupeLines({ oneMoreDayRetention, eceStrategyLines });

  return {
    day,
    dailyCapacityPortfolio,
    portfolioDeferRisk,
    oneMoreDayRetention,
    cityMemoryVisibility,
    followUpActions,
    positiveComeback,
    districtNeglectRecovery,
    day8StrategicContent,
    cityRhythmDirector,
    eceStrategyLines,
    suppressSourceIds: collectSuppressSourceIds({ oneMoreDayRetention, eceStrategyLines }),
    dedupeLines,
  };
}
