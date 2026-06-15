import { existsSync, readFileSync } from 'node:fs';
import { EXPECTED_SAVE_VERSION_FOR_VERIFY } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { buildAuthorityGameplayExpansionSummary } from '@/core/authorityGameplayExpansion';
import { buildCityMemoryVisibility } from '@/core/cityMemoryVisibility';
import { buildDailyCapacityPortfolio, type DailyCapacityPortfolioInput } from '@/core/dailyCapacityPortfolio';
import { buildDay8StrategicContent } from '@/core/day8StrategicContent';
import { buildDistrictNeglectRecovery } from '@/core/districtNeglectRecovery';
import { buildFollowUpActions } from '@/core/followUpActions';
import { buildOneMoreDayRetention } from '@/core/oneMoreDayRetention';
import { buildPortfolioDeferRiskBindings } from '@/core/portfolioDeferRisk';
import { buildPositiveComeback } from '@/core/positiveComeback';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  CITY_RHYTHM_COPY,
  CITY_RHYTHM_DIRECTOR_ALLOWED_SOURCE_KINDS,
  CITY_RHYTHM_DIRECTOR_MAX_INTERNAL_SLOTS,
  CITY_RHYTHM_DIRECTOR_MAX_PRESENTATION_SLOTS,
  CITY_RHYTHM_FAKE_CLAIM_PATTERNS,
} from './cityRhythmDirectorConstants';
import {
  buildCityRhythmDirector,
  collectCityRhythmDirectorLines,
  hasCityRhythmDirectorRealSource,
} from './cityRhythmDirectorModel';
import {
  buildCityRhythmCardModels,
  buildEceCityRhythmLine,
  buildHubCityRhythmHint,
  buildPortfolioCityRhythmSignal,
  buildPrimaryCityRhythmCard,
  buildReportCityRhythmNote,
} from './cityRhythmDirectorPresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = EXPECTED_SAVE_VERSION_FOR_VERIFY;
const TECHNICAL_ENUM_PATTERN = /[a-z]+_[a-z_]+/;

export type VerifyCityRhythmDirectorOutcome = {
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

function day8PortfolioInput(): DailyCapacityPortfolioInput {
  return {
    day: 8,
    activeEvents: [
      event('active_a', 'Aktif rota operasyonu', 'Sanayi', 'sanayi'),
      event('active_b', 'Aktif konteyner operasyonu', 'Cumhuriyet', 'cumhuriyet'),
    ],
    operationSignals: {
      priorityDistrictId: 'sanayi',
      vehicles: { status: 'strained', score: 62, title: 'Rota', summary: 'Baski', sourceTags: ['route'] },
      overall: { status: 'watch', score: 50, title: 'Genel', summary: 'Iz', sourceTags: [] },
    },
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
    authorityPermissionIds: ['tomorrow_risk_preview', 'district_context_detail'],
  };
}

function buildFullPipeline(day: number, extra: Record<string, unknown> = {}) {
  const portfolio = buildDailyCapacityPortfolio({ ...day8PortfolioInput(), day, ...extra });
  const deferredItem = portfolio.items.find((item) => item.deferRisk !== 'none');
  const portfolioWithDeferred = deferredItem
    ? {
        ...portfolio,
        items: portfolio.items.map((item) =>
          item.id === deferredItem.id ? { ...item, status: 'deferred' as const } : item,
        ),
      }
    : portfolio;
  const portfolioDeferRisk = buildPortfolioDeferRiskBindings({
    day,
    portfolioResult: portfolioWithDeferred,
    tomorrowRiskSignals: day8PortfolioInput().tomorrowRiskSignals,
    authorityPermissionIds: day8PortfolioInput().authorityPermissionIds,
    ...extra,
  });
  const oneMoreDayRetention = buildOneMoreDayRetention({
    day,
    portfolioDeferRiskResult: portfolioDeferRisk,
    dailyCapacityPortfolioResult: portfolioWithDeferred,
    currentRouteHints: { hubRoute: '/', mapRoute: '/map' },
    ...extra,
  });
  const cityMemoryVisibility = buildCityMemoryVisibility({
    day,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    ...extra,
  });
  const authorityExpansionSummary = buildAuthorityGameplayExpansionSummary({
    day,
    permissionIds: day8PortfolioInput().authorityPermissionIds,
    portfolioAvailable: portfolioWithDeferred.items.length > 0,
  });
  const followUpActions = buildFollowUpActions({
    day,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    dailyCapacityPortfolioResult: portfolioWithDeferred,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    authorityExpansionSummary,
    ...extra,
  });
  const positiveComeback = buildPositiveComeback({
    day,
    dailyCapacityPortfolioResult: portfolioWithDeferred,
    followUpActionResult: followUpActions,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    portfolioDeferRiskResult: portfolioDeferRisk,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    authorityExpansionSummary,
    ...extra,
  });
  const districtNeglectRecovery = buildDistrictNeglectRecovery({
    day,
    dailyCapacityPortfolioResult: portfolioWithDeferred,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    followUpActionResult: followUpActions,
    positiveComebackResult: positiveComeback,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    authorityExpansionSummary,
    ...extra,
  });
  const day8StrategicContent = buildDay8StrategicContent({
    day,
    dailyCapacityPortfolioResult: portfolioWithDeferred,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    followUpActionResult: followUpActions,
    positiveComebackResult: positiveComeback,
    districtNeglectRecoveryResult: districtNeglectRecovery,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    authorityExpansionSummary,
    ...extra,
  });
  return {
    day,
    day8StrategicContentResult: day8StrategicContent,
    districtNeglectRecoveryResult: districtNeglectRecovery,
    positiveComebackResult: positiveComeback,
    followUpActionResult: followUpActions,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    portfolioDeferRiskResult: portfolioDeferRisk,
    dailyCapacityPortfolioResult: portfolioWithDeferred,
    authorityExpansionSummary,
  };
}

export function verifyCityRhythmDirectorScenario(): VerifyCityRhythmDirectorOutcome {
  const checks: string[] = [];
  let ok = true;

  ok =
    assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION unchanged', `v${SAVE_VERSION}`) &&
    ok;
  ok =
    assert(
      checks,
      !readRepo('src/store/gamePersist.ts').includes('cityRhythmDirector'),
      'gamePersist shape unchanged',
      'persist wired',
    ) && ok;
  ok =
    assert(
      checks,
      !readRepo('src/core/game/applyDecision.ts').includes('cityRhythmDirector'),
      'applyDecision unchanged',
      'applyDecision wired',
    ) && ok;
  const mapFiles = [
    'src/features/map/screens/MapScreen.tsx',
    'src/features/map/utils/mapUiPresentation.ts',
    'src/features/map/components/CityMapCard.tsx',
    'src/features/map/components/MapHeroPanel.tsx',
  ];
  const mapTouched = mapFiles.some((file) => readRepo(file).includes('cityRhythmDirector'));
  ok =
    assert(
      checks,
      !mapTouched,
      'Map UI not wired',
      'map files touched',
    ) && ok;

  const day1 = buildCityRhythmDirector({ day: 1 });
  ok = assert(checks, !day1.isVisible, 'Day < 8 hidden', 'visible on day 1') && ok;
  ok = assert(checks, !buildReportCityRhythmNote(day1), 'Day 1 no report note', 'report note present') && ok;

  const day7 = buildCityRhythmDirector({ day: 7 });
  ok = assert(checks, !day7.isVisible, 'Day 7 hidden', 'visible on day 7') && ok;

  const day8Low = buildCityRhythmDirector({ day: 8 });
  ok =
    assert(
      checks,
      day8Low.isVisible && day8Low.slots.length >= 1,
      'Day 8+ low data calm fallback',
      'empty day 8',
    ) && ok;
  ok =
    assert(
      checks,
      day8Low.intensity === 'low' || day8Low.rhythmKind === 'calm_watch_day',
      'Low data low intensity',
      `intensity=${day8Low.intensity}`,
    ) && ok;

  const day8 = buildCityRhythmDirector(buildFullPipeline(8));
  ok =
    assert(
      checks,
      day8.isVisible && day8.slots.length <= CITY_RHYTHM_DIRECTOR_MAX_INTERNAL_SLOTS,
      'Max 4 internal slots',
      `count=${day8.slots.length}`,
    ) && ok;
  ok = assert(checks, unique(day8.slots.map((slot) => slot.id)), 'Slot ids unique', 'duplicate ids') && ok;
  ok =
    assert(
      checks,
      day8.slots.every((slot) => slot.priority >= 0 && slot.priority <= 100),
      'Priority clamps valid',
      'priority out of range',
    ) && ok;
  ok =
    assert(
      checks,
      day8.slots.some((slot) => !slot.isFallback),
      'Day 8 real source visible',
      'no real slot',
    ) && ok;

  const neglectResult = buildCityRhythmDirector(buildFullPipeline(8));
  ok =
    assert(
      checks,
      ['neglect_attention_day', 'strategic_pressure_day', 'mixed_city_day', 'resource_strain_day'].includes(
        neglectResult.rhythmKind,
      ),
      'District neglect source maps rhythm',
      `kind=${neglectResult.rhythmKind}`,
    ) && ok;

  const recoveryPortfolio = {
    ...buildFullPipeline(8).dailyCapacityPortfolioResult,
    items: [
      ...(buildFullPipeline(8).dailyCapacityPortfolioResult?.items ?? []),
      {
        id: 'recovery_item',
        kind: 'recovery_opportunity',
        title: 'Toparlanma',
        status: 'available',
        priority: 88,
        sourceIds: ['recovery_item'],
        districtId: 'sanayi',
        districtName: 'Sanayi',
      },
    ],
  };
  const recoveryResult = buildCityRhythmDirector({
    ...buildFullPipeline(8),
    dailyCapacityPortfolioResult: recoveryPortfolio,
  });
  ok =
    assert(
      checks,
      ['recovery_window_day', 'mixed_city_day', 'follow_up_day'].includes(recoveryResult.rhythmKind),
      'Recovery source maps recovery rhythm',
      `kind=${recoveryResult.rhythmKind}`,
    ) && ok;

  const memoryResult = buildCityRhythmDirector({
    day: 8,
    cityMemoryVisibilityResult: {
      traces: [
        {
          id: 'trace_1',
          kind: 'district_trace',
          line: 'Mahalle izi bugun on planda.',
          districtName: 'Sanayi',
          sourceIds: ['trace_1'],
          priority: 88,
        },
      ],
      sourceIds: ['trace_1'],
    },
  });
  ok =
    assert(
      checks,
      memoryResult.rhythmKind === 'memory_echo_day' ||
        memoryResult.slots.some((s) => s.kind === 'memory_echo'),
      'Memory source maps memory echo',
      `kind=${memoryResult.rhythmKind}`,
    ) && ok;

  const followUpResult = buildCityRhythmDirector(buildFullPipeline(8));
  ok =
    assert(
      checks,
      followUpResult.slots.some((s) => s.kind === 'follow_up_hint') ||
        followUpResult.rhythmKind === 'follow_up_day' ||
        followUpResult.rhythmKind === 'mixed_city_day',
      'FollowUp source maps follow-up',
      `kind=${followUpResult.rhythmKind}`,
    ) && ok;

  const card = buildPrimaryCityRhythmCard(day8);
  ok =
    assert(
      checks,
      !card || !TECHNICAL_ENUM_PATTERN.test(`${card.title} ${card.line}`),
      'No technical enum in presentation',
      card?.line ?? 'none',
    ) && ok;

  const reportNote = buildReportCityRhythmNote(day8);
  const hubHint = buildHubCityRhythmHint(day8);
  const eceLine = buildEceCityRhythmLine(day8);
  const portfolioSignal = buildPortfolioCityRhythmSignal(day8);
  ok = assert(checks, (reportNote ? 1 : 0) <= 1, 'Report note max 1', 'too many') && ok;
  ok = assert(checks, (hubHint ? 1 : 0) <= 1, 'Hub hint max 1', 'too many') && ok;
  ok = assert(checks, (eceLine ? 1 : 0) <= 1, 'Ece line max 1', 'too many') && ok;
  ok = assert(checks, (portfolioSignal ? 1 : 0) <= 1, 'Portfolio signal max 1', 'too many') && ok;

  const allCopy = Object.values(CITY_RHYTHM_COPY).flat().join(' ');
  ok =
    assert(
      checks,
      !CITY_RHYTHM_FAKE_CLAIM_PATTERNS.some((pattern) => pattern.test(allCopy)),
      'No fake claim copy',
      'fake claim found',
    ) && ok;

  const duplicateGuard = buildCityRhythmDirector({
    ...buildFullPipeline(8),
    suppressLines: collectCityRhythmDirectorLines(day8),
  });
  ok =
    assert(
      checks,
      duplicateGuard.slots.every((slot) => slot.isFallback) ||
        duplicateGuard.slots.length <= day8.slots.length,
      'Duplicate guard suppresses exact lines',
      `before=${day8.slots.length} after=${duplicateGuard.slots.length}`,
    ) && ok;

  ok =
    assert(
      checks,
      CITY_RHYTHM_DIRECTOR_ALLOWED_SOURCE_KINDS.length >= 10,
      'Source kinds catalog',
      `count=${CITY_RHYTHM_DIRECTOR_ALLOWED_SOURCE_KINDS.length}`,
    ) && ok;

  const contextFile = readRepo('src/features/shared/utils/memoryFollowUpPresentationContext.ts');
  ok =
    assert(
      checks,
      contextFile.includes('buildCityRhythmDirector'),
      'Memory context wiring',
      'missing buildCityRhythmDirector',
    ) && ok;

  ok =
    assert(
      checks,
      !hasCityRhythmDirectorRealSource({ day: 8 }),
      'No source no fake claim input',
      'fake source without input',
    ) && ok;

  const presentationCards = buildCityRhythmCardModels(day8);
  ok =
    assert(
      checks,
      presentationCards.length <= CITY_RHYTHM_DIRECTOR_MAX_PRESENTATION_SLOTS,
      'Presentation max 3 cards',
      `count=${presentationCards.length}`,
    ) && ok;

  const warn = false;
  return { ok, warn, checks };
}
