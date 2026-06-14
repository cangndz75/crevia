/**
 * Resource Pressure Balance Audit — read-only analyzer.
 * Calistir: npm run analyze:resource-pressure-balance
 */

import {
  buildDailyCapacityPortfolio,
  computePortfolioCapacityCost,
} from '../src/core/dailyCapacityPortfolio/dailyCapacityPortfolioModel';
import {
  PORTFOLIO_BASE_COSTS,
  DETAILED_PORTFOLIO_PERMISSION_IDS,
} from '../src/core/dailyCapacityPortfolio/dailyCapacityPortfolioConstants';
import type {
  DailyCapacityPortfolioInput,
  OperationPortfolioCapacityCost,
  OperationPortfolioItemKind,
} from '../src/core/dailyCapacityPortfolio/dailyCapacityPortfolioTypes';
import type { PortfolioAdapterDraft } from '../src/core/dailyCapacityPortfolio/dailyCapacityPortfolioSourceAdapters';

type Scenario = {
  label: string;
  input: DailyCapacityPortfolioInput;
};

function event(id: string, title: string, district: string, neighborhoodId: string) {
  return { id, title, district, neighborhoodId };
}

function personality(districtId: string, districtName: string, highs: string[]) {
  return {
    districtId,
    districtName,
    sourceIds: [`personality_${districtId}`],
    criteria: highs.map((id) => ({
      id,
      band: 'high',
      score: 75,
      label: id,
      gameplayMeaning: id,
      sourceKinds: ['district_identity'],
      sourceIds: [`c_${districtId}_${id}`],
    })),
  };
}

const scenarios: Scenario[] = [
  { label: 'Day 1', input: { day: 1, activeEvents: [event('e1', 'Ilk operasyon', 'Merkez', 'merkez')] } },
  { label: 'Day 3', input: { day: 3, activeEvents: [event('e3', 'Saha mudahalesi', 'Merkez', 'merkez')] } },
  { label: 'Day 7', input: { day: 7, activeEvents: [event('e7', 'Pilot kapanisi', 'Sanayi', 'sanayi')] } },
  {
    label: 'Day 8',
    input: {
      day: 8,
      activeEvents: [
        event('e8a', 'Rota daralmasi', 'Sanayi', 'sanayi'),
        event('e8b', 'Konteyner gecikmesi', 'Cumhuriyet', 'cumhuriyet'),
      ],
      operationSignals: {
        priorityDistrictId: 'sanayi',
        vehicles: { status: 'strained', score: 70, title: 'Rota gerilimi', summary: 'Arac rotasi zorlaniyor.', sourceTags: ['route'] },
        containers: { status: 'watch', score: 50, title: 'Konteyner', summary: 'Hat izleniyor.', sourceTags: [] },
        districts: { status: 'strained', score: 62, title: 'Bolge', summary: 'Guven baskisi.', sourceTags: ['trust'] },
        personnel: { status: 'stable', score: 40, title: 'Ekip', summary: 'Dengeli', sourceTags: [] },
        overall: { status: 'watch', score: 55, title: 'Genel', summary: 'Izleniyor', sourceTags: [] },
      },
      districtPersonalityProfiles: [
        personality('sanayi', 'Sanayi', ['route_difficulty', 'social_sensitivity']),
        personality('cumhuriyet', 'Cumhuriyet', ['container_density']),
      ],
      tomorrowRiskSignals: [{ id: 'tr1', title: 'Yarin rota riski', mainLine: 'Rota baskisi buyuyebilir.', priority: 'high', relatedDomain: 'route', sourceSignals: ['operation_signals'] }],
      authorityPermissionIds: ['tomorrow_risk_preview'],
    },
  },
  {
    label: 'Day 10',
    input: {
      day: 10,
      activeEvents: [event('e10', 'Stratejik operasyon', 'Istasyon', 'istasyon')],
      operationSignals: {
        priorityDistrictId: 'istasyon',
        vehicles: { status: 'critical', score: 78, title: 'Rota kritik', summary: 'Acil rota destegi.', sourceTags: ['route'] },
        containers: { status: 'strained', score: 66, title: 'Konteyner', summary: 'Hat yogun.', sourceTags: ['container'] },
        districts: { status: 'strained', score: 60, title: 'Bolge', summary: 'Guven izleniyor.', sourceTags: [] },
        personnel: { status: 'watch', score: 48, title: 'Ekip', summary: 'Yorgunluk.', sourceTags: [] },
        overall: { status: 'strained', score: 65, title: 'Genel', summary: 'Baski var.', sourceTags: [] },
      },
      districtPersonalityProfiles: [personality('istasyon', 'Istasyon', ['trust_fragility', 'recovery_potential'])],
      resourceSignals: { id: 'res10', title: 'Kaynak baskisi', summary: 'Malzeme daraliyor.', score: 72 },
      rewardComebackSignals: { id: 'rc10', title: 'Toparlanma', summary: 'Iyilesme penceresi acik.', tone: 'recovery', sourceIds: ['rc10'] },
      authorityPermissionIds: ['resource_pressure_summary', 'tomorrow_risk_preview', 'district_trust_preview'],
    },
  },
  {
    label: 'Route-heavy day',
    input: {
      day: 9,
      operationSignals: {
        priorityDistrictId: 'sanayi',
        vehicles: { status: 'critical', score: 80, title: 'Rota kritik', summary: 'Rota destegi sinirli.', sourceTags: ['route'] },
        personnel: { status: 'stable', score: 30, title: 'Ekip', summary: 'OK', sourceTags: [] },
        containers: { status: 'stable', score: 30, title: 'Konteyner', summary: 'OK', sourceTags: [] },
        districts: { status: 'stable', score: 30, title: 'Bolge', summary: 'OK', sourceTags: [] },
        overall: { status: 'watch', score: 55, title: 'Genel', summary: 'Izleniyor', sourceTags: [] },
      },
      eventGameplayVarietyProfiles: [{ eventId: 'ev_r', primaryPressure: 'route_pressure', secondaryPressures: [], playerFacingLine: 'Rota baskisi.', sourceIds: ['ev_r'], sourceLabel: 'variety' }],
      vehicleMaintenanceSignals: { id: 'vm1', title: 'Bakim uyarisi', summary: 'Filo yorgun.', score: 72 },
      districtPersonalityProfiles: [personality('sanayi', 'Sanayi', ['route_difficulty', 'maintenance_exposure'])],
    },
  },
  {
    label: 'Social-heavy day',
    input: {
      day: 9,
      districtPersonalityProfiles: [personality('cumhuriyet', 'Cumhuriyet', ['social_sensitivity', 'trust_fragility'])],
      socialPulseSignals: { id: 'sp1', title: 'Sosyal tepki', summary: 'Mahalle hassas.', score: 74 },
      districtTrustSignals: { id: 'dt1', title: 'Guven baskisi', summary: 'Guven kirilgan.', score: 68 },
    },
  },
  {
    label: 'Container-heavy day',
    input: {
      day: 9,
      operationSignals: {
        priorityDistrictId: 'yesilvadi',
        containers: { status: 'critical', score: 82, title: 'Konteyner kritik', summary: 'Hat yogun.', sourceTags: ['container'] },
        vehicles: { status: 'stable', score: 35, title: 'Arac', summary: 'Stabil', sourceTags: [] },
        personnel: { status: 'stable', score: 35, title: 'Ekip', summary: 'Stabil', sourceTags: [] },
        districts: { status: 'stable', score: 35, title: 'Bolge', summary: 'Stabil', sourceTags: [] },
        overall: { status: 'watch', score: 50, title: 'Genel', summary: 'Izleniyor', sourceTags: [] },
      },
      districtPersonalityProfiles: [personality('yesilvadi', 'Yesilvadi', ['container_density', 'resource_dependency'])],
      resourceSignals: { id: 'res_c', title: 'Kaynak baskisi', summary: 'Stok daraliyor.', score: 70 },
    },
  },
  {
    label: 'Recovery opportunity day',
    input: {
      day: 9,
      rewardComebackSignals: { id: 'rc', title: 'Toparlanma firsati', summary: 'Mahalle toparlaniyor.', tone: 'recovery', sourceIds: ['rc'] },
      districtPersonalityProfiles: [personality('merkez', 'Merkez', ['recovery_potential'])],
      eventGameplayVarietyProfiles: [{ eventId: 'ev_o', primaryPressure: 'opportunity_window', secondaryPressures: [], playerFacingLine: 'Pozitif firsat.', sourceIds: ['ev_o'], sourceLabel: 'variety' }],
    },
  },
  { label: 'Low-data fallback', input: { day: 8 } },
];

function costSignature(cost: OperationPortfolioCapacityCost): string {
  return [
    cost.operationSlots,
    cost.team,
    cost.vehicle,
    cost.resource,
    cost.social,
    cost.districtFocus,
    cost.followUp,
  ].join('/');
}

function dominantDimension(cost: OperationPortfolioCapacityCost): string {
  const entries: Array<[string, number]> = [
    ['operationSlots', cost.operationSlots],
    ['team', cost.team],
    ['vehicle', cost.vehicle],
    ['resource', cost.resource],
    ['social', cost.social],
    ['districtFocus', cost.districtFocus],
    ['followUp', cost.followUp],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]?.[1] ? entries[0][0] : 'none';
}

function pressureKindBucket(kind: string): string {
  if (kind.includes('route') || kind === 'maintenance_warning') return 'route_vehicle';
  if (kind.includes('resource') || kind === 'container_pressure') return 'resource_container';
  if (kind.includes('social') || kind === 'district_pressure') return 'social_trust';
  if (kind.includes('opportunity')) return 'opportunity';
  if (kind === 'memory_trace' || kind === 'follow_up_candidate') return 'memory_followup';
  if (kind === 'risk_signal') return 'risk_watch';
  return 'operation';
}

function analyzeBaseCostDiversity(): {
  uniqueVectors: number;
  totalKinds: number;
  score: number;
  duplicatePairs: string[];
} {
  const kinds = Object.keys(PORTFOLIO_BASE_COSTS) as OperationPortfolioItemKind[];
  const signatures = new Map<string, OperationPortfolioItemKind[]>();
  for (const kind of kinds) {
    const sig = costSignature(PORTFOLIO_BASE_COSTS[kind]);
    const list = signatures.get(sig) ?? [];
    list.push(kind);
    signatures.set(sig, list);
  }
  const duplicatePairs = [...signatures.values()]
    .filter((group) => group.length > 1)
    .map((group) => group.join(' = '));
  const uniqueVectors = signatures.size;
  const totalKinds = kinds.length;
  const score = Math.round((uniqueVectors / totalKinds) * 100);
  return { uniqueVectors, totalKinds, score, duplicatePairs };
}

function averageCostByDimension(items: Array<{ capacityCost: OperationPortfolioCapacityCost }>) {
  const keys: Array<keyof OperationPortfolioCapacityCost> = [
    'operationSlots',
    'team',
    'vehicle',
    'resource',
    'social',
    'districtFocus',
    'followUp',
  ];
  const totals: Record<string, number> = {};
  for (const key of keys) totals[key] = 0;
  if (items.length === 0) return totals;
  for (const item of items) {
    for (const key of keys) totals[key] += item.capacityCost[key];
  }
  for (const key of keys) totals[key] = Math.round((totals[key] / items.length) * 100) / 100;
  return totals;
}

function authorityCoverage(items: Array<{ visibilityLevel: string; kind: string }>, permissions: string[]): string[] {
  const permSet = new Set(permissions);
  const covered: string[] = [];
  for (const perm of DETAILED_PORTFOLIO_PERMISSION_IDS) {
    const hasPerm = permSet.has(perm);
    const hasDetailed = items.some((item) => item.visibilityLevel === 'detailed');
    if (hasPerm && hasDetailed) covered.push(perm);
  }
  return covered;
}

const baseDiversity = analyzeBaseCostDiversity();
let hasWarn = false;
let hasFail = false;

// eslint-disable-next-line no-console
console.log('=== Resource Pressure Balance Analyzer ===\n');
// eslint-disable-next-line no-console
console.log(`Base cost diversity: ${baseDiversity.uniqueVectors}/${baseDiversity.totalKinds} unique vectors (${baseDiversity.score}%)`);
if (baseDiversity.duplicatePairs.length > 0) {
  // eslint-disable-next-line no-console
  console.log(`Duplicate vectors: ${baseDiversity.duplicatePairs.join('; ')}`);
}
if (baseDiversity.score < 70) {
  // eslint-disable-next-line no-console
  console.log('WARN cost diversity low (base vectors)');
  hasWarn = true;
}

for (const kind of Object.keys(PORTFOLIO_BASE_COSTS) as OperationPortfolioItemKind[]) {
  const cost = PORTFOLIO_BASE_COSTS[kind];
  const values = Object.values(cost);
  if (values.some((v) => v < 0)) {
    // eslint-disable-next-line no-console
    console.log(`FAIL negative cost in ${kind}`);
    hasFail = true;
  }
}

for (const scenario of scenarios) {
  const result = buildDailyCapacityPortfolio(scenario.input);
  const visible = result.items.filter((item) => item.visibilityLevel !== 'hidden');
  const opportunityCount = visible.filter((item) => item.kind.includes('opportunity')).length;
  const opportunityRatio = visible.length > 0 ? opportunityCount / visible.length : 0;

  const kindCounts = new Map<string, number>();
  for (const item of visible) {
    const bucket = pressureKindBucket(item.kind);
    kindCounts.set(bucket, (kindCounts.get(bucket) ?? 0) + 1);
  }
  let dominantBucket = 'none';
  let dominantShare = 0;
  for (const [bucket, count] of kindCounts) {
    const share = count / Math.max(visible.length, 1);
    if (share > dominantShare) {
      dominantShare = share;
      dominantBucket = bucket;
    }
  }

  const districtCounts = new Map<string, number>();
  for (const item of visible) {
    const key = item.districtId ?? 'city';
    districtCounts.set(key, (districtCounts.get(key) ?? 0) + 1);
  }
  const maxDistrictShare =
    visible.length > 0
      ? Math.max(...[...districtCounts.values()].map((c) => c / visible.length))
      : 0;

  const signatures = new Set(visible.map((item) => costSignature(item.capacityCost)));
  const scenarioDiversityScore =
    visible.length > 0 ? Math.round((signatures.size / visible.length) * 100) : 0;

  const avgCost = averageCostByDimension(visible);
  const maxCostItem = [...visible].sort((a, b) => {
    const sumA = Object.values(a.capacityCost).reduce((s, v) => s + v, 0);
    const sumB = Object.values(b.capacityCost).reduce((s, v) => s + v, 0);
    return sumB - sumA;
  })[0];

  const permissions = scenario.input.authorityPermissionIds ?? [];
  const authCovered = authorityCoverage(visible, permissions);
  const fairnessWarnings: string[] = [];
  if (visible.some((item) => item.deferRisk !== 'none' && !item.deferRiskLine && item.visibilityLevel !== 'detailed')) {
    fairnessWarnings.push('defer_risk_without_line');
  }
  if (visible.length > 0 && visible.every((item) => !item.kind.includes('opportunity') && item.pressureLevel !== 'low')) {
    fairnessWarnings.push('all_risk_no_opportunity');
  }

  // eslint-disable-next-line no-console
  console.log(`\n--- ${scenario.label} (Day ${scenario.input.day}) ---`);
  // eslint-disable-next-line no-console
  console.log(`visible: ${visible.length} | deferred: ${result.deferredItems.length} | strategic: ${result.summary.hasStrategicPressure}`);
  // eslint-disable-next-line no-console
  console.log(`cost diversity: ${scenarioDiversityScore}% | opportunity ratio: ${Math.round(opportunityRatio * 100)}%`);
  // eslint-disable-next-line no-console
  console.log(`dominant pressure: ${dominantBucket} (${Math.round(dominantShare * 100)}%)`);
  // eslint-disable-next-line no-console
  console.log(`avg cost: slot=${avgCost.operationSlots} team=${avgCost.team} vehicle=${avgCost.vehicle} resource=${avgCost.resource} social=${avgCost.social}`);
  if (maxCostItem) {
    // eslint-disable-next-line no-console
    console.log(`max cost: ${maxCostItem.kind} [${costSignature(maxCostItem.capacityCost)}] ${maxCostItem.title}`);
  }
  if (maxDistrictShare > 0.75 && visible.length >= 3) {
    // eslint-disable-next-line no-console
    console.log(`WARN same district concentration ${Math.round(maxDistrictShare * 100)}%`);
    hasWarn = true;
  }
  if (fairnessWarnings.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`fairness: ${fairnessWarnings.join(', ')}`);
  }
  if (permissions.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`authority detailed coverage: ${authCovered.length}/${permissions.length} permissions`);
  }

  if (scenario.input.day >= 8 && visible.length < 3 && scenario.label !== 'Low-data fallback') {
    // eslint-disable-next-line no-console
    console.log('WARN Day 8+ fewer than 3 visible items');
    hasWarn = true;
  }
  if (scenario.label === 'Low-data fallback' && visible.length === 0) {
    // eslint-disable-next-line no-console
    console.log('WARN low-data Day 8 produces empty portfolio');
    hasWarn = true;
  }
  if (visible.length >= 3 && signatures.size === 1) {
    // eslint-disable-next-line no-console
    console.log('WARN all items same cost vector');
    hasWarn = true;
  }
  if (dominantShare > 0.6 && visible.length >= 3) {
    // eslint-disable-next-line no-console
    console.log('WARN one pressure bucket >60%');
    hasWarn = true;
  }
  if (fairnessWarnings.includes('all_risk_no_opportunity') && scenario.label !== 'Route-heavy day') {
    // eslint-disable-next-line no-console
    console.log('WARN all risk no opportunity');
    hasWarn = true;
  }

  for (const item of visible) {
    if (item.isMapRecommended && !item.sourceKinds.some((k) => k.includes('map'))) {
      // eslint-disable-next-line no-console
      console.log(`FAIL fake map source: ${item.id}`);
      hasFail = true;
    }
    const values = Object.values(item.capacityCost);
    if (values.some((v) => v < 0)) {
      // eslint-disable-next-line no-console
      console.log(`FAIL negative cost: ${item.id}`);
      hasFail = true;
    }
  }
}

// District modifier stacking sample
const stackedDraft: PortfolioAdapterDraft = {
  id: 'stack_test',
  kind: 'route_pressure',
  title: 'Stack test',
  pressureLevel: 'high',
  urgency: 'high',
  opportunityValue: 'none',
  deferRisk: 'none',
  recommendedReason: 'test',
  sourceIds: ['stack'],
  sourceKinds: ['district_personality'],
  confidence: 'high',
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
  districtCriterionHigh: ['route_difficulty', 'maintenance_exposure', 'resource_dependency'],
};
const stackedCost = computePortfolioCapacityCost(stackedDraft, 10);
// eslint-disable-next-line no-console
console.log(`\nDistrict modifier stack sample (route+maintenance+resource): vehicle=${stackedCost.vehicle} resource=${stackedCost.resource}`);

// eslint-disable-next-line no-console
console.log('\n--- Analyzer result ---');
if (hasFail) {
  // eslint-disable-next-line no-console
  console.log('FAIL');
  process.exit(1);
}
if (hasWarn) {
  // eslint-disable-next-line no-console
  console.log('WARN');
  process.exit(0);
}
// eslint-disable-next-line no-console
console.log('PASS');
