/**
 * Pilot Systems Integration QA — 7 günlük akış, persist, rapor snapshot, quick action ayrımı.
 * Çalıştır: npm run verify:pilot-systems
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { createDay1Seed } from '@/core/content/day1Seed';
import { applyDecision } from '@/core/game/applyDecision';
import { endDay, type EndDayState } from '@/core/game/endDay';
import { buildPersonnelDayReport } from '@/core/personnel/personnelEngine';
import { processPersonnelAfterDecision, processPersonnelEndOfDay } from '@/core/personnel/personnelIntegration';
import { createInitialPersonnelState } from '@/core/personnel/personnelSeed';
import {
  processContainersAfterDecision,
  processContainersEndOfDay,
} from '@/core/containers/containerIntegration';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import {
  processVehiclesAfterDecisionForStore,
  processVehiclesEndOfDayForStore,
} from '@/core/vehicles/vehicleIntegration';
import { createInitialVehicleState } from '@/core/vehicles/vehicleSeed';
import {
  processSocialPulseAfterDecisionForStore,
  processSocialPulseEndOfDayForStore,
} from '@/core/social/socialIntegration';
import { applySocialQuickAction } from '@/core/social/socialQuickAction';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import type { DailyReport } from '@/core/models/DailyReport';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import type { ContainerState } from '@/core/containers/containerTypes';
import type { PersonnelState } from '@/core/personnel/personnelTypes';
import type { SocialPulseState } from '@/core/social/socialTypes';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';
import { appendPilotLeaderboardIfNew } from '@/core/leaderboard/leaderboardSelectors';
import type { LeaderboardEntry } from '@/core/leaderboard/leaderboardTypes';
import { createInitialEconomyState } from '@/core/economy/economyEngine';
import { buildDailySocialSummaryLines } from '@/features/social/utils/socialReportModel';
import { applyDay1TutorialReportCopy } from '@/features/tutorial/tutorialSelectors';
import {
  SAVE_VERSION,
  normalizePersistedSave,
} from '@/store/gamePersist';

type Severity = 'PASS' | 'WARN' | 'FAIL';

type IntegrationCheck = {
  name: string;
  severity: Severity;
  detail: string;
};

type SimState = {
  gameState: GameState;
  neighborhoods: ReturnType<typeof createDay1Seed>['neighborhoods'];
  resources: ReturnType<typeof createDay1Seed>['resources'];
  eventPool: EventCard[];
  decisionHistory: ReturnType<typeof createDay1Seed>['decisionHistory'];
  snapshots: ReturnType<typeof createDay1Seed>['snapshots'];
  personnelState: PersonnelState;
  containerState: ContainerState;
  vehicleState: VehicleState;
  socialPulseState: SocialPulseState;
  lastDailyReport: DailyReport | null;
  lastClosedDay: number | null;
  /** Son gün kapanışında rapor snapshot'ı için kullanılan sosyal state (EOD öncesi). */
  lastReportSocialPulseBefore?: SocialPulseState | null;
};

const checks: IntegrationCheck[] = [];
let failCount = 0;
let warnCount = 0;
let passCount = 0;

function record(severity: Severity, name: string, detail: string): void {
  checks.push({ name, severity, detail });
  if (severity === 'FAIL') failCount += 1;
  else if (severity === 'WARN') warnCount += 1;
  else passCount += 1;
}

function pass(name: string, detail = 'ok'): void {
  record('PASS', name, detail);
}

function warn(name: string, detail: string): void {
  record('WARN', name, detail);
}

function fail(name: string, detail: string): void {
  record('FAIL', name, detail);
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createSimState(): SimState {
  const bundle = createDay1Seed();
  const day = bundle.gameState.city.day;
  return {
    gameState: bundle.gameState,
    neighborhoods: bundle.neighborhoods,
    resources: bundle.resources,
    eventPool: bundle.eventPool,
    decisionHistory: bundle.decisionHistory,
    snapshots: bundle.snapshots,
    personnelState: createInitialPersonnelState(),
    containerState: createInitialContainerState(day),
    vehicleState: createInitialVehicleState(day),
    socialPulseState: createInitialSocialPulseState(day),
    lastDailyReport: null,
    lastClosedDay: null,
  };
}

function toEngine(sim: SimState): EndDayState {
  return {
    ...sim.gameState,
    neighborhoods: sim.neighborhoods,
    resources: sim.resources,
    eventPool: sim.eventPool,
    decisionHistory: sim.decisionHistory,
    snapshots: sim.snapshots,
  };
}

function simulateEndDay(sim: SimState): SimState {
  const closingDay = sim.gameState.city.day;
  const districtNames = Object.fromEntries(
    sim.neighborhoods.map((n) => [n.id, n.name]),
  );

  const containerStateAfterNight = processContainersEndOfDay({
    containerState: sim.containerState,
    day: closingDay,
  }).state;

  const vehicleStateAfterNight = processVehiclesEndOfDayForStore(
    sim.vehicleState,
    closingDay,
  );

  const socialPulseStateBeforeNight = sim.socialPulseState;
  const socialPulseStateAfterNight = processSocialPulseEndOfDayForStore(
    sim.socialPulseState,
    closingDay,
  );

  const personnelReport = buildPersonnelDayReport(
    sim.personnelState,
    closingDay,
    districtNames,
  );

  const result = endDay(toEngine(sim), {
    skipEventSelection: true,
    personnelReport,
    containerState: containerStateAfterNight,
    vehicleState: vehicleStateAfterNight,
    socialPulseState: socialPulseStateAfterNight,
    socialPulseStateBefore: socialPulseStateBeforeNight,
  });

  const personnelStateAfterNight = processPersonnelEndOfDay(
    sim.personnelState,
    closingDay,
  );

  return {
    ...sim,
    gameState: {
      ...sim.gameState,
      ...result.nextState,
      pilot: sim.gameState.pilot,
    },
    snapshots: result.nextState.snapshots ?? sim.snapshots,
    decisionHistory: result.nextState.decisionHistory ?? sim.decisionHistory,
    lastDailyReport: result.dailyReport,
    lastClosedDay: closingDay,
    personnelState: personnelStateAfterNight,
    containerState: containerStateAfterNight,
    vehicleState: vehicleStateAfterNight,
    socialPulseState: socialPulseStateAfterNight,
    lastReportSocialPulseBefore: socialPulseStateBeforeNight,
  };
}

function applyDecisionWithSubsystems(sim: SimState, eventId: string, decisionId: string): SimState {
  const event =
    sim.gameState.events.find((e) => e.id === eventId) ??
    sim.eventPool.find((e) => e.id === eventId);
  const decision = event?.decisions.find((d) => d.id === decisionId);
  if (!event || !decision) {
    return sim;
  }

  const result = applyDecision({
    state: toEngine(sim),
    eventId,
    decisionId,
  });

  let personnelState = sim.personnelState;
  let containerState = sim.containerState;
  let vehicleState = sim.vehicleState;
  let socialPulseState = sim.socialPulseState;

  const personnelResult = processPersonnelAfterDecision(
    {
      personnelState,
      event,
      decision,
      day: result.decisionRecord.day,
      neighborhoods: sim.neighborhoods,
      resources: result.nextState.resources ?? sim.resources,
    },
    result.nextState.city.morale,
  );
  personnelState = personnelResult.personnelState;

  const containerResult = processContainersAfterDecision({
    containerState,
    event: {
      id: event.id,
      neighborhoodId: event.neighborhoodId,
      eventType: event.eventType,
      title: event.title,
      category: event.category,
    },
    decision: {
      id: decision.id,
      title: decision.title,
      description: decision.description,
      decisionStyle: decision.decisionStyle,
      costs: decision.costs,
    },
    day: result.decisionRecord.day,
    personnelAssigned: personnelResult.assignment != null,
  });
  containerState = containerResult.state;

  vehicleState = processVehiclesAfterDecisionForStore({
    vehicleState,
    event: {
      id: event.id,
      eventType: event.eventType,
      title: event.title,
      description: event.description,
      category: event.category,
      neighborhoodId: event.neighborhoodId,
      districtIds: event.districtIds,
      tags: event.filterTags,
    },
    decision: {
      id: decision.id,
      title: decision.title,
      description: decision.description,
      style: decision.style,
      decisionStyle: decision.decisionStyle,
      costs: decision.costs,
    },
    day: result.decisionRecord.day,
  });

  socialPulseState = processSocialPulseAfterDecisionForStore(socialPulseState, {
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      neighborhoodId: event.neighborhoodId,
      districtIds: event.districtIds,
      eventType: event.eventType,
      tags: event.filterTags,
    },
    decision: {
      id: decision.id,
      title: decision.title,
      description: decision.description,
    },
    day: result.decisionRecord.day,
  });

  return {
    ...sim,
    gameState: {
      ...sim.gameState,
      ...result.nextState,
      pilot: sim.gameState.pilot,
    },
    decisionHistory: [...sim.decisionHistory, result.decisionRecord],
    snapshots: [...sim.snapshots, result.beforeSnapshot, result.afterSnapshot],
    personnelState,
    containerState,
    vehicleState,
    socialPulseState,
  };
}

function verifyDay1Seed(): void {
  const sim = createSimState();
  if (sim.gameState.city.day === 1 && sim.personnelState.teams.length > 0) {
    pass('Day 1 seed city day and personnel teams');
  } else {
    fail('Day 1 seed', 'personnel or day invalid');
  }
  if (sim.containerState.units.length > 0) {
    pass('Day 1 containerState seeded');
  } else {
    fail('Day 1 containerState', 'empty container units');
  }
  if (sim.vehicleState.units.length > 0) {
    pass('Day 1 vehicleState seeded');
  } else {
    fail('Day 1 vehicleState', 'empty fleet');
  }
  if (Object.keys(sim.socialPulseState.neighborhoods).length >= 5) {
    pass('Day 1 socialPulseState seeded');
  } else {
    fail('Day 1 socialPulseState', 'neighborhoods missing');
  }
}

function verifyTutorialReportCopy(): void {
  const report: DailyReport = {
    day: 1,
    title: 'Gün 1',
    stats: [],
    rewardTitle: '—',
    socialSummaryLines: ['test'],
    containerSummaryLines: ['c'],
    vehicleSummaryLines: ['v'],
  };
  const copy = applyDay1TutorialReportCopy(report, true);
  if (
    copy.socialSummaryLines == null &&
    copy.containerSummaryLines == null &&
    copy.vehicleSummaryLines == null
  ) {
    pass('Day 1 tutorial report hides subsystem summaries');
  } else {
    fail('Day 1 tutorial report', 'subsystem summaries still present');
  }
}

function verifySevenDayFlow(): void {
  let sim = createSimState();
  const reports: DailyReport[] = [];

  for (let i = 0; i < 7; i += 1) {
    const day = sim.gameState.city.day;
    const event = sim.gameState.events[0];
    const decision = event?.decisions[0];
    if (event && decision) {
      sim = applyDecisionWithSubsystems(sim, event.id, decision.id);
    }

    if (day >= 2 && day <= 6) {
      const quick = applySocialQuickAction(sim.socialPulseState, {
        topicId: sim.socialPulseState.activeTopics[0]?.id,
        action: day % 2 === 0 ? 'communicate' : 'dispatch_team',
        day,
      });
      if (quick.success) {
        sim = { ...sim, socialPulseState: quick.state };
      }
    }

    sim = simulateEndDay(sim);

    if (sim.lastClosedDay !== day) {
      fail(`Day ${day} endDay`, `lastClosedDay=${sim.lastClosedDay}`);
      return;
    }

    if (!sim.lastDailyReport || sim.lastDailyReport.day !== day) {
      fail(`Day ${day} report snapshot`, 'missing or wrong day on report');
      return;
    }

    reports.push(sim.lastDailyReport);

    const liveRecompute = buildDailySocialSummaryLines(sim.socialPulseState, {
      day,
      previousSocialPulseState: sim.lastReportSocialPulseBefore,
    });
    const snapshotLines = sim.lastDailyReport.socialSummaryLines ?? [];
    if (JSON.stringify(liveRecompute) !== JSON.stringify(snapshotLines)) {
      fail(
        `Day ${day} report social snapshot`,
        'live socialPulseState differs from frozen report lines',
      );
      return;
    }
  }

  if (sim.gameState.city.day === 8) {
    pass('7-day flow advances city to day 8');
  } else {
    fail('7-day flow day counter', `expected day 8, got ${sim.gameState.city.day}`);
  }

  if (reports.length === 7) {
    pass('7-day flow produces 7 daily report snapshots');
  } else {
    fail('7-day report count', `got ${reports.length}`);
  }

  const day2Report = reports.find((r) => r.day === 2);
  if (day2Report?.socialSummaryLines && day2Report.socialSummaryLines.length > 0) {
    pass('Day 2+ report includes socialSummaryLines snapshot');
  } else {
    warn('Day 2 social summary', 'no social lines on day 2 report (may be empty state)');
  }
}

function verifyApplyDecisionSubsystems(): void {
  let sim = createSimState();
  const event = sim.gameState.events[0];
  const decision = event?.decisions[0];
  if (!event || !decision) {
    warn('applyDecision subsystem test', 'no day-1 event/decision to exercise');
    return;
  }

  const before = {
    personnel: cloneJson(sim.personnelState),
    container: cloneJson(sim.containerState),
    vehicle: cloneJson(sim.vehicleState),
    social: cloneJson(sim.socialPulseState),
    solved: sim.gameState.solvedEvents.length,
  };

  sim = applyDecisionWithSubsystems(sim, event.id, decision.id);

  const personnelChanged =
    JSON.stringify(before.personnel) !== JSON.stringify(sim.personnelState);
  const containerChanged =
    JSON.stringify(before.container) !== JSON.stringify(sim.containerState);
  const vehicleChanged =
    JSON.stringify(before.vehicle) !== JSON.stringify(sim.vehicleState);
  const socialChanged =
    JSON.stringify(before.social) !== JSON.stringify(sim.socialPulseState);
  const solvedOk = sim.gameState.solvedEvents.some((e) => e.id === event.id);

  if (personnelChanged) pass('applyDecision updates personnelState');
  else warn('applyDecision personnel', 'no change detected for sample decision');

  if (containerChanged) pass('applyDecision updates containerState');
  else warn('applyDecision container', 'no change detected for sample decision');

  if (vehicleChanged) pass('applyDecision updates vehicleState');
  else warn('applyDecision vehicle', 'no change detected for sample decision');

  if (socialChanged) pass('applyDecision updates socialPulseState');
  else warn('applyDecision social', 'no change detected for sample decision');

  if (solvedOk) pass('applyDecision solvedEvents guard adds resolved event');
  else fail('applyDecision solvedEvents', 'event not in solvedEvents');

  try {
    applyDecision({
      state: toEngine(sim),
      eventId: event.id,
      decisionId: decision.id,
    });
    fail('duplicate applyDecision', 'expected findEvent failure after resolve');
  } catch {
    pass('duplicate applyDecision blocked when event removed from active list');
  }
}

function verifySocialQuickActionIsolation(): void {
  const sim = createSimState();
  const personnelBefore = cloneJson(sim.personnelState);
  const containerBefore = cloneJson(sim.containerState);
  const vehicleBefore = cloneJson(sim.vehicleState);
  const cityBefore = cloneJson(sim.gameState.city);

  const quick = applySocialQuickAction(sim.socialPulseState, {
    topicId: sim.socialPulseState.activeTopics[0]?.id,
    action: 'communicate',
    day: 1,
  });

  if (!quick.success) {
    fail('social quick action', quick.message ?? 'communicate failed');
    return;
  }

  if (JSON.stringify(personnelBefore) === JSON.stringify(sim.personnelState)) {
    pass('quick action does not mutate personnelState');
  } else {
    fail('quick action personnel leak', 'personnelState changed without store apply');
  }

  if (JSON.stringify(containerBefore) === JSON.stringify(sim.containerState)) {
    pass('quick action does not mutate containerState');
  } else {
    fail('quick action container leak', 'containerState changed');
  }

  if (JSON.stringify(vehicleBefore) === JSON.stringify(sim.vehicleState)) {
    pass('quick action does not mutate vehicleState');
  } else {
    fail('quick action vehicle leak', 'vehicleState changed');
  }

  if (JSON.stringify(cityBefore) === JSON.stringify(sim.gameState.city)) {
    pass('quick action does not mutate game city metrics');
  } else {
    fail('quick action metrics leak', 'city metrics changed in sim object');
  }

  if (quick.state.outcomeHistory.length > sim.socialPulseState.outcomeHistory.length) {
    pass('quick action appends social outcomeHistory');
  } else {
    fail('quick action outcomeHistory', 'no new outcome entry');
  }
}

function verifyPersistHydrate(): void {
  if (SAVE_VERSION === 20) {
    pass('SAVE_VERSION is current (20)');
  } else {
    fail('SAVE_VERSION', `expected 20, got ${SAVE_VERSION}`);
  }

  const bundle = createDay1Seed();
  const fullSave = {
    saveVersion: 6,
    gameState: bundle.gameState,
    economyState: createInitialEconomyState(),
    personnelState: createInitialPersonnelState(),
    containerState: createInitialContainerState(1),
    vehicleState: createInitialVehicleState(1),
    socialPulseState: createInitialSocialPulseState(1),
    neighborhoods: bundle.neighborhoods,
    resources: bundle.resources,
    eventPool: bundle.eventPool,
    decisionHistory: [],
    snapshots: [],
    tutorialState: { skipped: false, completedSteps: [] },
    bestPilotScores: [],
    updatedAt: new Date().toISOString(),
  };

  const hydrated = normalizePersistedSave(fullSave);
  if (
    hydrated &&
    hydrated.personnelState.teams.length > 0 &&
    hydrated.containerState.units.length > 0 &&
    hydrated.vehicleState.units.length > 0 &&
    Object.keys(hydrated.socialPulseState.neighborhoods).length >= 5
  ) {
    pass('persist hydrate v6 full save normalizes all subsystem states');
  } else {
    fail('persist hydrate v6', 'missing subsystem state after normalize');
  }

  const legacy = normalizePersistedSave({
    saveVersion: 5,
    gameState: bundle.gameState,
    economyState: createInitialEconomyState(),
    neighborhoods: bundle.neighborhoods,
    resources: bundle.resources,
    eventPool: bundle.eventPool,
    decisionHistory: [],
    snapshots: [],
    tutorialState: { skipped: false, completedSteps: [] },
    updatedAt: new Date().toISOString(),
  });

  if (
    legacy &&
    legacy.containerState.units.length > 0 &&
    legacy.vehicleState.units.length > 0 &&
    Object.keys(legacy.socialPulseState.neighborhoods).length >= 5
  ) {
    pass('persist hydrate v5 fallback seeds container/vehicle/social');
  } else {
    fail('persist hydrate v5', 'fallback seed failed');
  }

  if (normalizePersistedSave({ saveVersion: 99 }) == null) {
    pass('persist hydrate rejects unknown saveVersion');
  } else {
    fail('persist hydrate version guard', 'accepted invalid saveVersion');
  }
}

function verifyLeaderboardSlice(): void {
  const entry: LeaderboardEntry = {
    id: 'pilot-test-entry',
    playerName: 'Test',
    neighborhoodId: 'merkez',
    neighborhoodName: 'Merkez',
    category: 'overall',
    period: 'pilot',
    score: 780,
    baseScore: 800,
    difficultyMultiplier: 1,
    penalties: [],
    title: 'Pilot Test',
    breakdown: {
      citizenSatisfaction: 72,
      riskControl: 68,
      budgetEfficiency: 68,
      personnelSustainability: 70,
      complaintResolution: 75,
      butterflyControl: 72,
      neighborhoodFit: 74,
    },
    completedAt: new Date().toISOString(),
    isCurrentPlayer: true,
    runId: 'pilot-run-test-1',
  };
  const updated = appendPilotLeaderboardIfNew(
    { bestPilotScores: [], lastPilotScore: undefined },
    entry,
  );
  if (updated.bestPilotScores.length === 1 && updated.lastPilotScore?.id === entry.id) {
    pass('leaderboard append updates bestPilotScores and lastPilotScore');
  } else {
    fail('leaderboard append', 'unexpected leaderboard slice');
  }
}

function verifyRoutesExist(): void {
  const root = resolve(process.cwd(), 'src', 'app');
  const required = [
    'leaderboard.tsx',
    'risks/index.tsx',
    'events/pilot-final-report.tsx',
    'reports/index.tsx',
    'index.tsx',
  ];
  const socialRouteCandidates = ['social.tsx', 'social/index.tsx'];
  const missing = required.filter((rel) => !existsSync(resolve(root, rel)));
  const hasSocialRoute = socialRouteCandidates.some((rel) =>
    existsSync(resolve(root, rel)),
  );
  if (!hasSocialRoute) {
    missing.push(socialRouteCandidates.join(' or '));
  }
  if (missing.length === 0) {
    pass('expo-router files exist for hub/report/social/leaderboard/risks/pilot-final');
  } else {
    fail('route files', `missing: ${missing.join(', ')}`);
  }
}

export function verifyPilotSystemsIntegration(): {
  ok: boolean;
  pass: number;
  warn: number;
  fail: number;
  checks: IntegrationCheck[];
} {
  checks.length = 0;
  failCount = 0;
  warnCount = 0;
  passCount = 0;

  verifyDay1Seed();
  verifyTutorialReportCopy();
  verifyPersistHydrate();
  verifyLeaderboardSlice();
  verifyRoutesExist();
  verifySocialQuickActionIsolation();
  verifyApplyDecisionSubsystems();
  verifySevenDayFlow();

  return {
    ok: failCount === 0,
    pass: passCount,
    warn: warnCount,
    fail: failCount,
    checks,
  };
}

function main(): void {
  const result = verifyPilotSystemsIntegration();

  console.log('\nCrevia — Pilot Systems Integration QA\n');
  for (const check of result.checks) {
    console.log(`[${check.severity}] ${check.name} — ${check.detail}`);
  }

  const verdict =
    result.fail > 0 ? 'FAIL' : result.warn > 0 ? 'WARN' : 'PASS';
  console.log(
    `\nÖZET: PASS=${result.pass}  WARN=${result.warn}  FAIL=${result.fail}`,
  );
  console.log(`Pilot Systems Integration QA ${verdict}\n`);

  if (!result.ok) {
    process.exit(1);
  }
}

const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv[1] != null &&
  /verify-pilot-systems-integration/i.test(process.argv[1]);

if (isDirectRun) {
  main();
}
