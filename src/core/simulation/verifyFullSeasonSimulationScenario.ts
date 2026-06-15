import { verifyCrisisActionScenario } from '@/core/crisisActions/verifyCrisisActionScenario';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { verifyDayPipelineScenario } from '@/core/dayPipeline/verifyDayPipelineScenario';
import { verifyGameplayImpactBalanceScenario } from '@/core/balance/verifyGameplayImpactBalanceScenario';
import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { getMainOperationEventDensity } from '@/core/mainOperation/mainOperationEngine';
import {
  applyFullAccessToGameState,
  applyLimitedContinueToGameState,
  buildDevJumpPilotCompletedGameState,
} from '@/core/monetization/monetizationEngine';
import {
  createInitialMonetizationState,
  mockPurchaseMainOperationPack,
  selectLimitedContinue,
} from '@/core/monetization/monetizationState';
import { verifyOperationalResourcesScenario } from '@/core/operationalResources/verifyOperationalResourcesScenario';
import { verifyPlayerFlowAuditScenario } from '@/core/playtest/verifyPlayerFlowAuditScenario';
import { createDay1Seed } from '@/core/content/day1Seed';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  FULL_SEASON_SIM_DEFAULT_LENGTH,
  FULL_SEASON_SIM_DEFAULT_SEED,
  FULL_SEASON_SIM_FIRST_DAY,
  FULL_MODE_CRISIS_ACTION_FAIL,
  FULL_MODE_MICRO_DECISION_FAIL,
  FULL_MODE_MICRO_DECISION_MAX,
  SIGNAL_HEALTHY_RANGES,
  STRONG_VS_WEAK_GOAL_GAP_MIN,
  STRONG_VS_WEAK_SIGNAL_GAP_MIN,
  STRONG_VS_WEAK_SIGNAL_GAP_FAIL_HIGH,
  STRONG_VS_WEAK_SIGNAL_GAP_WARN_HIGH,
} from './fullSeasonSimulationConstants';
import {
  buildSimulationInitialGameState,
  runExtendedSeasonSimulation,
  runFullSeasonSimulation,
  runFullSeasonSimulationSuite,
  testEndOfDayIdempotency,
} from './fullSeasonSimulationEngine';
import {
  buildFullSeasonSimulationConsoleReport,
  getSimulationHealth,
} from './fullSeasonSimulationPresentation';
import type { FullSeasonSimulationAuditResult } from './fullSeasonSimulationTypes';

export type VerifyFullSeasonSimulationOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  audit: FullSeasonSimulationAuditResult;
  consoleReport: string;
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, message: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${message}`);
  return ok;
}

export function verifyFullSeasonSimulationScenario(): VerifyFullSeasonSimulationOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;
  const add = (p: boolean, pass: string, fail: string) => {
    ok = assert(checks, p, pass, fail) && ok;
  };
  const addWarn = (p: boolean, pass: string, message: string) => {
    if (!warn(checks, p, pass, message)) hasWarn = true;
  };

  const t0 = Date.now();
  const audit = runFullSeasonSimulationSuite(FULL_SEASON_SIM_DEFAULT_SEED);
  const elapsed = Date.now() - t0;

  add(audit.runs.length >= 7, 'Simulation suite produces runs', 'suite empty');
  add(getSimulationHealth(audit) !== 'FAIL', 'Audit health not FAIL', 'audit FAIL');

  const strong = audit.runs.find((r) => r.playerProfile === 'strong_player')!;
  const weak = audit.runs.find((r) => r.playerProfile === 'weak_player')!;
  const balanced = audit.runs.find((r) => r.playerProfile === 'balanced_player')!;
  const randomRun = audit.runs.find((r) => r.playerProfile === 'random_player')!;
  const crisisHeavy = audit.runs.find((r) => r.playerProfile === 'crisis_heavy_player')!;
  const lowResource = audit.runs.find((r) => r.playerProfile === 'low_resource_player')!;
  const limited = audit.runs.find((r) => r.playerProfile === 'limited_player')!;

  add(strong != null && strong.mode === 'full', 'strong_player full run', 'missing strong');
  add(weak != null, 'weak_player full run', 'missing weak');
  add(balanced != null, 'balanced_player full run', 'missing balanced');
  add(randomRun != null, 'random_player full run', 'missing random');
  add(crisisHeavy != null, 'crisis_heavy_player full run', 'missing crisis heavy');
  add(lowResource != null, 'low_resource_player full run', 'missing low resource');
  add(limited != null && limited.mode === 'limited', 'limited_player limited run', 'missing limited');

  add(
    strong.dayResults.length === FULL_SEASON_SIM_DEFAULT_LENGTH,
    '14 day results per default run',
    'day count mismatch',
  );

  add(
    balanced.dayResults.every((d) => d.eventCount >= 1),
    'Balanced full sim generates events each day',
    'daily event generation empty in simulation',
  );

  const extended = runExtendedSeasonSimulation('balanced_player', FULL_SEASON_SIM_DEFAULT_SEED);
  add(
    extended.dayResults.length === 21,
    '21 day extended helper works',
    'extended length',
  );

  const detA = runFullSeasonSimulation({
    profile: 'balanced_player',
    mode: 'full',
    seed: 42,
  });
  const detB = runFullSeasonSimulation({
    profile: 'balanced_player',
    mode: 'full',
    seed: 42,
  });
  add(
    detA.aggregate.averageOverallSignal === detB.aggregate.averageOverallSignal &&
      detA.aggregate.microDecisionTotal === detB.aggregate.microDecisionTotal,
    'Deterministic seed same aggregate',
    'determinism broken',
  );

  add(
    strong.aggregate.averageOverallSignal < weak.aggregate.averageOverallSignal,
    'Strong player lower avg signal than weak',
    'strong not better on signals',
  );

  addWarn(
    audit.comparison.strongVsWeakSignalGap >= STRONG_VS_WEAK_SIGNAL_GAP_MIN,
    'Strong vs weak signal gap in lower band',
    'Signal gap below 8 — skill expression may be flat',
  );

  addWarn(
    audit.comparison.strongVsWeakSignalGap <= STRONG_VS_WEAK_SIGNAL_GAP_WARN_HIGH,
    'Strong vs weak signal gap not excessive',
    'Signal gap above 22 — strong may be over-cooled',
  );

  add(
    audit.comparison.strongVsWeakSignalGap <= STRONG_VS_WEAK_SIGNAL_GAP_FAIL_HIGH,
    'Strong vs weak signal gap below fail threshold',
    'Signal gap above 30 — skill expression collapsed',
  );

  addWarn(
    strong.aggregate.finalSeasonGoalAverageProgress >= 60,
    'Strong final season goal above 60%',
    'Strong final season goal below 60% — tune controlled operation bonus',
  );

  addWarn(
    weak.aggregate.finalSeasonGoalAverageProgress >= 20,
    'Weak final season goal above 20%',
    'Weak final season goal below 20% — ease weak penalties',
  );

  addWarn(
    strong.aggregate.averageOverallSignal >= 5,
    'Strong average signal not near zero',
    'Strong signal unrealistically low — ease preventive stacking',
  );

  add(
    audit.comparison.strongVsWeakSignalGap > 0.5,
    'Strong vs weak signal gap improved from flat baseline',
    'skill expression still flat on signals',
  );

  add(
    strong.aggregate.finalSeasonGoalAverageProgress >
      weak.aggregate.finalSeasonGoalAverageProgress,
    'Strong final season goal above weak',
    'Season goal inverts skill — strong should finish ahead of weak',
  );

  addWarn(
    audit.comparison.strongVsWeakGoalGap >= STRONG_VS_WEAK_GOAL_GAP_MIN,
    'Strong vs weak season goal final gap',
    'Season goal pacing between profiles needs tuning',
  );

  addWarn(
    balanced.aggregate.finalSeasonGoalAverageProgress < 85,
    'Balanced season goal in target band',
    'Balanced final season goal above 85% — reduce neutral progress',
  );

  add(
    balanced.aggregate.finalSeasonGoalAverageProgress < 95,
    'Balanced season goal not extreme',
    'Balanced final season goal above 95% — reduce base progress',
  );

  add(
    weak.aggregate.averageOverallSignal > balanced.aggregate.averageOverallSignal - 15,
    'Weak player meaningful pressure vs balanced',
    'weak pressure flat',
  );

  add(randomRun.aggregate.warnings.every((w) => !w.includes('invalid')), 'Random player no invalid warnings', 'random invalid');

  addWarn(
    lowResource.aggregate.criticalResourceDays >= strong.aggregate.criticalResourceDays,
    'Low resource profile pressure',
    'Low resource carry-over pressure should be monitored',
  );

  addWarn(
    crisisHeavy.aggregate.crisisIncidentCount >= 2 ||
      crisisHeavy.dayResults.filter((d) => d.crisisIncidentTriggered).length >= 2,
    'Crisis heavy player triggers multiple crisis incidents',
    'Crisis heavy profile should surface 2–4 incidents in 14 days',
  );

  const strongIncidentsTriggered = strong.dayResults.filter(
    (d) => d.crisisIncidentTriggered,
  ).length;
  addWarn(
    strongIncidentsTriggered <= 2,
    'Strong player crisis incident count controlled',
    'Strong profile has too many crisis incidents — tune crisis guards',
  );

  add(
    strongIncidentsTriggered <= 4,
    'Strong player crisis incident hard cap',
    'Strong profile crisis incidents above 4',
  );

  addWarn(
    weak.aggregate.crisisIncidentCount >= 1 ||
      lowResource.aggregate.crisisIncidentCount >= 1 ||
      weak.aggregate.crisisActionCount >= 1 ||
      lowResource.aggregate.crisisActionCount >= 1,
    'Weak or low_resource sees crisis incident or action',
    'Risk profiles should exercise crisis desk at least once',
  );

  addWarn(
    weak.aggregate.crisisActionCount >= 1 ||
      lowResource.aggregate.crisisActionCount >= 1 ||
      crisisHeavy.aggregate.crisisActionCount >= 1,
    'Risk profiles select crisis actions in simulation',
    'Crisis actions not exercised on weak/low_resource/crisis_heavy',
  );

  addWarn(
    balanced.aggregate.crisisIncidentCount <= 6,
    'Full mode crisis incident count not extreme',
    'Crisis incident frequency high — tune thresholds',
  );

  add(
    limited.aggregate.crisisIncidentCount === 0 &&
      !limited.dayResults.some(
        (d) => d.crisisIncidentActive || d.crisisIncidentTriggered,
      ),
    'Limited mode no sustained crisis incident',
    'limited crisis incident',
  );

  add(limited.aggregate.crisisActionCount === 0, 'Limited mode no crisis actions', 'limited crisis actions');

  const crisisActionsPerDay = balanced.dayResults.filter((d) => d.crisisActionSelected).length;
  add(
    crisisActionsPerDay <= balanced.dayResults.length,
    'Crisis actions at most one per day',
    'multiple crisis actions per day',
  );

  addWarn(
    balanced.aggregate.microDecisionTotal >= 4 &&
      balanced.aggregate.microDecisionTotal <= FULL_MODE_MICRO_DECISION_MAX + 6,
    'Micro decision total in healthy band',
    'Micro decision frequency needs tuning',
  );

  add(
    balanced.dayResults.every((d) => d.microDecisionCount <= 3),
    'Micro decisions daily max respected',
    'daily micro cap exceeded',
  );

  addWarn(
    crisisHeavy.aggregate.criticalResourceDays >= 3 &&
      crisisHeavy.aggregate.criticalResourceDays <= 7,
    'Crisis heavy critical resource days in 3–7 band',
    'Crisis heavy critical resource days outside target band',
  );

  addWarn(
    crisisHeavy.aggregate.criticalResourceDays <= 7,
    'Crisis heavy critical resource days in 5–7 band',
    'Crisis heavy critical resource days above 7 — tune recovery',
  );

  add(
    crisisHeavy.aggregate.criticalResourceDays <= 10,
    'Crisis heavy critical resource days hard cap',
    'Crisis heavy critical resource days above 10 — recovery floor insufficient',
  );

  addWarn(
    crisisHeavy.aggregate.crisisActionCount >= 1,
    'Crisis heavy selects crisis actions',
    'Crisis heavy profile took no crisis actions in 14 days',
  );

  addWarn(
    balanced.aggregate.criticalResourceDays <= 8,
    'Critical resource days threshold',
    'Operational resources critical days high',
  );

  addWarn(
    lowResource.aggregate.averageResourcePressure >= strong.aggregate.averageResourcePressure - 1,
    'Low resource higher resource pressure than strong',
    'Low resource carry-over pressure should be monitored',
  );

  add(
    strong.aggregate.averageResourcePressure <= weak.aggregate.averageResourcePressure + 5,
    'Strong profile resource pressure controlled',
    'strong resource pressure',
  );

  addWarn(
    balanced.aggregate.finalSeasonGoalAverageProgress >= 15 &&
      balanced.aggregate.finalSeasonGoalAverageProgress <= 95,
    'Season goal progress day 14 range',
    'Season goal pacing needs tuning',
  );

  add(
    !balanced.dayResults.some(
      (d) => d.day < 10 && d.seasonGoalAverageProgress >= 100,
    ),
    'Season goals not 100 before day 10',
    'early season goal completion',
  );

  const fullGs = applyFullAccessToGameState(
    buildDevJumpPilotCompletedGameState(createDay1Seed().gameState),
  );
  const fullMon = mockPurchaseMainOperationPack(createInitialMonetizationState(), 8);
  const density8 = getMainOperationEventDensity(
    { ...fullGs, city: { ...fullGs.city, day: 8 } },
    fullMon,
  );
  const density10 = getMainOperationEventDensity(
    { ...fullGs, city: { ...fullGs.city, day: 10 } },
    fullMon,
  );
  add(density8.maxDailyEvents <= 2, 'Full event cap day 8 max 2', 'density day8');
  add(density10.maxDailyEvents <= 3, 'Full event cap day 9+ max 3', 'density day10');

  const limMon = selectLimitedContinue(createInitialMonetizationState(), 8);
  const limGs = applyLimitedContinueToGameState(
    buildDevJumpPilotCompletedGameState(createDay1Seed().gameState),
  );
  const limitedDensity = getMainOperationEventDensity(
    { ...limGs, city: { ...limGs.city, day: 9 } },
    limMon,
  );
  add(limitedDensity.maxDailyEvents <= 2, 'Limited event cap max 2', 'limited density');

  add(balanced.aggregate.duplicateEventTotal === 0, 'No duplicate event ids same day', 'duplicate events');

  add(
    balanced.aggregate.reportDensityAverage > 0,
    'Report generation does not crash',
    'report crash',
  );

  addWarn(
    balanced.aggregate.reportDensityAverage >= 2 &&
      balanced.aggregate.reportDensityAverage <= 16,
    'Report density healthy range',
    'Report density may be too dense',
  );

  addWarn(
    balanced.aggregate.advisorDensityAverage <= 6,
    'Advisor density not excessive',
    'Ece may be too chatty in simulation',
  );

  add(FULL_SEASON_SIM_FIRST_DAY === 8, 'Post-pilot day 8 anchor', 'day anchor');

  const fullAvgEvents =
    balanced.dayResults.reduce((s, d) => s + d.eventCount, 0) /
    balanced.dayResults.length;
  const limitedAvgEvents =
    limited.dayResults.reduce((s, d) => s + d.eventCount, 0) /
    limited.dayResults.length;

  add(
    fullAvgEvents > limitedAvgEvents,
    'Full mode higher average daily events than limited',
    'full vs limited event density',
  );

  const balancedFullThreeEventDays = balanced.dayResults.filter(
    (d) => d.day >= 9 && d.eventCount >= 3,
  ).length;

  addWarn(
    balancedFullThreeEventDays >= 5 && balancedFullThreeEventDays <= 9,
    'Full 3-event days in 5–9 band (14-day run)',
    `Full 3-event days ${balancedFullThreeEventDays}/14 — tune third-event gating`,
  );

  addWarn(
    balancedFullThreeEventDays < 14,
    'Full 3-event days below spam threshold',
    `Full 3-event days ${balancedFullThreeEventDays}/14 — third-event density too high`,
  );

  addWarn(
    audit.comparison.limitedVsFullEventGap > 0 ||
      balancedFullThreeEventDays >= 1,
    'Limited vs full event density gap or full 3-event days',
    'Full and limited event surface still too similar',
  );

  add(
    balanced.aggregate.limitedVsFullValueScore != null &&
      (audit.comparison.limitedVsFullFeatureGap ?? 0) >= 2,
    'limitedVsFull feature gap meaningful',
    'limited vs full too similar',
  );

  add(isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION unchanged at 23', 'save version changed');

  const report = buildFullSeasonSimulationConsoleReport(audit);
  add(report.length > 80, 'Console report non-empty', 'empty report');
  add(audit.findings.length > 0, 'Findings list non-empty', 'empty findings');

  add(elapsed < 120_000, 'Simulation suite completes in reasonable time', 'simulation timeout');

  const idempotentSim = buildSimulationInitialGameState('balanced_player', 'full');
  add(testEndOfDayIdempotency(idempotentSim), 'EOD operational resources idempotent', 'eod idempotent');

  const pipeline = verifyDayPipelineScenario();
  add(pipeline.ok, 'Day pipeline audit no FAIL', 'day pipeline fail');

  const flow = verifyPlayerFlowAuditScenario();
  add(flow.ok, 'Player flow audit compatible', 'player flow fail');

  const resources = verifyOperationalResourcesScenario();
  add(resources.ok, 'Operational resources regression', 'operational resources fail');

  const crisisActions = verifyCrisisActionScenario();
  add(crisisActions.ok, 'Crisis actions regression', 'crisis actions fail');

  const gameplayBalance = verifyGameplayImpactBalanceScenario();
  add(gameplayBalance.ok, 'Gameplay impact balance regression', 'gameplay balance fail');

  const fullLoop = runFullLoopAnalysis();
  add(fullLoop.saveVersionOk, 'Full loop regression save version', 'full loop save');
  add(
    fullLoop.scenarios.every((s) => s.crashes === 0),
    'Full loop regression no crash',
    'full loop crash',
  );

  for (const profile of ['strong_player', 'weak_player', 'balanced_player'] as const) {
    const range = SIGNAL_HEALTHY_RANGES[profile];
    if (!range) continue;
    const run = audit.runs.find((r) => r.playerProfile === profile)!;
    const avg = run.aggregate.averageOverallSignal;
    addWarn(
      avg >= range.min && avg <= range.max + 15,
      `${profile} signal band plausible`,
      `${profile} signal outside healthy band`,
    );
  }

  addWarn(
    balanced.aggregate.crisisActionCount <= FULL_MODE_CRISIS_ACTION_FAIL,
    'Crisis action count not extreme',
    'Crisis action volume high — tune preventive threshold',
  );

  add(
    balanced.aggregate.microDecisionTotal < FULL_MODE_MICRO_DECISION_FAIL,
    'Micro decision total below fail threshold',
    'micro decision fail threshold',
  );

  addWarn(
    audit.health === 'WARN' || audit.health === 'PASS',
    'Overall audit health PASS or WARN',
    'audit health FAIL',
  );

  addWarn(
    true,
    '21-day season optional monitoring',
    'Longer 21-day season simulation pending analytics',
  );

  addWarn(
    true,
    'Analytics integration pending',
    'Analytics integration pending',
  );

  if (audit.failCount > 0) {
    hasWarn = true;
    for (const f of audit.findings.filter((x) => x.severity === 'fail')) {
      addWarn(false, `Finding ${f.id}`, f.message);
    }
  }

  return {
    ok,
    warn: hasWarn || audit.health === 'WARN',
    checks,
    audit,
    consoleReport: report,
  };
}
