import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';

import {
  buildDailyCapacityPortfolio,
  buildEcePortfolioLine,
  computeDeferRisk,
  computePortfolioCapacityCost,
} from './dailyCapacityPortfolioModel';
import {
  buildDailyCapacityPortfolioSummaryCard,
  buildOperationPortfolioCardModels,
} from './dailyCapacityPortfolioPresentation';
import {
  DAILY_CAPACITY_BANDS,
  DAILY_CAPACITY_KINDS,
  DAILY_CAPACITY_MODES,
  DAILY_CAPACITY_SOURCE_KINDS,
  OPERATION_PORTFOLIO_DEFER_RISKS,
  OPERATION_PORTFOLIO_ITEM_KINDS,
  OPERATION_PORTFOLIO_ITEM_STATUSES,
  OPERATION_PORTFOLIO_OPPORTUNITY_VALUES,
  OPERATION_PORTFOLIO_PRESSURE_LEVELS,
  OPERATION_PORTFOLIO_URGENCIES,
  type DailyCapacityPortfolioInput,
  type OperationPortfolioItem,
} from './dailyCapacityPortfolioTypes';
import {
  PORTFOLIO_COST_MAX,
  PORTFOLIO_MAX_CARD_MODELS,
  PORTFOLIO_MAX_SELECTED_ITEMS_DAY8,
  PORTFOLIO_MAX_VISIBLE_ITEMS,
} from './dailyCapacityPortfolioConstants';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = 27;

export type VerifyDailyCapacityPortfolioOutcome = {
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

function warn(checks: string[], pass: boolean, ok: string, warning: string): boolean {
  checks.push(pass ? `PASS ${ok}` : `WARN ${warning}`);
  return pass;
}

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

function makeEvent(id: string, title: string, district = 'Merkez', neighborhoodId = 'merkez') {
  return { id, title, district, neighborhoodId, day: 8 };
}

function makePersonalityProfile(
  districtId: string,
  districtName: string,
  highs: string[],
) {
  return {
    districtId,
    districtName,
    sourceIds: [`personality_${districtId}`],
    criteria: highs.map((id) => ({
      id,
      band: 'high',
      score: 78,
      label: id,
      gameplayMeaning: id,
      sourceKinds: ['district_identity'],
      sourceIds: [`criterion_${districtId}_${id}`],
    })),
  };
}

function makeVarietyProfile(eventId: string, primaryPressure: string, line: string) {
  return {
    eventId,
    primaryPressure,
    secondaryPressures: [],
    playerFacingLine: line,
    sourceIds: [eventId],
    sourceLabel: 'Event variety',
  };
}

function makeTomorrowRisk(id: string, title: string, domain: string) {
  return {
    id,
    title,
    mainLine: 'Yarin rota baskisi buyuyebilir.',
    priority: 'high',
    relatedDomain: domain,
    sourceSignals: ['operation_signals'],
    tone: 'risk',
  };
}

function makeConsequenceThread(id: string, type: string) {
  return {
    id,
    title: 'Karar izi',
    summary: 'Onceki mudahale bolgede iz birakti.',
    causalLine: 'Takip gerekebilir.',
    consequenceType: type,
    strength: 'medium',
    timeScope: 'next_day',
    sourceIds: [id],
  };
}

const DAY8_INPUT: DailyCapacityPortfolioInput = {
  day: 8,
  activeEvents: [
    makeEvent('event_a', 'Rota daralmasi', 'Sanayi', 'sanayi'),
    makeEvent('event_b', 'Konteyner gecikmesi', 'Cumhuriyet', 'cumhuriyet'),
  ],
  operationSignals: {
    priorityDistrictId: 'sanayi',
    vehicles: {
      domain: 'vehicles',
      status: 'strained',
      score: 68,
      title: 'Arac rotasi geriliyor',
      summary: 'Rota destegi sinirli.',
      sourceTags: ['vehicle_route'],
    },
    containers: {
      domain: 'containers',
      status: 'watch',
      score: 52,
      title: 'Konteyner hatti izleniyor',
      summary: 'Hat yogun.',
      sourceTags: ['container_network'],
    },
    districts: {
      domain: 'districts',
      status: 'strained',
      score: 61,
      title: 'Bolge dengesi',
      summary: 'Guven baskisi gorunur.',
      sourceTags: ['district_trust'],
    },
    personnel: { domain: 'personnel', status: 'stable', score: 40, title: 'Ekip', summary: 'Dengeli', sourceTags: [] },
    overall: { domain: 'overall', status: 'watch', score: 55, title: 'Genel', summary: 'Izleniyor', sourceTags: [] },
  },
  districtPersonalityProfiles: [
    makePersonalityProfile('sanayi', 'Sanayi', ['route_difficulty', 'social_sensitivity']),
    makePersonalityProfile('cumhuriyet', 'Cumhuriyet', ['container_density', 'recovery_potential']),
  ],
  eventGameplayVarietyProfiles: [
    makeVarietyProfile('event_a', 'route_pressure', 'Rota baskisi belirgin.'),
    makeVarietyProfile('event_b', 'container_network_pressure', 'Konteyner agi yogun.'),
  ],
  tomorrowRiskSignals: [makeTomorrowRisk('risk_route', 'Yarin rota riski', 'route')],
  decisionConsequenceThreads: [makeConsequenceThread('cons_1', 'district_memory')],
  resourceSignals: { id: 'resource_1', title: 'Kaynak baskisi', summary: 'Malzeme daraliyor.', score: 64 },
  rewardComebackSignals: {
    id: 'comeback_1',
    title: 'Toparlanma penceresi',
    summary: 'Cumhuriyette iyilesme firsati.',
    tone: 'recovery',
    districtId: 'cumhuriyet',
    sourceIds: ['comeback_1'],
  },
  authorityPermissionIds: ['tomorrow_risk_preview', 'resource_pressure_summary'],
};

function validateItem(checks: string[], item: OperationPortfolioItem): boolean {
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, OPERATION_PORTFOLIO_ITEM_KINDS.includes(item.kind), `${item.id} kind`, `${item.id} invalid kind`));
  record(assert(checks, OPERATION_PORTFOLIO_ITEM_STATUSES.includes(item.status), `${item.id} status`, `${item.id} invalid status`));
  record(assert(checks, OPERATION_PORTFOLIO_PRESSURE_LEVELS.includes(item.pressureLevel), `${item.id} pressure`, `${item.id} invalid pressure`));
  record(assert(checks, OPERATION_PORTFOLIO_URGENCIES.includes(item.urgency), `${item.id} urgency`, `${item.id} invalid urgency`));
  record(assert(checks, OPERATION_PORTFOLIO_OPPORTUNITY_VALUES.includes(item.opportunityValue), `${item.id} opportunity`, `${item.id} invalid opportunity`));
  record(assert(checks, OPERATION_PORTFOLIO_DEFER_RISKS.includes(item.deferRisk), `${item.id} deferRisk`, `${item.id} invalid deferRisk`));
  record(assert(checks, unique(item.sourceIds), `${item.id} sourceIds unique`, `${item.id} duplicate sourceIds`));
  record(assert(checks, item.priority >= 0 && item.priority <= 100, `${item.id} priority clamp`, `${item.id} priority out of range`));
  record(
    assert(
      checks,
      item.sourceKinds.every((kind) => DAILY_CAPACITY_SOURCE_KINDS.includes(kind)),
      `${item.id} sourceKinds`,
      `${item.id} invalid sourceKinds`,
    ),
  );

  const costs = Object.values(item.capacityCost);
  record(assert(checks, costs.every((value) => value >= 0 && value <= PORTFOLIO_COST_MAX), `${item.id} cost clamp`, `${item.id} invalid cost`));

  if (item.deferRisk === 'pressure_may_grow' || item.deferRisk === 'route_may_strain') {
    const hasSource =
      item.sourceKinds.includes('tomorrow_risk') ||
      item.sourceKinds.includes('operation_signals') ||
      item.sourceKinds.includes('decision_consequence');
    record(assert(checks, hasSource || Boolean(item.deferRiskLine), `${item.id} defer source`, `${item.id} fake defer risk`));
  }

  if (item.isMapRecommended) {
    const hasSpatial =
      item.sourceKinds.includes('map_gameplay_binding') ||
      item.sourceKinds.includes('active_operation_map_binding');
    record(assert(checks, hasSpatial, `${item.id} map source`, `${item.id} map without spatial source`));
  }

  if (item.visibilityLevel === 'detailed') {
    const hasPermissionContext = item.sourceIds.length > 0 && !item.sourceKinds.includes('fallback');
    record(assert(checks, hasPermissionContext, `${item.id} detailed guard`, `${item.id} detailed without source`));
  }

  return ok;
}

export function verifyDailyCapacityPortfolioScenario(): VerifyDailyCapacityPortfolioOutcome {
  const checks: string[] = [];
  let ok = true;
  let warnState = false;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };
  const recordWarn = (pass: boolean) => {
    if (!pass) warnState = true;
  };

  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION 27', `SAVE_VERSION ${SAVE_VERSION}`));

  const gameStore = readRepo('src/store/useGameStore.ts');
  record(assert(checks, !gameStore.includes('dailyCapacityPortfolio'), 'useGameStore not wired', 'useGameStore wired early'));

  const day1 = buildDailyCapacityPortfolio({ day: 1, activeEvents: [makeEvent('d1', 'Ilk operasyon')] });
  const day1Visible = day1.items.filter((item) => item.visibilityLevel !== 'hidden');
  record(assert(checks, day1.summary.mode === 'tutorial', 'day1 tutorial mode', `day1 mode ${day1.summary.mode}`));
  record(assert(checks, day1.summary.operationSlotLimit === 1, 'day1 slot limit 1', `day1 slots ${day1.summary.operationSlotLimit}`));
  record(assert(checks, day1Visible.length <= 2, 'day1 low noise', `day1 visible ${day1Visible.length}`));
  record(assert(checks, day1.selectedItems.length <= 1, 'day1 selected max 1', `day1 selected ${day1.selectedItems.length}`));

  const day8 = buildDailyCapacityPortfolio(DAY8_INPUT);
  const day8Visible = day8.items.filter((item) => item.visibilityLevel !== 'hidden');
  record(assert(checks, day8.summary.mode === 'post_pilot_light', 'day8 post_pilot_light', `day8 mode ${day8.summary.mode}`));
  record(assert(checks, day8.summary.operationSlotLimit === 2, 'day8 slot limit 2', `day8 slots ${day8.summary.operationSlotLimit}`));
  record(assert(checks, day8.selectedItems.length <= PORTFOLIO_MAX_SELECTED_ITEMS_DAY8, 'day8 selected max 2', `day8 selected ${day8.selectedItems.length}`));
  record(assert(checks, day8Visible.length <= PORTFOLIO_MAX_VISIBLE_ITEMS, 'day8 visible max 4', `day8 visible ${day8Visible.length}`));
  recordWarn(warn(checks, day8Visible.length >= 3, 'day8 has 3+ visible', `day8 only ${day8Visible.length} visible`));

  const day10 = buildDailyCapacityPortfolio({
    ...DAY8_INPUT,
    day: 10,
    authorityPermissionIds: [
      'tomorrow_risk_preview',
      'resource_pressure_summary',
      'district_trust_preview',
      'district_memory_trace_preview',
      'assignment_fit_preview',
      'map_resource_layer',
    ],
  });
  record(assert(checks, day10.summary.mode === 'post_pilot_strategic', 'day10 strategic mode', `day10 mode ${day10.summary.mode}`));

  for (const entry of day8.summary.capacityEntries) {
    record(assert(checks, DAILY_CAPACITY_KINDS.includes(entry.kind), `${entry.kind} capacity kind`, `invalid capacity kind ${entry.kind}`));
    record(assert(checks, DAILY_CAPACITY_BANDS.includes(entry.band), `${entry.kind} band`, `invalid band ${entry.band}`));
    record(
      assert(
        checks,
        entry.available >= 0 &&
          entry.used >= 0 &&
          entry.reserved >= 0 &&
          entry.remaining >= 0,
        `${entry.kind} non-negative capacity`,
        `${entry.kind} negative capacity`,
      ),
    );
  }

  record(assert(checks, unique(day8.items.map((item) => item.id)), 'item ids unique', 'duplicate item ids'));
  record(assert(checks, unique(day8.sourceIds), 'result sourceIds unique', 'duplicate result sourceIds'));
  record(assert(checks, DAILY_CAPACITY_MODES.includes(day8.summary.mode), 'summary mode enum', 'invalid summary mode'));

  for (const item of day8.items) {
    record(validateItem(checks, item));
  }

  const cards = buildOperationPortfolioCardModels(day8);
  const summaryCard = buildDailyCapacityPortfolioSummaryCard(day8);
  record(assert(checks, cards.length <= PORTFOLIO_MAX_CARD_MODELS, 'card models max 4', `cards ${cards.length}`));
  record(assert(checks, !cards.some((card) => card.accessibilityLabel.trim().length === 0), 'accessibility labels', 'empty accessibility'));
  record(assert(checks, summaryCard.accessibilityLabel.trim().length > 0, 'summary accessibility', 'empty summary accessibility'));

  const hiddenCards = buildOperationPortfolioCardModels({
    ...day8,
    items: day8.items.map((item) => ({ ...item, visibilityLevel: 'hidden' })),
  });
  record(assert(checks, hiddenCards.length === 0, 'hidden items no cards', `hidden produced ${hiddenCards.length} cards`));

  const eceLines = [buildEcePortfolioLine(day8), buildEcePortfolioLine(day1)].filter(Boolean);
  record(assert(checks, eceLines.length <= 2, 'ece line bounded', 'too many ece lines'));

  for (const card of cards) {
    record(assert(checks, card.title.length <= 44, `${card.id} title length`, `${card.id} title too long`));
    record(assert(checks, card.decisionLine.length <= 96, `${card.id} decision length`, `${card.id} decision too long`));
    record(assert(checks, !/operation_slots|post_pilot_event_quota/.test(card.decisionLine), `${card.id} no technical enum`, `${card.id} technical enum leaked`));
  }

  const noPermission = buildDailyCapacityPortfolio({ ...DAY8_INPUT, authorityPermissionIds: [] });
  const detailedWithoutPermission = noPermission.items.some((item) => item.visibilityLevel === 'detailed');
  record(assert(checks, !detailedWithoutPermission, 'no detailed without permission', 'detailed without permission'));

  const draftCost = computePortfolioCapacityCost(
    {
      id: 'test',
      kind: 'route_pressure',
      title: 't',
      pressureLevel: 'medium',
      urgency: 'medium',
      opportunityValue: 'none',
      deferRisk: 'none',
      recommendedReason: 'r',
      sourceIds: ['a'],
      sourceKinds: ['operation_signals'],
      confidence: 'medium',
      isActionable: true,
      isMapRecommended: false,
      isFollowUp: false,
      isSelectedCandidate: false,
      isWatchOnlyCandidate: false,
      isLockedCandidate: false,
      hasTomorrowRiskSource: false,
      hasTrustSource: false,
      hasResourceSource: false,
      hasRouteSource: true,
      hasSocialSource: false,
      hasOpportunitySource: false,
      hasMemorySource: false,
      districtCriterionHigh: ['route_difficulty', 'social_sensitivity'],
    },
    8,
  );
  record(assert(checks, draftCost.vehicle >= 2, 'district modifier vehicle', 'vehicle modifier missing'));

  const defer = computeDeferRisk({
    id: 'test',
    kind: 'risk_signal',
    title: 't',
    pressureLevel: 'high',
    urgency: 'high',
    opportunityValue: 'none',
    deferRisk: 'none',
    recommendedReason: 'r',
    sourceIds: ['risk'],
    sourceKinds: ['tomorrow_risk'],
    confidence: 'high',
    isActionable: true,
    isMapRecommended: false,
    isFollowUp: false,
    isSelectedCandidate: false,
    isWatchOnlyCandidate: false,
    isLockedCandidate: false,
    hasTomorrowRiskSource: true,
    hasTrustSource: false,
    hasResourceSource: false,
    hasRouteSource: true,
    hasSocialSource: false,
    hasOpportunitySource: false,
    hasMemorySource: false,
  });
  record(assert(checks, defer === 'route_may_strain', 'defer risk from tomorrow', `defer ${defer}`));

  const moduleFiles = [
    'src/core/dailyCapacityPortfolio/dailyCapacityPortfolioTypes.ts',
    'src/core/dailyCapacityPortfolio/dailyCapacityPortfolioConstants.ts',
    'src/core/dailyCapacityPortfolio/dailyCapacityPortfolioModel.ts',
    'src/core/dailyCapacityPortfolio/dailyCapacityPortfolioPresentation.ts',
    'src/core/dailyCapacityPortfolio/dailyCapacityPortfolioSourceAdapters.ts',
    'src/core/dailyCapacityPortfolio/verifyDailyCapacityPortfolioScenario.ts',
    'src/core/dailyCapacityPortfolio/index.ts',
    'scripts/verify-daily-capacity-portfolio.ts',
    'scripts/analyze-daily-capacity-portfolio.ts',
    'docs/crevia-daily-capacity-portfolio-model-pass.md',
  ];
  for (const file of moduleFiles) {
    record(assert(checks, existsSync(join(REPO_ROOT, file)), `${file} exists`, `${file} missing`));
  }

  return { ok, warn: warnState, checks };
}
