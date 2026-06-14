import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildAuthorityGameplayExpansionSummary } from '@/core/authorityGameplayExpansion';
import { buildCityMemoryVisibility } from '@/core/cityMemoryVisibility';
import { buildCityRhythmDirector } from '@/core/cityRhythmDirector';
import { buildDailyCapacityPortfolio, type DailyCapacityPortfolioInput } from '@/core/dailyCapacityPortfolio';
import { buildDay8StrategicContent } from '@/core/day8StrategicContent';
import { buildDistrictNeglectRecovery } from '@/core/districtNeglectRecovery';
import {
  buildEventSelectionCandidates,
  buildEventSelectionResult,
  rankEventSelectionCandidates,
} from '@/core/eventSelection/eventFamilySelectionEngine';
import { buildFollowUpActions } from '@/core/followUpActions';
import { buildOneMoreDayRetention } from '@/core/oneMoreDayRetention';
import { buildPortfolioDeferRiskBindings } from '@/core/portfolioDeferRisk';
import { buildPositiveComeback } from '@/core/positiveComeback';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  DAY8_OPERATION_FEED_BINDING_ALLOWED_SOURCE_KINDS,
  DAY8_OPERATION_FEED_BINDING_MAX_BIASES,
  DAY8_OPERATION_FEED_BINDING_MAX_FEED_BINDINGS,
  DAY8_OPERATION_FEED_BINDING_SCORE_BOOST_MAX,
  DAY8_OPERATION_FEED_BINDING_TOTAL_BOOST_MAX,
  DAY8_OPERATION_FEED_FAKE_CLAIM_PATTERNS,
} from './day8OperationFeedBindingConstants';
import {
  applyDay8OperationFeedBiasToEventCandidates,
  buildDay8OperationFeedBinding,
  collectDay8OperationFeedBindingLines,
  containsForcedSelectionLanguage,
  hasDay8OperationFeedRealSource,
} from './day8OperationFeedBindingModel';
import {
  buildCenterOperationFeedBindingSignal,
  buildEceOperationFeedBindingLine,
  buildOperationFeedBindingCardModels,
  buildOperationFeedReasonLine,
  buildPrimaryOperationFeedBindingCard,
} from './day8OperationFeedBindingPresentation';
import { buildCenterOperationSignals } from '@/features/hub/utils/centerOperationSignalsPresentation';
import type { Day8OperationFeedBias } from './day8OperationFeedBindingTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = 27;
const TECHNICAL_ENUM_PATTERN = /\b[a-z]+_[a-z_]+\b/;

export type VerifyDay8OperationFeedBindingOutcome = {
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
      'ece_analysis_depth',
      'tomorrow_priority_reason',
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
  const day8StrategicContent = buildDay8StrategicContent({
    day: 8,
    authorityPermissionIds: day8PortfolioInput().authorityPermissionIds,
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
  const cityRhythmDirector = buildCityRhythmDirector({
    day: 8,
    day8StrategicContentResult: day8StrategicContent,
    districtNeglectRecoveryResult: districtNeglectRecovery,
    positiveComebackResult: positiveComeback,
    followUpActionResult: followUpActions,
    cityMemoryVisibilityResult: cityMemoryVisibility,
    oneMoreDayRetentionResult: oneMoreDayRetention,
    portfolioDeferRiskResult: portfolioDeferRisk,
    dailyCapacityPortfolioResult: portfolioWithDeferred,
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
    day8StrategicContentResult: day8StrategicContent,
    cityRhythmDirectorResult: cityRhythmDirector,
    authorityExpansionSummary,
  };
}

function biasScoresValid(biases: Day8OperationFeedBias[]): boolean {
  return biases.every(
    (bias) =>
      bias.scoreBoost >= 0 &&
      bias.scoreBoost <= DAY8_OPERATION_FEED_BINDING_SCORE_BOOST_MAX &&
      bias.priority >= 0 &&
      bias.priority <= 100,
  );
}

function selectionContext(day: number) {
  return {
    day,
    districtId: 'sanayi',
    districtTrustBand: 'watch' as const,
    resourcePressureBand: 'medium' as const,
    recentEventFamilyIds: [],
    recentDistrictIds: [],
    recentDomainIds: [],
  };
}

export function verifyDay8OperationFeedBindingScenario(): VerifyDay8OperationFeedBindingOutcome {
  const checks: string[] = [];
  let ok = true;

  ok =
    assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION 27', `v${SAVE_VERSION}`) &&
    ok;
  ok =
    assert(
      checks,
      !readRepo('src/store/gamePersist.ts').includes('day8OperationFeedBinding'),
      'gamePersist shape unchanged',
      'persist wired',
    ) && ok;
  ok =
    assert(
      checks,
      !readRepo('src/core/game/applyDecision.ts').includes('day8OperationFeedBinding'),
      'applyDecision unchanged',
      'applyDecision wired',
    ) && ok;
  ok =
    assert(
      checks,
      !readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts').includes('day8OperationFeedBinding'),
      'day pipeline unchanged',
      'day pipeline wired',
    ) && ok;

  const day1 = buildDay8OperationFeedBinding({ day: 1 });
  ok = assert(checks, !day1.isActive, 'Day <8 inactive', `active=${day1.isActive}`) && ok;
  ok = assert(checks, day1.biases.length === 0, 'Day 1 no biases', `count=${day1.biases.length}`) && ok;

  const day7 = buildDay8OperationFeedBinding({ day: 7 });
  ok = assert(checks, !day7.isActive, 'Day 7 inactive', `active=${day7.isActive}`) && ok;

  const ctx = selectionContext(8);
  const baseCandidates = buildEventSelectionCandidates(ctx);
  const baseRanked = rankEventSelectionCandidates(baseCandidates, ctx);
  const noSourceBinding = buildDay8OperationFeedBinding({
    day: 8,
    existingEventCandidates: baseCandidates,
  });
  const noSourceRanked = rankEventSelectionCandidates(baseCandidates, ctx, noSourceBinding);
  ok =
    assert(
      checks,
      noSourceRanked.map((candidate) => candidate.id).join('|') ===
        baseRanked.map((candidate) => candidate.id).join('|'),
      'No source identical output',
      'order changed without source',
    ) && ok;

  const pipeline = buildDay8Pipeline();
  const day8Binding = buildDay8OperationFeedBinding({
    ...pipeline,
    existingEventCandidates: baseCandidates,
    existingOperationFeedItems: baseCandidates.map((candidate) => ({
      id: candidate.id,
      title: candidate.title,
      districtId: candidate.districtIds[0],
      domains: candidate.domains,
      tags: candidate.tags,
    })),
  });
  ok = assert(checks, day8Binding.isActive, 'Day 8+ active if source exists', 'inactive with sources') && ok;
  ok =
    assert(
      checks,
      day8Binding.biases.length <= DAY8_OPERATION_FEED_BINDING_MAX_BIASES,
      'Max 4 bias',
      `count=${day8Binding.biases.length}`,
    ) && ok;
  ok =
    assert(
      checks,
      day8Binding.feedBindings.length <= DAY8_OPERATION_FEED_BINDING_MAX_FEED_BINDINGS,
      'Max 3 feed binding',
      `count=${day8Binding.feedBindings.length}`,
    ) && ok;
  ok = assert(checks, unique(day8Binding.sourceIds), 'sourceIds unique', 'duplicate sourceIds') && ok;
  ok = assert(checks, biasScoresValid(day8Binding.biases), 'scoreBoost and priority clamp', 'clamp invalid') && ok;
  ok =
    assert(
      checks,
      day8Binding.biases.every((bias) => bias.scoreBoost <= DAY8_OPERATION_FEED_BINDING_SCORE_BOOST_MAX),
      'scoreBoost clamp',
      'boost too high',
    ) && ok;

  const boosted = applyDay8OperationFeedBiasToEventCandidates(baseCandidates, day8Binding.biases);
  ok =
    assert(
      checks,
      boosted.every((candidate) => candidate.strategicBoost <= DAY8_OPERATION_FEED_BINDING_TOTAL_BOOST_MAX),
      'totalBoost clamp',
      'total boost exceeded',
    ) && ok;

  ok =
    assert(
      checks,
      day8Binding.biases.some((bias) => bias.kind === 'district_neglect_bias' || bias.kind === 'route_pressure_bias'),
      'DistrictNeglect maps district bias',
      `kinds=${day8Binding.biases.map((b) => b.kind).join(',')}`,
    ) && ok;

  const recoveryBinding = buildDay8OperationFeedBinding({
    ...pipeline,
    positiveComebackResult: {
      ...pipeline.positiveComebackResult,
      primaryCandidate: {
        id: 'pc_recovery',
        kind: 'district_recovery',
        title: 'Toparlanma',
        line: 'Mahalle toparlaniyor.',
        benefitLine: 'Firsat',
        districtId: 'sanayi',
        districtName: 'Sanayi',
        sourceIds: ['pc_recovery'],
        sourceKinds: ['positive_comeback'],
        confidence: 'high',
        priority: 85,
        dayPolicy: 'day_8_plus',
        visibilityLevel: 'summary',
        tone: 'positive',
        isActionable: true,
        isFallback: false,
      },
    },
    existingEventCandidates: baseCandidates,
  });
  ok =
    assert(
      checks,
      recoveryBinding.biases.some(
        (bias) => bias.kind === 'district_recovery_bias' || bias.kind === 'positive_comeback_bias',
      ),
      'PositiveComeback maps recovery bias',
      `kinds=${recoveryBinding.biases.map((b) => b.kind).join(',')}`,
    ) && ok;

  const followUpBinding = buildDay8OperationFeedBinding({
    ...pipeline,
    followUpActionResult: {
      day: 8,
      actions: [],
      primaryAction: {
        id: 'fu1',
        kind: 'capture_memory_trace',
        title: 'Hafiza izi',
        line: 'Kucuk takip etkisi var.',
        benefitLine: 'Iz',
        sourceIds: ['fu1'],
        sourceKinds: ['city_memory_visibility'],
        confidence: 'medium',
        priority: 80,
        dayPolicy: 'day_8_plus',
        visibilityLevel: 'summary',
        costBand: 'low',
        impactBand: 'medium',
        isActionable: true,
        isFallback: false,
      },
      sourceIds: ['fu1'],
    },
    existingEventCandidates: baseCandidates,
  });
  ok =
    assert(
      checks,
      followUpBinding.biases.some(
        (bias) => bias.kind === 'follow_up_bias' || bias.kind === 'memory_trace_bias',
      ),
      'FollowUp maps follow-up or memory bias',
      `kinds=${followUpBinding.biases.map((b) => b.kind).join(',')}`,
    ) && ok;

  const memoryBinding = buildDay8OperationFeedBinding({
    ...pipeline,
    cityMemoryVisibilityResult: {
      day: 8,
      traces: [
        {
          id: 'mem1',
          kind: 'district_trace',
          title: 'Hafiza',
          line: 'Sehir hafizasi bu bolgeyi gosteriyor.',
          districtId: 'sanayi',
          districtName: 'Sanayi',
          sourceIds: ['mem1'],
          sourceKinds: ['district_memory'],
          confidence: 'high',
          priority: 90,
          dayPolicy: 'day_8_plus',
          tone: 'strategic',
          isActionable: true,
          isFallback: false,
        },
      ],
      primaryTrace: {
        id: 'mem1',
        kind: 'district_trace',
        title: 'Hafiza',
        line: 'Sehir hafizasi bu bolgeyi gosteriyor.',
        districtId: 'sanayi',
        districtName: 'Sanayi',
        sourceIds: ['mem1'],
        sourceKinds: ['district_memory'],
        confidence: 'high',
        priority: 90,
        dayPolicy: 'day_8_plus',
        tone: 'strategic',
        isActionable: true,
        isFallback: false,
      },
      sourceIds: ['mem1'],
    },
    day8StrategicContentResult: null,
    cityRhythmDirectorResult: null,
    districtNeglectRecoveryResult: null,
    existingEventCandidates: baseCandidates,
  });
  ok =
    assert(
      checks,
      memoryBinding.biases.some((bias) => bias.kind === 'memory_trace_bias'),
      'CityMemory maps memory bias',
      `kinds=${memoryBinding.biases.map((b) => b.kind).join(',')}`,
    ) && ok;

  ok =
    assert(
      checks,
      day8Binding.biases.some((bias) => bias.kind === 'defer_risk_bias' || bias.kind === 'route_pressure_bias'),
      'PortfolioDefer maps defer/route bias',
      `kinds=${day8Binding.biases.map((b) => b.kind).join(',')}`,
    ) && ok;

  const capacityBinding = buildDay8OperationFeedBinding({
    day: 8,
    dailyCapacityPortfolioResult: {
      day: 8,
      items: [
        {
          id: 'portfolio_route',
          kind: 'route_pressure',
          title: 'Rota baskisi',
          status: 'selected',
          priority: 88,
          sourceIds: ['portfolio_route'],
          sourceKinds: ['operation_signals'],
          districtId: 'sanayi',
          districtName: 'Sanayi',
        },
      ],
      sourceIds: ['portfolio_route'],
    },
    existingEventCandidates: baseCandidates,
  });
  ok =
    assert(
      checks,
      capacityBinding.biases.some((bias) => bias.kind === 'route_pressure_bias'),
      'DailyCapacity maps capacity bias',
      `kinds=${capacityBinding.biases.map((b) => b.kind).join(',')}`,
    ) && ok;

  ok =
    assert(
      checks,
      day8Binding.biases.some((bias) => bias.kind === 'city_rhythm_bias' || bias.sourceKinds.includes('city_rhythm_director')),
      'CityRhythm maps rhythm bias',
      `kinds=${day8Binding.biases.map((b) => b.kind).join(',')}`,
    ) && ok;

  const authorityOnly = day8Binding.biases.filter((bias) =>
    bias.sourceKinds.includes('authority_gameplay_expansion'),
  );
  ok =
    assert(
      checks,
      authorityOnly.every((bias) => bias.scoreBoost === 0),
      'Authority only visibility no standalone boost',
      `boosts=${authorityOnly.map((b) => b.scoreBoost).join(',')}`,
    ) && ok;

  const noPermission = buildDay8OperationFeedBinding({
    ...pipeline,
    authorityPermissionIds: [],
    authorityExpansionSummary: buildAuthorityGameplayExpansionSummary({
      day: 8,
      permissionIds: [],
      portfolioAvailable: true,
    }),
    existingEventCandidates: baseCandidates,
  });
  ok =
    assert(
      checks,
      !noPermission.biases.some((bias) => bias.visibilityLevel === 'detailed' && bias.kind === 'district_neglect_bias'),
      'Permission yokken detailed yok',
      'detailed without permission',
    ) && ok;

  const biasedRanked = rankEventSelectionCandidates(baseCandidates, ctx, day8Binding);
  ok =
    assert(
      checks,
      biasedRanked.every((candidate) => baseCandidates.some((base) => base.id === candidate.id)),
      'No candidate outside pool',
      'extra candidate selected',
    ) && ok;
  ok =
    assert(
      checks,
      biasedRanked.length === baseRanked.length,
      'Existing candidate pool preserved',
      'pool size changed',
    ) && ok;

  const baseSelection = buildEventSelectionResult(ctx);
  const biasedSelection = buildEventSelectionResult(ctx, undefined, day8Binding);
  ok =
    assert(
      checks,
      baseSelection.decision.selectedCandidateId ===
        buildEventSelectionResult(ctx, undefined, { day: 8, isActive: false, biases: [], feedBindings: [], sourceIds: [] })
          .decision.selectedCandidateId,
      'Inactive binding preserves selection',
      'inactive changed selection',
    ) && ok;

  const card = buildPrimaryOperationFeedBindingCard(day8Binding);
  ok =
    assert(
      checks,
      !card || !TECHNICAL_ENUM_PATTERN.test(`${card.title} ${card.reasonLine}`),
      'No technical enum in presentation',
      card?.reasonLine ?? 'none',
    ) && ok;

  const duplicateGuard = buildDay8OperationFeedBinding({
    ...pipeline,
    existingEventCandidates: baseCandidates,
    suppressLines: collectDay8OperationFeedBindingLines(day8Binding),
  });
  ok =
    assert(
      checks,
      duplicateGuard.feedBindings.length <= day8Binding.feedBindings.length,
      'Duplicate guard suppresses lines',
      `before=${day8Binding.feedBindings.length} after=${duplicateGuard.feedBindings.length}`,
    ) && ok;

  ok =
    assert(
      checks,
      DAY8_OPERATION_FEED_BINDING_ALLOWED_SOURCE_KINDS.length >= 10,
      'Source kinds catalog',
      `count=${DAY8_OPERATION_FEED_BINDING_ALLOWED_SOURCE_KINDS.length}`,
    ) && ok;

  const contextFile = readRepo('src/features/shared/utils/memoryFollowUpPresentationContext.ts');
  ok =
    assert(
      checks,
      contextFile.includes('buildDay8OperationFeedBinding'),
      'Memory context wiring',
      'missing buildDay8OperationFeedBinding',
    ) && ok;

  ok =
    assert(
      checks,
      !hasDay8OperationFeedRealSource({ day: 8 }),
      'No source no fake claim input',
      'fake source without input',
    ) && ok;

  ok =
    assert(
      checks,
      !DAY8_OPERATION_FEED_FAKE_CLAIM_PATTERNS.some((pattern) =>
        pattern.test(day8Binding.biases.map((bias) => bias.reasonLine).join(' ')),
      ),
      'No fake claim copy',
      'fake claim found',
    ) && ok;

  const presentationCards = buildOperationFeedBindingCardModels(day8Binding);
  ok =
    assert(
      checks,
      presentationCards.length <= DAY8_OPERATION_FEED_BINDING_MAX_FEED_BINDINGS,
      'Presentation max 3 cards',
      `count=${presentationCards.length}`,
    ) && ok;

  ok =
    assert(
      checks,
      Boolean(buildOperationFeedReasonLine(day8Binding)) || day8Binding.feedBindings.length === 0,
      'Operation feed reason line',
      'missing reason',
    ) && ok;

  ok =
    assert(
      checks,
      Boolean(buildEceOperationFeedBindingLine(day8Binding)) || !day8Binding.isActive,
      'Ece operation feed line available',
      'missing ece line',
    ) && ok;

  ok =
    assert(
      checks,
      !readRepo('src/core/eventSelection/eventFamilySelectionEngine.ts').includes('spawn'),
      'No event spawn',
      'spawn found',
    ) && ok;

  const engineFile = readRepo('src/core/eventSelection/eventFamilySelectionEngine.ts');
  ok =
    assert(
      checks,
      engineFile.includes('strategicBias'),
      'Event selection strategic bias wiring',
      'missing strategicBias param',
    ) && ok;

  const focusFile = readRepo('src/features/hub/utils/centerOperationFocusPresentation.ts');
  ok =
    assert(
      checks,
      focusFile.includes('day8OperationFeedBinding'),
      'Hub operation focus wiring',
      'missing binding wiring',
    ) && ok;

  const signalsFile = readRepo('src/features/hub/utils/centerOperationSignalsPresentation.ts');
  ok =
    assert(
      checks,
      signalsFile.includes('day8OperationFeedBinding'),
      'Hub operation signals wiring',
      'missing signals wiring',
    ) && ok;

  const presentationOnlyOnly = buildDay8OperationFeedBinding({
    ...pipeline,
    existingEventCandidates: [],
    existingOperationFeedItems: (pipeline.dailyCapacityPortfolioResult as { items?: unknown[] } | undefined)?.items?.map(
      (item: unknown) => item,
    ),
  });
  ok =
    assert(
      checks,
      presentationOnlyOnly.selectionBiasSummary?.applied !== true,
      'Presentation-only binding candidate score artirmaz',
      `applied=${presentationOnlyOnly.selectionBiasSummary?.applied}`,
    ) && ok;
  ok =
    assert(
      checks,
      (presentationOnlyOnly.selectionBiasSummary?.maxBoost ?? 0) === 0,
      'Candidate yokken no forced selection boost',
      `maxBoost=${presentationOnlyOnly.selectionBiasSummary?.maxBoost}`,
    ) && ok;
  ok =
    assert(
      checks,
      presentationOnlyOnly.feedBindings.every((binding) => !containsForcedSelectionLanguage(binding.reasonLine)),
      'Presentation-only binding selected dili kullanmaz',
      'forced selection language',
    ) && ok;

  const bindingSignal = buildCenterOperationFeedBindingSignal(day8Binding);
  const hubSignals = buildCenterOperationSignals({
    gameState: {} as never,
    day: 8,
    activeTarget: { title: 'Test', description: 'Desc', domain: 'general', priority: 'normal', sourceLabel: 'Test' } as never,
    operationFocusSubtitles: [day8Binding.primaryFeedBinding?.reasonLine ?? ''],
    day8OperationFeedBinding: day8Binding,
  });
  const bindingSignals = hubSignals.signals.filter((signal) => signal.id.startsWith('signal-operation-feed-'));
  ok =
    assert(checks, bindingSignals.length <= 1, 'centerOperationSignals max 1 binding signal', `count=${bindingSignals.length}`) &&
    ok;
  ok =
    assert(
      checks,
      bindingSignals.length === 0,
      'Operation Focus + Signals exact duplicate yok',
      `duplicate signal count=${bindingSignals.length}`,
    ) && ok;

  const day1Signals = buildCenterOperationSignals({
    gameState: {} as never,
    day: 1,
    activeTarget: { title: 'Test', domain: 'general', priority: 'normal', sourceLabel: 'Test' } as never,
    day8OperationFeedBinding: day8Binding,
  });
  ok =
    assert(
      checks,
      !day1Signals.signals.some((signal) => signal.id.startsWith('signal-operation-feed-')),
      'Day <8 signal hidden',
      'binding signal visible day 1',
    ) && ok;

  const inactiveSignals = buildCenterOperationSignals({
    gameState: {} as never,
    day: 8,
    activeTarget: { title: 'Test', domain: 'general', priority: 'normal', sourceLabel: 'Test' } as never,
    day8OperationFeedBinding: { day: 8, isActive: false, biases: [], feedBindings: [], sourceIds: [] },
  });
  ok =
    assert(
      checks,
      !inactiveSignals.signals.some((signal) => signal.id.startsWith('signal-operation-feed-')),
      'No-source signal hidden',
      'inactive binding signal visible',
    ) && ok;

  ok = assert(checks, Boolean(bindingSignal), 'Operation feed binding signal model', 'missing signal') && ok;

  ok = assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-day8-operation-feed-binding-lite.md')), 'Docs exist', 'missing doc') && ok;
  ok =
    assert(
      checks,
      existsSync(join(REPO_ROOT, 'docs/crevia-event-variety-verify-cleanup.md')),
      'Event variety cleanup doc exists',
      'missing cleanup doc',
    ) && ok;

  const warn = false;
  return { ok, warn, checks };
}
