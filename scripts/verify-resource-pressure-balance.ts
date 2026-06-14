/**
 * Resource Pressure Balance Audit verify.
 * Calistir: npm run verify:resource-pressure-balance
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';

import {
  buildDailyCapacityPortfolio,
  computePortfolioCapacityCost,
} from '@/core/dailyCapacityPortfolio/dailyCapacityPortfolioModel';
import {
  PORTFOLIO_BASE_COSTS,
  PORTFOLIO_COST_MAX,
  DETAILED_PORTFOLIO_PERMISSION_IDS,
} from '@/core/dailyCapacityPortfolio/dailyCapacityPortfolioConstants';
import type { OperationPortfolioItemKind } from '@/core/dailyCapacityPortfolio/dailyCapacityPortfolioTypes';
import type { PortfolioAdapterDraft } from '@/core/dailyCapacityPortfolio/dailyCapacityPortfolioSourceAdapters';

const REPO_ROOT = join(__dirname, '..');

type Outcome = { ok: boolean; warn: boolean; checks: string[] };

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

function makeDraft(kind: OperationPortfolioItemKind, highs: string[]): PortfolioAdapterDraft {
  return {
    id: `verify_${kind}`,
    kind,
    title: 'Verify',
    pressureLevel: 'medium',
    urgency: 'medium',
    opportunityValue: 'none',
    deferRisk: 'none',
    recommendedReason: 'verify',
    sourceIds: ['verify'],
    sourceKinds: ['operation_signals'],
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
    hasRouteSource: false,
    hasSocialSource: false,
    hasOpportunitySource: false,
    hasMemorySource: false,
    districtCriterionHigh: highs,
  };
}

export function verifyResourcePressureBalanceScenario(): Outcome {
  const checks: string[] = [];
  let ok = true;

  for (const kind of Object.keys(PORTFOLIO_BASE_COSTS) as OperationPortfolioItemKind[]) {
    const cost = PORTFOLIO_BASE_COSTS[kind];
    const values = Object.values(cost);
    if (!assert(checks, values.every((v) => v >= 0), `no negative base cost (${kind})`, `negative base cost (${kind})`)) {
      ok = false;
    }
    if (!assert(checks, values.every((v) => v <= PORTFOLIO_COST_MAX), `base cost clamp (${kind})`, `base cost exceeds max (${kind})`)) {
      ok = false;
    }
  }

  const dimensionsUsed = new Set<string>();
  for (const cost of Object.values(PORTFOLIO_BASE_COSTS)) {
    if (cost.operationSlots > 0) dimensionsUsed.add('operationSlots');
    if (cost.team > 0) dimensionsUsed.add('team');
    if (cost.vehicle > 0) dimensionsUsed.add('vehicle');
    if (cost.resource > 0) dimensionsUsed.add('resource');
    if (cost.social > 0) dimensionsUsed.add('social');
    if (cost.districtFocus > 0) dimensionsUsed.add('districtFocus');
    if (cost.followUp > 0) dimensionsUsed.add('followUp');
  }
  if (!assert(checks, dimensionsUsed.size >= 3, 'at least 3 cost dimensions used', 'fewer than 3 cost dimensions')) {
    ok = false;
  }

  const day1 = buildDailyCapacityPortfolio({
    day: 1,
    activeEvents: [{ id: 'd1', title: 'Ilk operasyon', district: 'Merkez', neighborhoodId: 'merkez' }],
  });
  if (!assert(checks, day1.summary.mode === 'tutorial', 'Day 1 tutorial mode', 'Day 1 not tutorial')) ok = false;
  if (!assert(checks, day1.summary.operationSlotLimit === 1, 'Day 1 low operation slots', 'Day 1 slot limit wrong')) ok = false;
  if (!warn(checks, !day1.summary.hasStrategicPressure, 'Day 1 no strategic pressure', 'Day 1 has strategic pressure')) {
    // warn only
  }

  const day8 = buildDailyCapacityPortfolio({
    day: 8,
    activeEvents: [
      { id: 'a', title: 'Op A', district: 'Sanayi', neighborhoodId: 'sanayi' },
      { id: 'b', title: 'Op B', district: 'Cumhuriyet', neighborhoodId: 'cumhuriyet' },
    ],
    operationSignals: {
      priorityDistrictId: 'sanayi',
      vehicles: { status: 'strained', score: 68, title: 'Rota', summary: 'Rota baskisi.', sourceTags: ['route'] },
      containers: { status: 'watch', score: 50, title: 'Konteyner', summary: 'Izleniyor.', sourceTags: [] },
      districts: { status: 'strained', score: 60, title: 'Bolge', summary: 'Baski.', sourceTags: [] },
      personnel: { status: 'stable', score: 40, title: 'Ekip', summary: 'OK', sourceTags: [] },
      overall: { status: 'watch', score: 50, title: 'Genel', summary: 'OK', sourceTags: [] },
    },
    districtPersonalityProfiles: [
      {
        districtId: 'sanayi',
        districtName: 'Sanayi',
        sourceIds: ['sanayi'],
        criteria: [{ id: 'route_difficulty', band: 'high', score: 78, label: 'route', gameplayMeaning: 'route', sourceKinds: ['district_identity'], sourceIds: ['c'] }],
      },
    ],
  });
  const day8Visible = day8.items.filter((item) => item.visibilityLevel !== 'hidden');
  if (!assert(checks, day8Visible.length >= 3, 'Day 8+ strategic pressure sample (>=3 items)', 'Day 8+ too few items')) {
    ok = false;
  }
  if (!assert(checks, day8.summary.operationSlotLimit === 2, 'Day 8 operation slot limit 2', 'Day 8 slot limit wrong')) {
    ok = false;
  }

  const recovery = buildDailyCapacityPortfolio({
    day: 9,
    rewardComebackSignals: { id: 'rc', title: 'Toparlanma', summary: 'Firsat.', tone: 'recovery', sourceIds: ['rc'] },
    districtPersonalityProfiles: [
      {
        districtId: 'merkez',
        districtName: 'Merkez',
        sourceIds: ['merkez'],
        criteria: [{ id: 'recovery_potential', band: 'high', score: 80, label: 'recovery', gameplayMeaning: 'recovery', sourceKinds: ['district_identity'], sourceIds: ['c'] }],
      },
    ],
  });
  const hasOpportunity = recovery.items.some((item) => item.kind.includes('opportunity'));
  if (!assert(checks, hasOpportunity, 'recovery/positive opportunity can exist', 'no opportunity items')) {
    ok = false;
  }

  const noPerm = buildDailyCapacityPortfolio({
    day: 10,
    resourceSignals: { id: 'r1', title: 'Kaynak', summary: 'Baski.', score: 70 },
    operationSignals: {
      priorityDistrictId: 'sanayi',
      vehicles: { status: 'strained', score: 70, title: 'Rota', summary: 'Rota.', sourceTags: ['route'] },
      containers: { status: 'stable', score: 30, title: 'K', summary: 'OK', sourceTags: [] },
      districts: { status: 'stable', score: 30, title: 'B', summary: 'OK', sourceTags: [] },
      personnel: { status: 'stable', score: 30, title: 'E', summary: 'OK', sourceTags: [] },
      overall: { status: 'stable', score: 30, title: 'G', summary: 'OK', sourceTags: [] },
    },
  });
  const detailedWithoutPerm = noPerm.items.some(
    (item) => item.visibilityLevel === 'detailed' && item.sourceIds.length > 0,
  );
  if (!assert(checks, !detailedWithoutPerm, 'authority no detailed without permission', 'detailed without permission')) {
    ok = false;
  }

  const withPerm = buildDailyCapacityPortfolio({
    day: 10,
    resourceSignals: { id: 'r2', title: 'Kaynak', summary: 'Baski.', score: 70 },
    authorityPermissionIds: ['resource_pressure_summary'],
  });
  const resourceItem = withPerm.items.find((item) => item.kind === 'resource_pressure');
  if (!warn(checks, resourceItem?.visibilityLevel === 'detailed', 'authority detailed when permitted', 'resource detailed not unlocked with permission')) {
    // warn
  }

  for (const perm of DETAILED_PORTFOLIO_PERMISSION_IDS) {
    if (!assert(checks, typeof perm === 'string' && perm.length > 0, `permission id registered (${perm})`, `invalid permission (${perm})`)) {
      ok = false;
    }
  }

  const stacked = computePortfolioCapacityCost(
    makeDraft('route_pressure', ['route_difficulty', 'maintenance_exposure', 'trust_fragility']),
    10,
  );
  if (!assert(checks, stacked.vehicle <= PORTFOLIO_COST_MAX, 'district modifier clamp vehicle', 'modifier exceeds vehicle max')) {
    ok = false;
  }

  const modelSource = readRepo('src/core/dailyCapacityPortfolio/dailyCapacityPortfolioModel.ts');
  if (!assert(checks, !modelSource.includes('applyDecision'), 'no applyDecision in portfolio model', 'applyDecision in portfolio model')) {
    ok = false;
  }
  if (!assert(checks, SAVE_VERSION === 26, 'SAVE_VERSION unchanged (26)', `SAVE_VERSION changed (${SAVE_VERSION})`)) {
    ok = false;
  }

  const persist = readRepo('src/store/gamePersist.ts');
  if (!assert(checks, !persist.includes('dailyCapacityPortfolioState'), 'no portfolio persist', 'portfolio persist added')) {
    ok = false;
  }

  let hasWarn = checks.some((line) => line.startsWith('WARN'));
  return { ok, warn: hasWarn && ok, checks };
}

const outcome = verifyResourcePressureBalanceScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((l) => l.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((l) => l.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((l) => l.startsWith('FAIL')).length} FAIL`,
);

if (!outcome.ok) {
  process.exit(1);
}
