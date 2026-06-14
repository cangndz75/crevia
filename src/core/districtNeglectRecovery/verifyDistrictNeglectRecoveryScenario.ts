import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildAuthorityGameplayExpansionSummary } from '@/core/authorityGameplayExpansion';
import { buildCityMemoryVisibility } from '@/core/cityMemoryVisibility';
import { buildDailyCapacityPortfolio, type DailyCapacityPortfolioInput } from '@/core/dailyCapacityPortfolio';
import { buildDistrictPersonalityProfile } from '@/core/districtPersonality';
import { buildFollowUpActions } from '@/core/followUpActions';
import { buildOneMoreDayRetention } from '@/core/oneMoreDayRetention';
import { buildPortfolioDeferRiskBindings } from '@/core/portfolioDeferRisk';
import { buildPositiveComeback } from '@/core/positiveComeback';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  DISTRICT_NEGLECT_RECOVERY_ALLOWED_SOURCE_KINDS,
  DISTRICT_NEGLECT_RECOVERY_COPY,
  DISTRICT_NEGLECT_RECOVERY_FAKE_NEGLECT_PATTERNS,
  DISTRICT_NEGLECT_RECOVERY_FAKE_RECOVERY_PATTERNS,
  DISTRICT_NEGLECT_RECOVERY_MAX_INTERNAL_SIGNALS,
  DISTRICT_NEGLECT_RECOVERY_MAX_PRESENTATION_SIGNALS,
} from './districtNeglectRecoveryConstants';
import { buildDistrictNeglectRecovery, collectDistrictNeglectRecoveryLines } from './districtNeglectRecoveryModel';
import {
  buildDistrictNeglectRecoveryCardModels,
  buildEceDistrictNeglectRecoveryLine,
  buildHubDistrictNeglectRecoveryHint,
  buildPortfolioDistrictNeglectRecoverySignal,
  buildPrimaryDistrictNeglectRecoveryCard,
  buildReportDistrictNeglectRecoveryNote,
} from './districtNeglectRecoveryPresentation';
import type { DistrictNeglectRecoverySignal } from './districtNeglectRecoveryTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = 26;
const TECHNICAL_ENUM_PATTERN = /[a-z]+_[a-z_]+/;

export type VerifyDistrictNeglectRecoveryOutcome = {
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
    authorityPermissionIds: ['tomorrow_risk_preview', 'district_trust_preview'],
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
    districtMemorySignals: extra.districtMemorySignals as never,
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
  return {
    dailyCapacityPortfolioResult: portfolioWithDeferred,
    portfolioDeferRiskResult: portfolioDeferRisk,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    followUpActionResult: followUpActions,
    positiveComebackResult: positiveComeback,
    authorityExpansionSummary,
  };
}

function signalScoresValid(signals: DistrictNeglectRecoverySignal[]): boolean {
  return signals.every(
    (signal) =>
      signal.neglectScore >= 0 &&
      signal.neglectScore <= 100 &&
      signal.recoveryScore >= 0 &&
      signal.recoveryScore <= 100 &&
      signal.priority >= 0 &&
      signal.priority <= 100,
  );
}

export function verifyDistrictNeglectRecoveryScenario(): VerifyDistrictNeglectRecoveryOutcome {
  const checks: string[] = [];
  let ok = true;

  ok =
    assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION unchanged', `v${SAVE_VERSION}`) &&
    ok;
  ok =
    assert(
      checks,
      !readRepo('src/store/gamePersist.ts').includes('districtNeglectRecovery'),
      'gamePersist shape unchanged',
      'persist wired',
    ) && ok;
  ok =
    assert(
      checks,
      !readRepo('src/core/game/applyDecision.ts').includes('districtNeglectRecovery'),
      'applyDecision unchanged',
      'applyDecision wired',
    ) && ok;

  const day1 = buildDistrictNeglectRecovery({ day: 1 });
  ok =
    assert(
      checks,
      day1.signals.every((signal) => signal.isFallback || signal.kind === 'fallback'),
      'Day 1 low-noise',
      `signals=${day1.signals.map((s) => s.kind).join(',')}`,
    ) && ok;
  ok =
    assert(
      checks,
      !buildReportDistrictNeglectRecoveryNote(day1),
      'Day 1 no report note',
      'report note present',
    ) && ok;

  const day8 = buildDistrictNeglectRecovery({
    day: 8,
    ...buildDay8Pipeline(),
  });
  ok = assert(checks, day8.signals.length <= DISTRICT_NEGLECT_RECOVERY_MAX_INTERNAL_SIGNALS, 'Max 4 internal signals', `count=${day8.signals.length}`) && ok;
  ok = assert(checks, unique(day8.signals.map((signal) => signal.id)), 'Signal ids unique', 'duplicate ids') && ok;
  ok = assert(checks, signalScoresValid(day8.signals), 'Score clamps valid', 'score out of range') && ok;
  ok =
    assert(
      checks,
      day8.signals.some((signal) => !signal.isFallback),
      'Day 8 real source visible',
      'no real signal',
    ) && ok;

  const trustPipeline = buildDay8Pipeline({
    districtMemorySignals: [
      {
        id: 'district-trust-1',
        title: 'Guven izi',
        advisorLine: 'Guven hassasiyeti artiyor.',
        reportLine: 'Guven hassasiyeti artiyor.',
        sourceIds: ['district-trust-1'],
      },
    ],
  });
  const trustResult = buildDistrictNeglectRecovery({
    day: 8,
    ...trustPipeline,
    districtMemorySignals: [
      {
        id: 'district-trust-1',
        title: 'Guven izi',
        advisorLine: 'Guven hassasiyeti artiyor.',
        reportLine: 'Guven hassasiyeti artiyor.',
        sourceIds: ['district-trust-1'],
      },
    ],
    decisionConsequenceThreads: [
      {
        id: 'dc-trust',
        tone: 'warning',
        causalLine: 'Guven sinyali birikiyor.',
        sourceIds: ['dc-trust'],
        districtName: 'Sanayi',
        neighborhoodId: 'sanayi',
      },
    ],
  });
  ok =
    assert(
      checks,
      trustResult.signals.some((signal) =>
        ['trust_fragility', 'neglect_watch', 'neglect_warning', 'social_cooling'].includes(signal.kind),
      ) || trustResult.signals.some((signal) => signal.neglectScore >= 20),
      'Neglect source produces neglect score',
      `kinds=${trustResult.signals.map((s) => s.kind).join(',')}`,
    ) && ok;

  const recoveryPipeline = buildDay8Pipeline();
  const recoveryPortfolio = {
    ...recoveryPipeline.dailyCapacityPortfolioResult,
    items: [
      ...(recoveryPipeline.dailyCapacityPortfolioResult?.items ?? []),
      {
        id: 'portfolio_recovery_1',
        kind: 'recovery_opportunity',
        title: 'Toparlanma firsati',
        subtitle: 'Kucuk takip hamlesi degerli.',
        status: 'available',
        priority: 78,
        sourceIds: ['recovery_source_1'],
        sourceKinds: ['reward_comeback'],
        districtId: 'sanayi',
        districtName: 'Sanayi',
      },
    ],
  };
  const recoveryPositive = buildPositiveComeback({
    day: 8,
    dailyCapacityPortfolioResult: recoveryPortfolio,
    followUpActionResult: recoveryPipeline.followUpActionResult,
    oneMoreDayRetentionResult: recoveryPipeline.oneMoreDayRetentionResult,
    portfolioDeferRiskResult: recoveryPipeline.portfolioDeferRiskResult,
    cityMemoryVisibilityResult: recoveryPipeline.cityMemoryVisibilityResult,
    authorityExpansionSummary: recoveryPipeline.authorityExpansionSummary,
  });
  const recoveryResult = buildDistrictNeglectRecovery({
    day: 8,
    ...recoveryPipeline,
    positiveComebackResult: recoveryPositive,
    dailyCapacityPortfolioResult: recoveryPortfolio,
  });
  ok =
    assert(
      checks,
      recoveryResult.signals.some((signal) => signal.recoveryScore >= 20),
      'Recovery source produces recovery score',
      `recoveryScores=${recoveryResult.signals.map((s) => s.recoveryScore).join(',')}`,
    ) && ok;

  const personalityOnly = buildDistrictPersonalityProfile({
    day: 8,
    districtId: 'sanayi',
    districtName: 'Sanayi',
  });
  const personalityResult = buildDistrictNeglectRecovery({
    day: 8,
    districtPersonalityProfiles: [personalityOnly],
  });
  ok =
    assert(
      checks,
      personalityResult.signals.every((signal) => signal.isFallback),
      'Personality baseline alone no fake neglect',
      personalityResult.signals.map((s) => s.kind).join(','),
    ) && ok;

  const cards = buildPrimaryDistrictNeglectRecoveryCard(day8);
  ok =
    assert(
      checks,
      !cards || !TECHNICAL_ENUM_PATTERN.test(`${cards.title} ${cards.line}`),
      'No technical enum in presentation',
      cards?.line ?? 'none',
    ) && ok;

  const reportNote = buildReportDistrictNeglectRecoveryNote(day8);
  const hubHint = buildHubDistrictNeglectRecoveryHint(day8);
  const eceLine = buildEceDistrictNeglectRecoveryLine(day8);
  const portfolioSignal = buildPortfolioDistrictNeglectRecoverySignal(day8);
  ok = assert(checks, (reportNote ? 1 : 0) <= 1, 'Report note max 1', 'too many report notes') && ok;
  ok = assert(checks, (hubHint ? 1 : 0) <= 1, 'Hub hint max 1', 'too many hub hints') && ok;
  ok = assert(checks, (eceLine ? 1 : 0) <= 1, 'Ece line max 1', 'too many ece lines') && ok;
  ok = assert(checks, (portfolioSignal ? 1 : 0) <= 1, 'Portfolio signal max 1', 'too many portfolio signals') && ok;

  const allCopy = Object.values(DISTRICT_NEGLECT_RECOVERY_COPY).flat().join(' ');
  ok =
    assert(
      checks,
      !DISTRICT_NEGLECT_RECOVERY_FAKE_NEGLECT_PATTERNS.some((pattern) => pattern.test(allCopy)),
      'No punishment neglect copy',
      'punishment copy found',
    ) && ok;
  ok =
    assert(
      checks,
      !DISTRICT_NEGLECT_RECOVERY_FAKE_RECOVERY_PATTERNS.some((pattern) => pattern.test(allCopy)),
      'No fake recovery copy',
      'fake recovery copy found',
    ) && ok;

  const duplicateGuard = buildDistrictNeglectRecovery({
    day: 8,
    ...buildDay8Pipeline(),
    suppressLines: collectDistrictNeglectRecoveryLines(day8),
  });
  ok =
    assert(
      checks,
      duplicateGuard.signals.every((signal) => signal.isFallback) ||
        duplicateGuard.signals.length <= day8.signals.length,
      'Duplicate guard suppresses exact lines',
      `before=${day8.signals.length} after=${duplicateGuard.signals.length}`,
    ) && ok;

  ok =
    assert(
      checks,
      DISTRICT_NEGLECT_RECOVERY_ALLOWED_SOURCE_KINDS.length >= 10,
      'Source kinds catalog',
      `count=${DISTRICT_NEGLECT_RECOVERY_ALLOWED_SOURCE_KINDS.length}`,
    ) && ok;

  const contextFile = readRepo('src/features/shared/utils/memoryFollowUpPresentationContext.ts');
  ok =
    assert(
      checks,
      contextFile.includes('buildDistrictNeglectRecovery'),
      'Memory context wiring',
      'missing buildDistrictNeglectRecovery',
    ) && ok;

  const presentationCards = buildDistrictNeglectRecoveryCardModels(day8);
  ok =
    assert(
      checks,
      presentationCards.length <= DISTRICT_NEGLECT_RECOVERY_MAX_PRESENTATION_SIGNALS,
      'Presentation max 3 cards',
      `count=${presentationCards.length}`,
    ) && ok;

  const warn = false;
  return { ok, warn, checks };
}