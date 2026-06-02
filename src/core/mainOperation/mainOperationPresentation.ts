import type { DailyReport } from '@/core/models/DailyReport';
import type { GameState } from '@/core/models/GameState';
import type { MonetizationState } from '@/core/monetization/monetizationTypes';
import { getNeighborhoodDisplayName } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import type { MapDistrictId } from '@/features/map/data/mapDistrictConstants';

import { pickMainOperationAdvisorCopy } from './mainOperationAdvisorCopy';
import { MAIN_OPERATION_UI_COPY } from './mainOperationConstants';
import {
  buildMainOperationGoalAdvisorLine,
  buildMainOperationGoalInsights,
  buildReportMainOperationSeasonModel,
  pickTopSeasonInsightLine,
  sortInsightsForHub,
  type MainOperationGoalPresentationInput,
} from './mainOperationGoalPresentation';
import {
  buildMainOperationDailyContext,
  deriveMainOperationAccessMode,
  ensureMainOperationSeasonForGameState,
} from './mainOperationEngine';
import {
  getActiveMainOperationDistrictIds,
  getMainOperationSeasonDay,
} from './mainOperationState';
import type {
  MainOperationAccessSummaryModel,
  MainOperationDistrictScopeModel,
  MainOperationHubModel,
  MainOperationMapScopeBadge,
  MainOperationReportSummary,
  MainOperationSeasonCardModel,
} from './mainOperationTypes';
import type { MainOperationEngineInput } from './mainOperationTypes';

export type MainOperationPresentationExtras = Omit<
  MainOperationGoalPresentationInput,
  'gameState' | 'monetization' | 'mainOperationSeason'
>;

export function getMainOperationDistrictStatusLabel(
  status: string,
  accessMode: 'none' | 'limited' | 'full',
): string {
  if (accessMode === 'limited') {
    return 'Sınırlı gündem';
  }
  switch (status) {
    case 'active':
      return 'Aktif';
    case 'agenda':
      return 'Gündemde';
    case 'preview':
      return 'Önizleme';
    case 'inactive':
      return 'Hazırlık';
    default:
      return '';
  }
}

function buildEngineInput(
  gameState: GameState,
  monetization: MonetizationState,
  mainOperationSeason: MainOperationEngineInput['mainOperationSeason'],
  operationSignals?: MainOperationEngineInput['operationSignals'],
  assignments?: MainOperationEngineInput['assignments'],
): MainOperationEngineInput {
  return {
    gameState,
    monetization,
    mainOperationSeason,
    operationSignals,
    assignments,
  };
}

export function shouldShowMainOperationHubCard(
  gameState: GameState,
  monetization: MonetizationState,
): boolean {
  if (gameState.pilot.status !== 'completed') return false;
  if (gameState.city.day < POST_PILOT_FIRST_OPERATION_DAY) return false;
  const mode = deriveMainOperationAccessMode(gameState, monetization);
  return mode === 'full' || mode === 'limited';
}

export function buildMainOperationHubModel(
  gameState: GameState,
  monetization: MonetizationState,
  mainOperationSeason: MainOperationEngineInput['mainOperationSeason'],
  options?: { compact?: boolean; extras?: MainOperationPresentationExtras },
): MainOperationHubModel {
  const input: MainOperationGoalPresentationInput = {
    gameState,
    monetization,
    mainOperationSeason,
    ...options?.extras,
  };
  const season = ensureMainOperationSeasonForGameState(input);
  const accessMode = season.accessMode;
  const visible = shouldShowMainOperationHubCard(gameState, monetization);

  if (!visible) {
    return {
      title: MAIN_OPERATION_UI_COPY.hubTitle,
      subtitle: MAIN_OPERATION_UI_COPY.seasonSubtitle,
      accessLabel: '',
      seasonProgressLabel: '',
      topInsightLine: '',
      activeDistrictLine: '',
      goalRows: [],
      footerNote: '',
      ctaLabel: '',
      showGoalsDetailCta: false,
      isFullAccess: false,
      compact: options?.compact ?? false,
      visible: false,
    };
  }

  const isFull = accessMode === 'full' && season.status === 'active';
  const activeIds = getActiveMainOperationDistrictIds(season);
  const activeNames = activeIds
    .slice(0, 3)
    .map((id) => getNeighborhoodDisplayName(id))
    .join(', ');

  const insights = isFull ? buildMainOperationGoalInsights(input) : [];
  const sortedInsights = sortInsightsForHub(insights);
  const goalRows = sortedInsights.slice(0, 3).map((i) => ({
    id: i.goalId,
    title: i.title,
    progressLabel: i.progressLabel,
    progressRatio: i.progressRatio,
    tone: i.tone,
    iconKey: i.iconKey,
    statusLabel: i.statusLabel,
  }));

  return {
    title: MAIN_OPERATION_UI_COPY.hubTitle,
    subtitle: MAIN_OPERATION_UI_COPY.seasonSubtitle,
    accessLabel: isFull
      ? MAIN_OPERATION_UI_COPY.accessFull
      : MAIN_OPERATION_UI_COPY.accessLimited,
    seasonProgressLabel: isFull
      ? `Operasyon günü ${season.currentSeasonDay}`
      : 'Sınırlı gündem aktif',
    topInsightLine: isFull
      ? pickTopSeasonInsightLine(sortedInsights)
      : MAIN_OPERATION_UI_COPY.accessLimited,
    activeDistrictLine: activeNames
      ? `${activeIds.length} mahalle aktif · ${activeNames}`
      : 'Mahalle kapsamı daraltılmış',
    goalRows,
    footerNote: isFull
      ? MAIN_OPERATION_UI_COPY.fullFooter
      : MAIN_OPERATION_UI_COPY.limitedFooter,
    ctaLabel: isFull
      ? MAIN_OPERATION_UI_COPY.hubCtaFull
      : MAIN_OPERATION_UI_COPY.hubCtaLimited,
    showGoalsDetailCta: isFull,
    isFullAccess: isFull,
    compact: options?.compact ?? false,
    visible: true,
  };
}

export function buildMainOperationSeasonCardModel(
  gameState: GameState,
  monetization: MonetizationState,
  mainOperationSeason: MainOperationEngineInput['mainOperationSeason'],
  options?: { compact?: boolean },
): MainOperationSeasonCardModel {
  return buildMainOperationHubModel(
    gameState,
    monetization,
    mainOperationSeason,
    options,
  );
}

export function buildMainOperationDistrictScopeModel(
  gameState: GameState,
  monetization: MonetizationState,
  mainOperationSeason: MainOperationEngineInput['mainOperationSeason'],
): MainOperationDistrictScopeModel {
  const season = ensureMainOperationSeasonForGameState(
    buildEngineInput(gameState, monetization, mainOperationSeason),
  );
  const rows = Object.values(season.districtScopes).map((scope) => ({
    districtId: scope.districtId,
    title: scope.title,
    statusLabel: getMainOperationDistrictStatusLabel(
      scope.status,
      season.accessMode,
    ),
    summary: scope.summary,
    pressureLabel: `Baskı ${scope.pressureScore}`,
    tone:
      scope.status === 'active'
        ? ('positive' as const)
        : scope.status === 'agenda'
          ? ('neutral' as const)
          : ('warning' as const),
  }));

  return {
    rows,
    footerNote:
      season.accessMode === 'full'
        ? MAIN_OPERATION_UI_COPY.scopeExpanded
        : MAIN_OPERATION_UI_COPY.limitedFooter,
  };
}

export function buildMainOperationReportModel(
  gameState: GameState,
  monetization: MonetizationState,
  mainOperationSeason: MainOperationEngineInput['mainOperationSeason'],
  _report?: DailyReport,
  extras?: MainOperationPresentationExtras,
): MainOperationReportSummary {
  const seasonModel = buildReportMainOperationSeasonModel(
    gameState,
    monetization,
    mainOperationSeason,
    extras,
  );

  if (!seasonModel.visible) {
    return {
      title: seasonModel.title,
      lines: [],
      footerNote: '',
      tone: 'neutral',
    };
  }

  const lines = [
    seasonModel.seasonDayLabel || seasonModel.topLine,
    ...seasonModel.lines,
  ]
    .filter(Boolean)
    .slice(0, 3);

  return {
    title: seasonModel.title,
    lines: lines.length > 0 ? lines : [seasonModel.topLine].filter(Boolean),
    footerNote: seasonModel.footerNote,
    tone: seasonModel.tone === 'critical' ? 'warning' : seasonModel.tone,
  };
}

export function buildMainOperationAccessSummaryModel(
  gameState: GameState,
  monetization: MonetizationState,
  mainOperationSeason: MainOperationEngineInput['mainOperationSeason'],
): MainOperationAccessSummaryModel {
  const season = ensureMainOperationSeasonForGameState(
    buildEngineInput(gameState, monetization, mainOperationSeason),
  );
  const isFull = season.accessMode === 'full';
  return {
    accessLabel: isFull
      ? MAIN_OPERATION_UI_COPY.accessFull
      : MAIN_OPERATION_UI_COPY.accessLimited,
    detailLine: isFull
      ? `Operasyon günü ${season.currentSeasonDay}`
      : MAIN_OPERATION_UI_COPY.limitedFooter,
    tone: isFull ? 'positive' : 'neutral',
  };
}

export function buildMainOperationMapScopeBadges(
  gameState: GameState,
  monetization: MonetizationState,
  mainOperationSeason: MainOperationEngineInput['mainOperationSeason'],
): MainOperationMapScopeBadge[] {
  const season = ensureMainOperationSeasonForGameState(
    buildEngineInput(gameState, monetization, mainOperationSeason),
  );
  if (gameState.city.day < POST_PILOT_FIRST_OPERATION_DAY) {
    return [];
  }
  if (season.accessMode === 'none') {
    return [];
  }

  if (season.accessMode === 'limited') {
    return Object.values(season.districtScopes).map((scope) => ({
      districtId: scope.districtId,
      label: 'Sınırlı gündem',
      tone: 'limited' as const,
    }));
  }

  return Object.values(season.districtScopes)
    .filter((s) => s.status !== 'inactive')
    .map((scope) => ({
      districtId: scope.districtId,
      label: getMainOperationDistrictStatusLabel(scope.status, 'full'),
      tone:
        scope.status === 'active'
          ? ('active' as const)
          : scope.status === 'agenda'
            ? ('agenda' as const)
            : ('preview' as const),
    }));
}

export function buildMainOperationAdvisorNote(
  gameState: GameState,
  monetization: MonetizationState,
  mainOperationSeason: MainOperationEngineInput['mainOperationSeason'],
  extras?: MainOperationPresentationExtras,
  advisorState?: import('@/core/advisors/advisorTypes').AdvisorState,
): string | null {
  if (advisorState) {
    const goalLine = buildMainOperationGoalAdvisorLine(gameState, advisorState, {
      gameState,
      monetization,
      mainOperationSeason,
      ...extras,
    });
    if (goalLine) {
      return goalLine;
    }
  }
  if (gameState.city.day < POST_PILOT_FIRST_OPERATION_DAY) {
    return null;
  }
  const input = buildEngineInput(
    gameState,
    monetization,
    mainOperationSeason,
  );
  const ctx = buildMainOperationDailyContext(input);
  const season = ensureMainOperationSeasonForGameState(input);

  const laggingGoal = season.goals.find((g) => g.progress < 45);
  const copy = pickMainOperationAdvisorCopy({
    level: 2,
    accessMode: ctx.accessMode === 'full' ? 'full' : 'limited',
    focusDomain: laggingGoal?.domain,
    day: gameState.city.day,
  });
  if (copy) {
    return copy;
  }

  if (ctx.accessMode === 'limited') {
    return 'Sınırlı gündemde kapsam dar, ama operasyon sinyalleri takip ediliyor.';
  }

  return 'Ana Operasyon aktif. Milestone hedefleri ve mahalle kapsamı izleniyor.';
}

export function getMainOperationPreviewSubtitle(
  gameState: GameState,
  monetization: MonetizationState,
  mainOperationSeason: MainOperationEngineInput['mainOperationSeason'],
): string {
  const access = deriveMainOperationAccessMode(gameState, monetization);
  if (access === 'full') {
    return MAIN_OPERATION_UI_COPY.previewGoalsLine;
  }
  return 'Pilot sonrası şehir kapsamı burada genişler.';
}

export function isMainOperationPreviewActiveState(
  gameState: GameState,
  monetization: MonetizationState,
): boolean {
  return deriveMainOperationAccessMode(gameState, monetization) === 'full';
}

export function collectMainOperationUiStrings(
  gameState: GameState,
  monetization: MonetizationState,
  mainOperationSeason: MainOperationEngineInput['mainOperationSeason'],
): string[] {
  const hub = buildMainOperationHubModel(gameState, monetization, mainOperationSeason);
  const report = buildMainOperationReportModel(
    gameState,
    monetization,
    mainOperationSeason,
  );
  return [
    hub.title,
    hub.subtitle,
    hub.accessLabel,
    hub.footerNote,
    report.title,
    ...report.lines,
    report.footerNote,
  ];
}
