import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { verifyDistrictOperationsRuntimeScenario } from '@/core/districtOperationsRuntime/verifyDistrictOperationsRuntimeScenario';
import { verifyDistrictTrustRuntimeScenario } from '@/core/districtTrustRuntime/verifyDistrictTrustRuntimeScenario';
import { verifyDistrictMemoryRuntimeScenario } from '@/core/districtMemoryRuntime/verifyDistrictMemoryRuntimeScenario';
import { verifyReportSystemsIntegrationScenario } from '@/core/reports/verifyReportSystemsIntegrationScenario';
import { verifyHubOpenEndedIntegrationScenario } from '@/core/hub/verifyHubOpenEndedIntegrationScenario';
import { verifyMapDistrictIntelligenceScenario } from '@/core/map/verifyMapDistrictIntelligenceScenario';
import { verifyAnalyticsNewSystemsScenario } from '@/core/analytics/verifyAnalyticsNewSystemsScenario';

import {
  applyDistrictOperationActionEffects,
  buildDistrictOperationActionCandidates,
  buildDistrictOperationActionDailySummary,
  createInitialDistrictOperationActionState,
  selectDistrictOperationAction,
} from './districtOperationActionEngine';
import {
  buildDistrictOperationActionAnalyticsPayload,
  buildDistrictOperationActionHubCopy,
  buildDistrictOperationActionMapCopy,
  validateDistrictOperationActionCopy,
} from './districtOperationActionPresentation';

export type VerifyDistrictOperationActionOutcome = {
  ok: boolean;
  checks: string[];
};

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(rel: string): string {
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function record(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function scenarioOk(outcome: { ok: boolean; checks: string[] }): boolean {
  return outcome.ok && !outcome.checks.some((line) => line.startsWith('FAIL'));
}

export function verifyDistrictOperationActionScenario(): VerifyDistrictOperationActionOutcome {
  const checks: string[] = [];
  let ok = true;
  const emptyState = createInitialDistrictOperationActionState();

  const day1 = buildDistrictOperationActionCandidates({ day: 1, focusDistrictId: 'merkez' });
  ok = record(checks, day1.length === 0, 'Day 1 action hidden', 'Day 1 action visible') && ok;

  const day2 = buildDistrictOperationActionCandidates({ day: 2, focusDistrictId: 'merkez' });
  ok = record(
    checks,
    day2.length > 0 && day2.every((action) => action.status === 'preview_only' && !action.isSelectableNow),
    'Day 2-3 preview_only',
    'Day 2-3 selectable too early',
  ) && ok;

  const day4 = buildDistrictOperationActionCandidates({
    day: 4,
    focusDistrictId: 'merkez',
    selectedByDay: emptyState.selectedByDay,
    recentDistrictOperationKeys: emptyState.recentDistrictOperationKeys,
  });
  const action = day4[0]!;
  ok = record(checks, !!action && action.status === 'available', 'Day 4+ action candidate available', 'Day 4 action unavailable') && ok;

  const selected = selectDistrictOperationAction(emptyState, action);
  const selectedAgain = selectDistrictOperationAction(selected, action);
  ok = record(
    checks,
    Object.keys(selected.selectedByDay).length === 1 &&
      selectedAgain.selectedByDay[action.day]?.id === selected.selectedByDay[action.day]?.id,
    'max 1 action per day and idempotent reselection',
    'daily max/idempotency failed',
  ) && ok;

  const blockedAfterSelection = buildDistrictOperationActionCandidates({
    day: 4,
    focusDistrictId: 'cumhuriyet',
    selectedByDay: selected.selectedByDay,
    recentDistrictOperationKeys: selected.recentDistrictOperationKeys,
  });
  ok = record(
    checks,
    blockedAfterSelection.every((candidate) => candidate.status === 'blocked'),
    'second same-day action blocked',
    'second same-day action allowed',
  ) && ok;

  const spamGuard = buildDistrictOperationActionCandidates({
    day: 5,
    focusDistrictId: action.districtId,
    recentDistrictOperationKeys: selected.recentDistrictOperationKeys,
  });
  ok = record(
    checks,
    spamGuard.every(
      (candidate) =>
        candidate.operationKind !== action.operationKind ||
        candidate.status === 'blocked',
    ),
    'same district/operation spam guard',
    'same district/operation spam allowed',
  ) && ok;

  const signals = createInitialOperationSignalsState(4);
  const afterSignals = applyDistrictOperationActionEffects(signals, action);
  const delta = Math.abs(afterSignals.overall.score - signals.overall.score);
  ok = record(
    checks,
    delta <= 4 && afterSignals.priorityDistrictId === action.districtId,
    'action effects produce small bounded delta',
    `action delta too large: ${delta}`,
  ) && ok;

  const crisisAction = buildDistrictOperationActionCandidates({
    day: 4,
    focusDistrictId: 'istasyon',
    crisisState: { status: 'critical', activeIncident: true },
  })[0]!;
  ok = record(
    checks,
    crisisAction.healthStatus === 'limited' &&
      validateDistrictOperationActionCopy(crisisAction) &&
      !buildDistrictOperationActionHubCopy(crisisAction).toLocaleLowerCase('tr-TR').includes('panik'),
    'crisis context limited without panic copy',
    'crisis action copy/limit failed',
  ) && ok;

  const summary = buildDistrictOperationActionDailySummary(selected, action.day);
  ok = record(
    checks,
    summary.reportLines.length <= 1 &&
      summary.tomorrowLines.length <= 1 &&
      summary.advisorLines.length <= 1,
    'report/tomorrow/advisor max one line',
    'summary duplicated lines',
  ) && ok;

  ok = record(
    checks,
    buildDistrictOperationActionHubCopy(action).includes(action.districtName) &&
      buildDistrictOperationActionMapCopy(action).length <= 96 &&
      action.ctaLabel !== 'Başlat',
    'Hub/Map CTA copy uses small-action language',
    'Hub/Map CTA copy invalid',
  ) && ok;

  const payload = buildDistrictOperationActionAnalyticsPayload(action);
  ok = record(
    checks,
    !!payload &&
      payload.districtId === action.districtId &&
      !JSON.stringify(payload).includes(action.reasonLine) &&
      !JSON.stringify(payload).includes(action.effect.summaryLine),
    'analytics payload is structured and raw-copy free',
    'analytics payload contains raw copy',
  ) && ok;

  ok = record(checks, SAVE_VERSION === 24, 'SAVE_VERSION unchanged without persist', `SAVE_VERSION ${SAVE_VERSION}`) && ok;
  ok = record(
    checks,
    !readRepo('src/store/gamePersist.ts').includes('districtOperationActionState'),
    'persist shape unchanged',
    'district action state persisted',
  ) && ok;
  ok = record(
    checks,
    !readRepo('src/core/game/ensureDailyEventsForDay.ts').includes('districtOperationActions') &&
      !readRepo('src/core/game/applyDecision.ts').includes('districtOperationActions') &&
      !readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts').includes('districtOperationActions'),
    'event generation/applyDecision/dayPipeline untouched',
    'forbidden runtime core touched',
  ) && ok;
  ok = record(
    checks,
    !readRepo('src/core/districtOperationActions/districtOperationActionEngine.ts').includes('Math.random'),
    'no Math.random',
    'Math.random present',
  ) && ok;
  ok = record(
    checks,
    readRepo('src/features/hub/components/HubOpenEndedOperationCard.tsx').includes(
      'DistrictOperationActionCard',
    ) &&
      readRepo('src/features/map/components/MapOperationBottomPanel.tsx').includes(
        'DistrictOperationActionCard',
      ),
    'Hub/Map selectable action binding',
    'Hub/Map selectable action binding missing',
  ) && ok;
  ok = record(
    checks,
    readRepo('src/features/reports/components/end-of-day/EndOfDayReportView.tsx').includes(
      'buildDistrictOperationActionDailySummary',
    ) &&
      readRepo('src/features/reports/components/end-of-day/EndOfDayReportView.tsx').includes(
        'districtOperationActionReportLine',
      ),
    'Report action summary binding',
    'Report action summary binding missing',
  ) && ok;
  ok = record(
    checks,
    readRepo('package.json').includes('verify:district-operation-actions'),
    'verify script registered',
    'verify script missing',
  ) && ok;

  ok = record(checks, scenarioOk(verifyDistrictOperationsRuntimeScenario()), 'districtOperationsRuntime verify', 'districtOperationsRuntime regression') && ok;
  ok = record(checks, scenarioOk(verifyDistrictTrustRuntimeScenario()), 'districtTrustRuntime verify', 'districtTrustRuntime regression') && ok;
  ok = record(checks, scenarioOk(verifyDistrictMemoryRuntimeScenario()), 'districtMemoryRuntime verify', 'districtMemoryRuntime regression') && ok;
  ok = record(checks, scenarioOk(verifyReportSystemsIntegrationScenario()), 'report systems verify', 'report systems regression') && ok;
  ok = record(checks, scenarioOk(verifyHubOpenEndedIntegrationScenario()), 'hub open-ended verify', 'hub open-ended regression') && ok;
  ok = record(checks, scenarioOk(verifyMapDistrictIntelligenceScenario()), 'map district intelligence verify', 'map district intelligence regression') && ok;
  ok = record(checks, scenarioOk(verifyAnalyticsNewSystemsScenario()), 'analytics new systems verify', 'analytics regression') && ok;

  return { ok, checks };
}
