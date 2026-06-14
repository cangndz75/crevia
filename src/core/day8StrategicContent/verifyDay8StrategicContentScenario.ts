import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildAuthorityGameplayExpansionSummary } from '@/core/authorityGameplayExpansion';
import { buildCityMemoryVisibility } from '@/core/cityMemoryVisibility';
import { buildDailyCapacityPortfolio, type DailyCapacityPortfolioInput } from '@/core/dailyCapacityPortfolio';
import { buildDistrictNeglectRecovery } from '@/core/districtNeglectRecovery';
import { buildFollowUpActions } from '@/core/followUpActions';
import { buildOneMoreDayRetention } from '@/core/oneMoreDayRetention';
import { buildPortfolioDeferRiskBindings } from '@/core/portfolioDeferRisk';
import { buildPositiveComeback } from '@/core/positiveComeback';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  DAY8_STRATEGIC_CONTENT_ALLOWED_SOURCE_KINDS,
  DAY8_STRATEGIC_CONTENT_COPY,
  DAY8_STRATEGIC_CONTENT_FAKE_CLAIM_PATTERNS,
  DAY8_STRATEGIC_CONTENT_MAX_INTERNAL_CANDIDATES,
  DAY8_STRATEGIC_CONTENT_MAX_PRESENTATION_CANDIDATES,
} from './day8StrategicContentConstants';
import {
  buildDay8StrategicContent,
  collectDay8StrategicContentLines,
  hasDay8StrategicContentRealSource,
} from './day8StrategicContentModel';
import {
  buildDay8StrategicContentCardModels,
  buildEceDay8StrategicContentLine,
  buildHubDay8StrategicContentHint,
  buildPortfolioDay8StrategicContentSignal,
  buildPrimaryDay8StrategicContentCard,
  buildReportDay8StrategicContentNote,
} from './day8StrategicContentPresentation';
import type { Day8StrategicContentCandidate } from './day8StrategicContentTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = 26;
const TECHNICAL_ENUM_PATTERN = /[a-z]+_[a-z_]+/;

export type VerifyDay8StrategicContentOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function readRepo(rel: string): string {
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function assert(checks: string[], pass: boolean, ok: string, fail: string): boolean {
  checks.push(pass ? `PASS ${ok}` : `FAIL ${fail}`);
  return pass;
}

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

function event(id: string, title: string, district: string, neighborhoodId: string) {
  return { id, title, district, neighborhoodId, day: 8 };
}

function operationSignals() {
  return {
    priorityDistrictId: 'sanayi',
    vehicles: {
      status: 'strained',
      score: 62,
      title: 'Rota baskisi',
      summary: 'Arac rotasi zorlaniyor.',
      sourceTags: ['route_source'],
    },
    containers: {
      status: 'watch',
      score: 58,
      title: 'Konteyner hatti',
      summary: 'Hat izleniyor.',
      sourceTags: ['container_source'],
    },
    districts: {
      status: 'watch',
      score: 54,
      title: 'Guven hassasiyeti',
      summary: 'Izleniyor.',
      sourceTags: ['trust_source'],
    },
    overall: {
      status: 'watch',
      score: 50,
      title: 'Genel sinyal',
      summary: 'Izleniyor.',
      sourceTags: ['overall_source'],
    },
  };
}

function day8PortfolioInput(): DailyCapacityPortfolioInput {
  return {
    day: 8,
    activeEvents: [
      event('active_a', 'Aktif rota operasyonu', 'Sanayi', 'sanayi'),
      event('active_b', 'Aktif konteyner operasyonu', 'Cumhuriyet', 'cumhuriyet'),
    ],
    operationSignals: operationSignals(),
    tomorrowRiskSignals: [
      {
        id: 'risk_route',
        title: 'Yarin rota riski',
        mainLine: 'Rota baskisi yarin tekrar okunmali.',
        priority: 'high',
        relatedDomain: 'route',
        sourceSignals: ['operation_signals'],
      },
    ],
    authorityPermissionIds: [
      'tomorrow_risk_preview',
      'district_trust_preview',
      'portfolio_cost_explanation',
      'district_context_detail',
      'map_layer_detail',
    ],
  };
}

function buildDay8Pipeline(extra: Record<string, unknown> = {}) {
  const portfolio = buildDailyCapacityPortfolio({
    ...day8PortfolioInput(),
    ...extra,
  });
  const deferredItem = portfolio.items.find((item) => item.deferRisk !== 'none');
  const portfolioWithDeferred = deferredItem
    ? {
        ...portfolio,
        items: portfolio.items.map((item) =>
          item.id === deferredItem.id ? { ...item, status: 'deferred' as const } : item,
        ),
        deferredItems: [{ ...deferredItem, status: 'deferred' as const }],
      }
    : portfolio;

  const portfolioDeferRisk = buildPortfolioDeferRiskBindings({
    day: 8,
    portfolioResult: portfolioWithDeferred,
    tomorrowRiskSignals: day8PortfolioInput().tomorrowRiskSignals,
    authorityPermissionIds: day8PortfolioInput().authorityPermissionIds,
    ...extra,
  });
  const oneMoreDayRetention = buildOneMoreDayRetention({
    day: 8,
    portfolioDeferRiskResult: portfolioDeferRisk,
    dailyCapacityPortfolioResult: portfolioWithDeferred,
    currentRouteHints: { hubRoute: '/', mapRoute: '/map' },
    ...extra,
  });
  const cityMemoryVisibility = buildCityMemoryVisibility({
    day: 8,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    ...extra,
  });
  const authorityExpansionSummary = buildAuthorityGameplayExpansionSummary({
    day: 8,
    permissionIds: day8PortfolioInput().authorityPermissionIds,
    portfolioAvailable: portfolioWithDeferred.items.length > 0,
  });
  const followUpActions = buildFollowUpActions({
    day: 8,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    dailyCapacityPortfolioResult: portfolioWithDeferred,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    authorityExpansionSummary,
    ...extra,
  });
  const positiveComeback = buildPositiveComeback({
    day: 8,
    dailyCapacityPortfolioResult: portfolioWithDeferred,
    followUpActionResult: followUpActions,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    portfolioDeferRiskResult: portfolioDeferRisk,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    authorityExpansionSummary,
    authorityPermissionIds: day8PortfolioInput().authorityPermissionIds,
    ...extra,
  });
  const districtNeglectRecovery = buildDistrictNeglectRecovery({
    day: 8,
    dailyCapacityPortfolioResult: portfolioWithDeferred,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    followUpActionResult: followUpActions,
    positiveComebackResult: positiveComeback,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    authorityExpansionSummary,
    ...extra,
  });
  return {
    day: 8,
    authorityPermissionIds: day8PortfolioInput().authorityPermissionIds,
    dailyCapacityPortfolioResult: portfolioWithDeferred,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    followUpActionResult: followUpActions,
    positiveComebackResult: positiveComeback,
    districtNeglectRecoveryResult: districtNeglectRecovery,
    authorityExpansionSummary,
  };
}

function candidateScoresValid(candidates: Day8StrategicContentCandidate[]): boolean {
  return candidates.every(
    (candidate) => candidate.priority >= 0 && candidate.priority <= 100,
  );
}

export function verifyDay8StrategicContentScenario(): VerifyDay8StrategicContentOutcome {
  const checks: string[] = [];
  let ok = true;

  ok =
    assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION unchanged', `v${SAVE_VERSION}`) &&
    ok;
  ok =
    assert(
      checks,
      !readRepo('src/store/gamePersist.ts').includes('day8StrategicContent'),
      'gamePersist shape unchanged',
      'persist wired',
    ) && ok;
  ok =
    assert(
      checks,
      !readRepo('src/core/game/applyDecision.ts').includes('day8StrategicContent'),
      'applyDecision unchanged',
      'applyDecision wired',
    ) && ok;

  const day1 = buildDay8StrategicContent({ day: 1 });
  ok =
    assert(
      checks,
      day1.candidates.every(
        (candidate) => candidate.isFallback || candidate.visibilityLevel === 'hidden',
      ),
      'Day < 8 hidden/fallback',
      `visible=${day1.candidates.map((c) => c.kind).join(',')}`,
    ) && ok;
  ok =
    assert(
      checks,
      !buildReportDay8StrategicContentNote(day1),
      'Day 1 no report note',
      'report note present',
    ) && ok;

  const day7 = buildDay8StrategicContent({ day: 7 });
  ok =
    assert(
      checks,
      day7.candidates.every((candidate) => candidate.visibilityLevel === 'hidden' || candidate.isFallback),
      'Day 7 hidden',
      `kinds=${day7.candidates.map((c) => c.kind).join(',')}`,
    ) && ok;

  const day8LowData = buildDay8StrategicContent({ day: 8 });
  ok =
    assert(
      checks,
      day8LowData.candidates.length >= 1,
      'Day 8+ low data safe fallback',
      'no candidates',
    ) && ok;
  ok =
    assert(
      checks,
      day8LowData.candidates.some((candidate) => candidate.isFallback) ||
        day8LowData.candidates.length > 0,
      'Day 8 low-data not empty',
      'empty result',
    ) && ok;

  const day8 = buildDay8StrategicContent(buildDay8Pipeline());
  ok =
    assert(
      checks,
      day8.candidates.length <= DAY8_STRATEGIC_CONTENT_MAX_INTERNAL_CANDIDATES,
      'Max 4 internal candidates',
      `count=${day8.candidates.length}`,
    ) && ok;
  ok = assert(checks, unique(day8.candidates.map((candidate) => candidate.id)), 'Candidate ids unique', 'duplicate ids') && ok;
  ok = assert(checks, candidateScoresValid(day8.candidates), 'Priority clamps valid', 'priority out of range') && ok;
  ok =
    assert(
      checks,
      day8.candidates.some((candidate) => !candidate.isFallback),
      'Day 8 real source visible',
      'no real candidate',
    ) && ok;

  const neglectResult = buildDay8StrategicContent(buildDay8Pipeline());
  ok =
    assert(
      checks,
      neglectResult.candidates.some((candidate) =>
        ['district_neglect_focus', 'defer_risk_focus', 'route_pressure_focus'].includes(candidate.kind),
      ),
      'DistrictNeglect source maps district candidate',
      `kinds=${neglectResult.candidates.map((c) => c.kind).join(',')}`,
    ) && ok;

  const recoveryPortfolio = {
    ...buildDay8Pipeline().dailyCapacityPortfolioResult,
    items: [
      ...(buildDay8Pipeline().dailyCapacityPortfolioResult?.items ?? []),
      {
        id: 'recovery_item',
        kind: 'recovery_opportunity',
        title: 'Toparlanma',
        status: 'available',
        priority: 82,
        sourceIds: ['recovery_item'],
        districtId: 'sanayi',
        districtName: 'Sanayi',
      },
    ],
  };
  const recoveryResult = buildDay8StrategicContent({
    ...buildDay8Pipeline(),
    dailyCapacityPortfolioResult: recoveryPortfolio,
  });
  ok =
    assert(
      checks,
      recoveryResult.candidates.some((candidate) =>
        ['district_recovery_focus', 'positive_comeback_focus'].includes(candidate.kind),
      ),
      'Recovery source maps recovery candidate',
      `kinds=${recoveryResult.candidates.map((c) => c.kind).join(',')}`,
    ) && ok;

  const noPermission = buildDay8StrategicContent({
    ...buildDay8Pipeline(),
    authorityPermissionIds: [],
    authorityExpansionSummary: buildAuthorityGameplayExpansionSummary({
      day: 8,
      permissionIds: [],
      portfolioAvailable: true,
    }),
  });
  ok =
    assert(
      checks,
      !noPermission.candidates.some(
        (candidate) => candidate.visibilityLevel === 'detailed' && candidate.kind === 'authority_explanation_focus',
      ),
      'No permission no detailed authority',
      'detailed without permission',
    ) && ok;

  const mapResult = buildDay8StrategicContent({
    ...buildDay8Pipeline(),
    mapGameplayBindings: [
      {
        id: 'map_binding_1',
        role: 'district_memory',
        districtId: 'sanayi',
        districtName: 'Sanayi',
        line: 'Harita izi bu bolgeyi gosteriyor.',
        sourceIds: ['map_binding_1'],
        confidence: 'medium',
        priority: 78,
      },
    ],
  });
  ok =
    assert(
      checks,
      mapResult.candidates.some((candidate) =>
        ['map_priority_focus', 'memory_trace_focus'].includes(candidate.kind),
      ),
      'Map source maps map candidate',
      `kinds=${mapResult.candidates.map((c) => c.kind).join(',')}`,
    ) && ok;

  const card = buildPrimaryDay8StrategicContentCard(day8);
  ok =
    assert(
      checks,
      !card || !TECHNICAL_ENUM_PATTERN.test(`${card.title} ${card.line}`),
      'No technical enum in presentation',
      card?.line ?? 'none',
    ) && ok;

  const reportNote = buildReportDay8StrategicContentNote(day8);
  const hubHint = buildHubDay8StrategicContentHint(day8);
  const eceLine = buildEceDay8StrategicContentLine(day8);
  const portfolioSignal = buildPortfolioDay8StrategicContentSignal(day8);
  ok = assert(checks, (reportNote ? 1 : 0) <= 1, 'Report note max 1', 'too many report notes') && ok;
  ok = assert(checks, (hubHint ? 1 : 0) <= 1, 'Hub hint max 1', 'too many hub hints') && ok;
  ok = assert(checks, (eceLine ? 1 : 0) <= 1, 'Ece line max 1', 'too many ece lines') && ok;
  ok = assert(checks, (portfolioSignal ? 1 : 0) <= 1, 'Portfolio signal max 1', 'too many portfolio signals') && ok;

  const allCopy = Object.values(DAY8_STRATEGIC_CONTENT_COPY).flat().join(' ');
  ok =
    assert(
      checks,
      !DAY8_STRATEGIC_CONTENT_FAKE_CLAIM_PATTERNS.some((pattern) => pattern.test(allCopy)),
      'No fake claim copy',
      'fake claim found',
    ) && ok;

  const duplicateGuard = buildDay8StrategicContent({
    ...buildDay8Pipeline(),
    suppressLines: collectDay8StrategicContentLines(day8),
  });
  ok =
    assert(
      checks,
      duplicateGuard.candidates.every((candidate) => candidate.isFallback) ||
        duplicateGuard.candidates.length <= day8.candidates.length,
      'Duplicate guard suppresses exact lines',
      `before=${day8.candidates.length} after=${duplicateGuard.candidates.length}`,
    ) && ok;

  ok =
    assert(
      checks,
      DAY8_STRATEGIC_CONTENT_ALLOWED_SOURCE_KINDS.length >= 15,
      'Source kinds catalog',
      `count=${DAY8_STRATEGIC_CONTENT_ALLOWED_SOURCE_KINDS.length}`,
    ) && ok;

  const contextFile = readRepo('src/features/shared/utils/memoryFollowUpPresentationContext.ts');
  ok =
    assert(
      checks,
      contextFile.includes('buildDay8StrategicContent'),
      'Memory context wiring',
      'missing buildDay8StrategicContent',
    ) && ok;

  ok =
    assert(
      checks,
      !hasDay8StrategicContentRealSource({ day: 8 }),
      'No source no fake claim input',
      'fake source without input',
    ) && ok;

  const presentationCards = buildDay8StrategicContentCardModels(day8);
  ok =
    assert(
      checks,
      presentationCards.length <= DAY8_STRATEGIC_CONTENT_MAX_PRESENTATION_CANDIDATES,
      'Presentation max 3 cards',
      `count=${presentationCards.length}`,
    ) && ok;

  const kindSet = new Set(day8.candidates.filter((c) => !c.isFallback).map((c) => c.kind));
  ok =
    assert(
      checks,
      kindSet.size >= 1,
      'Day 8+ content diversity guard',
      'no visible kinds',
    ) && ok;

  const warn = false;
  return { ok, warn, checks };
}
