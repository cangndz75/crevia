/**
 * Konteyner 7 günlük pilot denge simülasyonu.
 * Çalıştır: npx tsx scripts/analyze-container-balance.ts
 */

import { CONTAINER_NEIGHBORHOOD_IDS, CONTAINER_OVERFLOW_RISK_PRIORITY } from '../src/core/containers/containerConstants';
import { applyContainerDecisionEffects } from '../src/core/containers/containerDecisionEffects';
import { applyContainerDailyUpdate } from '../src/core/containers/containerEngine';
import { isPilotMarketDay, processContainersEndOfDay } from '../src/core/containers/containerIntegration';
import { createInitialContainerState } from '../src/core/containers/containerSeed';
import { selectWorstContainerNeighborhood } from '../src/core/containers/containerSelectors';
import { toDisplayContainerNeighborhoodName } from '../src/core/containers/containerNeighborhoodBridge';
import type {
  ContainerNeighborhoodId,
  ContainerState,
  NeighborhoodContainerStatus,
  NeighborhoodContainerStatusLabel,
} from '../src/core/containers/containerTypes';

const PILOT_DAYS = 7;

const ELEVATED_LABELS: NeighborhoodContainerStatusLabel[] = [
  'Takipte',
  'Baskılı',
  'Yüksek',
  'Kritik',
];

type DecisionKind =
  | 'none'
  | 'dispatch_collection'
  | 'communicate'
  | 'prioritize_route'
  | 'maintenance'
  | 'add_capacity'
  | 'monitor'
  | 'permanent_solution';

type ScenarioId =
  | 'no_decisions'
  | 'always_dispatch_collection'
  | 'always_communicate'
  | 'always_prioritize_route'
  | 'mixed_reasonable_player'
  | 'wrong_player';

type DaySnapshot = {
  day: number;
  worst: NeighborhoodContainerStatus;
  sanayi: NeighborhoodContainerStatus;
  yesilvadi: NeighborhoodContainerStatus;
  criticalNeighborhoodCount: number;
  highOrCriticalUnitCount: number;
};

type ScenarioResult = {
  id: ScenarioId;
  daily: DaySnapshot[];
  final: ContainerState;
  summary: {
    finalWorstNeighborhood: ContainerNeighborhoodId;
    finalWorstStatus: NeighborhoodContainerStatusLabel;
    finalCriticalNeighborhoodCount: number;
    finalHighOrCriticalUnitCount: number;
    sanayiFinalStatus: NeighborhoodContainerStatusLabel;
    yesilvadiFinalStatus: NeighborhoodContainerStatusLabel;
    avgFillDelta: number;
    avgOdorDelta: number;
    avgMaintenanceDelta: number;
  };
};

type BalanceVerdict = 'PASS' | 'WARN' | 'FAIL';

type BalanceFinding = {
  verdict: BalanceVerdict;
  message: string;
};

const WASTE_EVENT_BASE = {
  eventType: 'waste' as const,
  title: 'Konteyner taşması',
  category: 'Temizlik',
};

function decisionForKind(kind: DecisionKind): {
  id: string;
  title: string;
  decisionStyle?: string;
  tags?: string[];
} {
  switch (kind) {
    case 'dispatch_collection':
      return {
        id: 'd-dispatch',
        title: 'Ekibi yönlendir',
        decisionStyle: 'fast',
      };
    case 'communicate':
      return {
        id: 'd-communicate',
        title: 'İletişim kur',
        decisionStyle: 'communication',
      };
    case 'prioritize_route':
      return { id: 'd-route', title: 'Toplama rotasını öne al' };
    case 'maintenance':
      return { id: 'd-maint', title: 'Bakım ekibi gönder', tags: ['maintenance'] };
    case 'add_capacity':
      return { id: 'd-cap', title: 'Ek konteyner yerleştir' };
    case 'monitor':
      return { id: 'd-monitor', title: 'Takip et', decisionStyle: 'balanced' };
    case 'permanent_solution':
      return {
        id: 'd-perm',
        title: 'Kalıcı çözüm uygula',
        decisionStyle: 'permanent',
      };
    default:
      return { id: 'd-none', title: '—' };
  }
}

function mixedDecisionForDay(day: number): DecisionKind {
  const plan: DecisionKind[] = [
    'dispatch_collection',
    'communicate',
    'maintenance',
    'prioritize_route',
    'add_capacity',
    'monitor',
    'permanent_solution',
  ];
  return plan[day - 1] ?? 'monitor';
}

function wrongPlayerDecisionForDay(day: number): DecisionKind {
  return day % 2 === 1 ? 'communicate' : 'monitor';
}

function resolveDecisionForScenario(
  scenario: ScenarioId,
  day: number,
): DecisionKind {
  switch (scenario) {
    case 'no_decisions':
      return 'none';
    case 'always_dispatch_collection':
      return 'dispatch_collection';
    case 'always_communicate':
      return 'communicate';
    case 'always_prioritize_route':
      return 'prioritize_route';
    case 'mixed_reasonable_player':
      return mixedDecisionForDay(day);
    case 'wrong_player':
      return wrongPlayerDecisionForDay(day);
    default:
      return 'none';
  }
}

function countCriticalNeighborhoods(
  state: ContainerState,
): number {
  return CONTAINER_NEIGHBORHOOD_IDS.filter(
    (id) => state.aggregates[id].statusLabel === 'Kritik',
  ).length;
}

function countHighOrCriticalUnits(state: ContainerState): number {
  return state.units.filter(
    (unit) =>
      unit.overflowRisk === 'high' || unit.overflowRisk === 'critical',
  ).length;
}

function pickTargetNeighborhood(
  state: ContainerState,
  scenario: ScenarioId,
): ContainerNeighborhoodId | null {
  const worst = selectWorstContainerNeighborhood(state);
  if (!worst) {
    return null;
  }

  if (scenario === 'always_dispatch_collection') {
    const sanayi = state.aggregates.sanayi;
    if (
      sanayi.criticalContainerCount > 0 ||
      sanayi.averageFillRate >= worst.averageFillRate - 8
    ) {
      return 'sanayi';
    }
  }

  return worst.neighborhoodId;
}

function applyScenarioDecision(
  state: ContainerState,
  day: number,
  kind: DecisionKind,
  scenario: ScenarioId,
): ContainerState {
  if (kind === 'none') {
    return state;
  }

  const neighborhoodId = pickTargetNeighborhood(state, scenario);
  if (!neighborhoodId) {
    return state;
  }

  const decision = decisionForKind(kind);
  const result = applyContainerDecisionEffects({
    containerState: state,
    event: {
      ...WASTE_EVENT_BASE,
      id: `e-${scenario}-d${day}`,
      neighborhoodId,
    },
    decision,
    day,
    personnelAssigned: kind === 'dispatch_collection',
  });

  return result.state;
}

function endOfDayTick(state: ContainerState, day: number): ContainerState {
  return processContainersEndOfDay({
    containerState: state,
    day,
    isMarketDay: isPilotMarketDay(day),
  }).state;
}

function buildDaySnapshot(state: ContainerState, day: number): DaySnapshot {
  const worst = selectWorstContainerNeighborhood(state);
  if (!worst) {
    throw new Error(`No worst neighborhood on day ${day}`);
  }

  return {
    day,
    worst,
    sanayi: state.aggregates.sanayi,
    yesilvadi: state.aggregates.yesilvadi,
    criticalNeighborhoodCount: countCriticalNeighborhoods(state),
    highOrCriticalUnitCount: countHighOrCriticalUnits(state),
  };
}

function formatNeighborhoodShort(
  status: NeighborhoodContainerStatus,
): string {
  return `${toDisplayContainerNeighborhoodName(status.neighborhoodId)} status=${status.statusLabel} fill=${Math.round(status.averageFillRate)} odor=${Math.round(status.odorPressure)} maint=${Math.round(status.maintenancePressure)}`;
}

function runScenario(id: ScenarioId): ScenarioResult {
  let state = createInitialContainerState(1);
  const daily: DaySnapshot[] = [];

  const day1Worst = selectWorstContainerNeighborhood(state);
  const day1AvgFill = day1Worst?.averageFillRate ?? 0;
  const day1AvgOdor = day1Worst?.odorPressure ?? 0;
  const day1AvgMaint = day1Worst?.maintenancePressure ?? 0;

  for (let day = 1; day <= PILOT_DAYS; day++) {
    const decisionKind = resolveDecisionForScenario(id, day);
    state = applyScenarioDecision(state, day, decisionKind, id);
    state = endOfDayTick(state, day);
    daily.push(buildDaySnapshot(state, day));
  }

  const finalWorst = selectWorstContainerNeighborhood(state)!;
  const finalDay7 = daily[daily.length - 1]!;

  return {
    id,
    daily,
    final: state,
    summary: {
      finalWorstNeighborhood: finalWorst.neighborhoodId,
      finalWorstStatus: finalWorst.statusLabel,
      finalCriticalNeighborhoodCount: countCriticalNeighborhoods(state),
      finalHighOrCriticalUnitCount: countHighOrCriticalUnits(state),
      sanayiFinalStatus: state.aggregates.sanayi.statusLabel,
      yesilvadiFinalStatus: state.aggregates.yesilvadi.statusLabel,
      avgFillDelta: Math.round(finalWorst.averageFillRate - day1AvgFill),
      avgOdorDelta: Math.round(finalWorst.odorPressure - day1AvgOdor),
      avgMaintenanceDelta: Math.round(
        finalWorst.maintenancePressure - day1AvgMaint,
      ),
    },
  };
}

function printScenario(result: ScenarioResult): void {
  console.log(`\nScenario: ${result.id}`);
  console.log('─'.repeat(72));

  for (const snap of result.daily) {
    const w = snap.worst;
    console.log(
      `Day ${snap.day} | worst=${w.neighborhoodId} | status=${w.statusLabel} | fill=${Math.round(w.averageFillRate)} | odor=${Math.round(w.odorPressure)} | maintenance=${Math.round(w.maintenancePressure)} | complaint=${Math.round(w.complaintPressure)} | criticalUnits=${w.criticalContainerCount} | critHoods=${snap.criticalNeighborhoodCount} | highCritUnits=${snap.highOrCriticalUnitCount}`,
    );
    console.log(`         Sanayi: ${formatNeighborhoodShort(snap.sanayi)}`);
    console.log(
      `         Yeşilvadi: ${formatNeighborhoodShort(snap.yesilvadi)}`,
    );
  }

  const s = result.summary;
  console.log('\nFinal summary:');
  console.log(`  finalWorstNeighborhood: ${s.finalWorstNeighborhood}`);
  console.log(`  finalWorstStatus: ${s.finalWorstStatus}`);
  console.log(`  finalCriticalNeighborhoodCount: ${s.finalCriticalNeighborhoodCount}`);
  console.log(`  finalHighOrCriticalUnitCount: ${s.finalHighOrCriticalUnitCount}`);
  console.log(`  sanayiFinalStatus: ${s.sanayiFinalStatus}`);
  console.log(`  yesilvadiFinalStatus: ${s.yesilvadiFinalStatus}`);
  console.log(`  avgFillDelta (worst): ${s.avgFillDelta >= 0 ? '+' : ''}${s.avgFillDelta}`);
  console.log(`  avgOdorDelta (worst): ${s.avgOdorDelta >= 0 ? '+' : ''}${s.avgOdorDelta}`);
  console.log(
    `  avgMaintenanceDelta (worst): ${s.avgMaintenanceDelta >= 0 ? '+' : ''}${s.avgMaintenanceDelta}`,
  );
}

function isElevatedLabel(label: NeighborhoodContainerStatusLabel): boolean {
  return ELEVATED_LABELS.includes(label);
}

function evaluateBalance(results: ScenarioResult[]): BalanceFinding[] {
  const findings: BalanceFinding[] = [];
  const byId = Object.fromEntries(
    results.map((r) => [r.id, r]),
  ) as Record<ScenarioId, ScenarioResult>;

  const noDec = byId.no_decisions;
  const dispatch = byId.always_dispatch_collection;
  const communicate = byId.always_communicate;
  const route = byId.always_prioritize_route;
  const mixed = byId.mixed_reasonable_player;
  const wrong = byId.wrong_player;

  const yesilvadiKritikScenarios = results.filter(
    (r) => r.summary.yesilvadiFinalStatus === 'Kritik',
  ).length;

  const day1SanayiStatus = noDec.daily[0]?.sanayi.statusLabel ?? 'unknown';
  if (day1SanayiStatus === 'Kritik') {
    findings.push({
      verdict: 'WARN',
      message: `no_decisions day1 sanayi=${day1SanayiStatus} (prefer Yüksek / Baskılı / Takipte)`,
    });
  } else if (
    day1SanayiStatus === 'Yüksek' ||
    day1SanayiStatus === 'Baskılı' ||
    day1SanayiStatus === 'Takipte'
  ) {
    findings.push({
      verdict: 'PASS',
      message: `no_decisions day1 sanayi=${day1SanayiStatus} (elevated but not kritik)`,
    });
  } else {
    findings.push({
      verdict: 'WARN',
      message: `no_decisions day1 sanayi=${day1SanayiStatus} (may be too calm for industrial zone)`,
    });
  }

  // A) no_decisions
  if (noDec.summary.finalCriticalNeighborhoodCount >= 5) {
    findings.push({
      verdict: 'FAIL',
      message: 'no_decisions: all 5 neighborhoods critical at day 7',
    });
  } else if (noDec.summary.finalCriticalNeighborhoodCount === 0) {
    findings.push({
      verdict: 'WARN',
      message: 'no_decisions: no critical neighborhoods at day 7 (pressure too low)',
    });
  } else {
    findings.push({
      verdict: 'PASS',
      message: `no_decisions: ${noDec.summary.finalCriticalNeighborhoodCount} critical hoods at day 7`,
    });
  }

  const noDecElevated = CONTAINER_NEIGHBORHOOD_IDS.filter((id) =>
    isElevatedLabel(noDec.final.aggregates[id].statusLabel),
  ).length;
  if (noDecElevated === 0) {
    findings.push({
      verdict: 'WARN',
      message: 'no_decisions: no elevated neighborhoods after 7 days',
    });
  }

  const worstTop2 = [...CONTAINER_NEIGHBORHOOD_IDS]
    .map((id) => noDec.final.aggregates[id])
    .sort(
      (a, b) =>
        CONTAINER_OVERFLOW_RISK_PRIORITY[b.worstOverflowRisk] -
          CONTAINER_OVERFLOW_RISK_PRIORITY[a.worstOverflowRisk] ||
        b.averageFillRate - a.averageFillRate,
    )
    .slice(0, 2)
    .map((s) => s.neighborhoodId);

  if (!worstTop2.includes('sanayi') && !worstTop2.includes('merkez')) {
    findings.push({
      verdict: 'WARN',
      message: `no_decisions: sanayi/merkez not in top-2 worst (${worstTop2.join(', ')})`,
    });
  } else {
    findings.push({
      verdict: 'PASS',
      message: 'no_decisions: sanayi or merkez among worst pressure',
    });
  }

  if (noDec.summary.yesilvadiFinalStatus === 'Kritik') {
    findings.push({
      verdict: 'FAIL',
      message: 'no_decisions: yesilvadi kritik at day 7 (too aggressive daily drift)',
    });
  } else if (
    noDec.summary.yesilvadiFinalStatus === 'Yüksek' ||
    noDec.summary.yesilvadiFinalStatus === 'Baskılı'
  ) {
    findings.push({
      verdict: 'WARN',
      message: `no_decisions: yesilvadi ${noDec.summary.yesilvadiFinalStatus} at day 7 (watch drift)`,
    });
  } else {
    findings.push({
      verdict: 'PASS',
      message: `no_decisions: yesilvadi final=${noDec.summary.yesilvadiFinalStatus}`,
    });
  }

  // B) dispatch
  if (dispatch.summary.finalHighOrCriticalUnitCount === 0) {
    findings.push({
      verdict: 'WARN',
      message:
        'always_dispatch_collection too strong: final high/critical units=0',
    });
  } else if (
    dispatch.summary.finalCriticalNeighborhoodCount >
    noDec.summary.finalCriticalNeighborhoodCount
  ) {
    findings.push({
      verdict: 'WARN',
      message: 'always_dispatch_collection weaker than no_decisions (unexpected)',
    });
  } else {
    findings.push({
      verdict: 'PASS',
      message: `always_dispatch_collection: ${dispatch.summary.finalHighOrCriticalUnitCount} high/crit units remain`,
    });
  }

  if (dispatch.summary.finalWorstStatus === 'Dengeli') {
    findings.push({
      verdict: 'WARN',
      message: 'always_dispatch_collection: worst hood fully dengeli (may be too strong)',
    });
  }

  // C) communicate
  const commFill = communicate.final.aggregates[communicate.summary.finalWorstNeighborhood]
    .averageFillRate;
  const noDecFill = noDec.final.aggregates[noDec.summary.finalWorstNeighborhood]
    .averageFillRate;
  const dispatchFill = dispatch.final.aggregates[dispatch.summary.finalWorstNeighborhood]
    .averageFillRate;

  if (commFill < noDecFill - 12) {
    findings.push({
      verdict: 'WARN',
      message: `communicate reduces fill too much vs no_decisions (${Math.round(commFill)} vs ${Math.round(noDecFill)})`,
    });
  } else {
    findings.push({
      verdict: 'PASS',
      message: 'communicate does not reduce fill too much vs passive drift',
    });
  }

  if (commFill <= dispatchFill) {
    findings.push({
      verdict: 'WARN',
      message: 'always_communicate not clearly weaker than dispatch on fill',
    });
  } else {
    findings.push({
      verdict: 'PASS',
      message: 'always_communicate worse physical fill than dispatch (expected)',
    });
  }

  if (
    communicate.summary.finalCriticalNeighborhoodCount <
    noDec.summary.finalCriticalNeighborhoodCount
  ) {
    findings.push({
      verdict: 'PASS',
      message: 'always_communicate slightly better than no_decisions on crisis count',
    });
  } else {
    findings.push({
      verdict: 'WARN',
      message: 'always_communicate not better than no_decisions on crisis count',
    });
  }

  // D) prioritize_route
  if (route.summary.finalHighOrCriticalUnitCount === 0) {
    findings.push({
      verdict: 'WARN',
      message: 'always_prioritize_route too strong: zero high/critical units',
    });
  } else {
    findings.push({
      verdict: 'PASS',
      message: `always_prioritize_route leaves ${route.summary.finalHighOrCriticalUnitCount} high/crit units`,
    });
  }

  const routeWorstFill = route.final.aggregates[route.summary.finalWorstNeighborhood]
    .averageFillRate;
  if (routeWorstFill > commFill) {
    findings.push({
      verdict: 'PASS',
      message: 'prioritize_route strongest short-term fill relief vs communicate',
    });
  } else {
    findings.push({
      verdict: 'WARN',
      message: 'prioritize_route not clearly stronger than communicate on fill',
    });
  }

  if (route.final.aggregates.sanayi.maintenancePressure >= 40) {
    findings.push({
      verdict: 'PASS',
      message: `prioritize_route: sanayi maintenance pressure remains (${Math.round(route.final.aggregates.sanayi.maintenancePressure)})`,
    });
  } else {
    findings.push({
      verdict: 'WARN',
      message: 'prioritize_route clears sanayi maintenance pressure entirely',
    });
  }

  // E) mixed
  if (mixed.summary.finalCriticalNeighborhoodCount > 3) {
    findings.push({
      verdict: 'WARN',
      message: `mixed_reasonable_player: ${mixed.summary.finalCriticalNeighborhoodCount} critical hoods (target <=3)`,
    });
  } else if (mixed.summary.finalCriticalNeighborhoodCount > 2) {
    findings.push({
      verdict: 'WARN',
      message: `mixed_reasonable_player: ${mixed.summary.finalCriticalNeighborhoodCount} critical hoods (borderline, target 1-2)`,
    });
  } else {
    findings.push({
      verdict: 'PASS',
      message: `mixed_reasonable_player: ${mixed.summary.finalCriticalNeighborhoodCount} critical hoods (balanced)`,
    });
  }

  if (
    mixed.summary.finalCriticalNeighborhoodCount >=
    noDec.summary.finalCriticalNeighborhoodCount
  ) {
    findings.push({
      verdict: 'WARN',
      message: 'mixed_reasonable_player not better than no_decisions on crisis count',
    });
  } else {
    findings.push({
      verdict: 'PASS',
      message: 'mixed_reasonable_player improves crisis count vs passive drift',
    });
  }

  if (mixed.summary.yesilvadiFinalStatus === 'Kritik') {
    findings.push({
      verdict: 'FAIL',
      message: 'mixed_reasonable_player: yesilvadi kritik (should stay calmer)',
    });
  } else {
    findings.push({
      verdict: 'PASS',
      message: `mixed_reasonable_player: yesilvadi=${mixed.summary.yesilvadiFinalStatus}`,
    });
  }

  // F) wrong_player
  const wrongElevated = CONTAINER_NEIGHBORHOOD_IDS.filter((id) =>
    isElevatedLabel(wrong.final.aggregates[id].statusLabel),
  ).length;
  if (wrongElevated < 2) {
    findings.push({
      verdict: 'FAIL',
      message: `wrong_player: only ${wrongElevated} elevated hoods (need >=2)`,
    });
  } else if (wrongElevated >= 5) {
    findings.push({
      verdict: 'WARN',
      message: 'wrong_player: map-wide collapse (>=5 elevated)',
    });
  } else {
    findings.push({
      verdict: 'PASS',
      message: `wrong_player: ${wrongElevated} elevated hoods (visible failure)`,
    });
  }

  if (
    wrong.summary.finalCriticalNeighborhoodCount <=
    mixed.summary.finalCriticalNeighborhoodCount
  ) {
    findings.push({
      verdict: 'WARN',
      message: 'wrong_player not clearly worse than mixed_reasonable_player',
    });
  } else {
    findings.push({
      verdict: 'PASS',
      message: 'wrong_player worse crisis count than mixed_reasonable_player',
    });
  }

  // Cross-scenario yesilvadi
  if (yesilvadiKritikScenarios >= 3) {
    findings.push({
      verdict: 'FAIL',
      message: `yesilvadi became kritik in ${yesilvadiKritikScenarios} scenarios`,
    });
  } else if (yesilvadiKritikScenarios >= 1) {
    findings.push({
      verdict: 'WARN',
      message: `yesilvadi kritik in ${yesilvadiKritikScenarios} scenario(s)`,
    });
  } else {
    findings.push({
      verdict: 'PASS',
      message: 'yesilvadi avoids kritik across all scenarios',
    });
  }

  return findings;
}

function suggestTuning(findings: BalanceFinding[], results: ScenarioResult[]): string[] {
  const tips: string[] = [];
  const byId = Object.fromEntries(results.map((r) => [r.id, r])) as Record<
    ScenarioId,
    ScenarioResult
  >;

  const hasFailYesilvadi = findings.some((f) =>
    f.message.includes('yesilvadi') && f.verdict === 'FAIL',
  );
  const dispatchTooStrong = findings.some((f) =>
    f.message.includes('dispatch_collection too strong'),
  );
  const routeTooStrong = findings.some((f) =>
    f.message.includes('prioritize_route too strong'),
  );
  const commFillWarn = findings.some((f) =>
    f.message.includes('communicate reduces fill too much'),
  );
  const noDecLow = findings.some((f) =>
    f.message.includes('no elevated neighborhoods'),
  );

  if (noDecLow || hasFailYesilvadi) {
    tips.push(
      'Günlük fill gain: yesilvadi baskısını düşür veya CONTAINER_DAILY_UPDATE_LIMITS.maxFillGainPerDay değerini hafifçe azalt.',
    );
    tips.push(
      'Odor gain: mahalle çarpanı veya collectionDelay koku tavanını gözden geçir (yesilvadi drift).',
    );
  }

  if (dispatchTooStrong) {
    tips.push(
      'dispatch_collection fill reduction: -25 (×1.15 personel) değerini -20/-22 bandına çek.',
    );
  }

  if (routeTooStrong) {
    tips.push(
      'prioritize_route fill reduction: -38 fazla güçlü olabilir; -30/-32 veya günlük tekrar cezası eklenebilir.',
    );
  } else if (
    byId.always_prioritize_route.summary.finalHighOrCriticalUnitCount >
    byId.always_dispatch_collection.summary.finalHighOrCriticalUnitCount + 2
  ) {
    tips.push(
      'prioritize_route zayıf kalıyorsa fill -38 etkisini koru; dispatch ile fark net kalsın.',
    );
  }

  if (commFillWarn) {
    tips.push(
      'communicate fiziksel etki: odor -5 yerine -3; fill etkisinin 0 kaldığından emin ol.',
    );
  } else if (
    byId.always_communicate.summary.finalWorstStatus === 'Kritik' &&
    byId.no_decisions.summary.finalWorstStatus !== 'Kritik'
  ) {
    tips.push(
      'communicate yetersiz: fiziksel baskıyı düşürmeden sadece şikayet algısı için ayrı metrik gerekir (ileride).',
    );
  }

  if (byId.mixed_reasonable_player.summary.finalCriticalNeighborhoodCount === 0) {
    tips.push(
      'mixed senaryo çok temiz: günlük drift hafif artırılabilir veya karar etkileri %10 zayıflatılabilir.',
    );
  }

  if (byId.wrong_player.summary.finalCriticalNeighborhoodCount >= 4) {
    tips.push(
      'wrong_player çöküşü fazla: günlük drift veya communicate/monitor etkisini hafif yumuşat.',
    );
  }

  tips.push(
    'add_capacity: yeni unit ekleme yok; kalıcı kapasite modeli ileride ayrı fazda düşünülmeli.',
  );
  tips.push(
    'maintenance: condition +22 güçlü; 7 günlük mixed testte sorun yoksa dokunma, route ile çakışmayı izle.',
  );

  if (tips.length <= 2) {
    tips.unshift(
      'Mevcut denge genel olarak kabul edilebilir; küçük ince ayar yeterli.',
    );
  }

  return tips;
}

function main(): void {
  console.log('Crevia — Konteyner Dinamikleri 7 Günlük Denge Simülasyonu');
  console.log('='.repeat(72));

  const scenarioIds: ScenarioId[] = [
    'no_decisions',
    'always_dispatch_collection',
    'always_communicate',
    'always_prioritize_route',
    'mixed_reasonable_player',
    'wrong_player',
  ];

  const results = scenarioIds.map((id) => runScenario(id));
  for (const result of results) {
    printScenario(result);
  }

  const findings = evaluateBalance(results);

  console.log('\n' + '='.repeat(72));
  console.log('Balance evaluation');
  console.log('='.repeat(72));

  for (const finding of findings) {
    console.log(`[balance] ${finding.verdict} ${finding.message}`);
  }

  const failCount = findings.filter((f) => f.verdict === 'FAIL').length;
  const warnCount = findings.filter((f) => f.verdict === 'WARN').length;
  const passCount = findings.filter((f) => f.verdict === 'PASS').length;

  console.log(
    `\nTotals: PASS=${passCount} WARN=${warnCount} FAIL=${failCount}`,
  );

  console.log('\nTuning suggestions (report only — no code changes):');
  for (const tip of suggestTuning(findings, results)) {
    console.log(`  • ${tip}`);
  }

  if (failCount > 0) {
    process.exit(1);
  }
}

main();
