import { EXPECTED_SAVE_VERSION_FOR_VERIFY } from '@/core/quality/saveVersionPolicy';
import { SAVE_VERSION } from '@/store/gamePersist';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  buildDispatchReadinessFromContext,
  buildEceReadinessHint,
  buildFieldResourcePulseFromContext,
  buildOperationReadinessSnapshot,
  buildReportReadinessInsight,
  buildResultResourceCostFromContext,
  deriveReadinessOverallStatus,
} from './operationReadinessPresentation';
import { buildReadinessSignals } from './operationReadinessModel';
import { READINESS_DOMAINS, READINESS_STATUSES } from './operationReadinessTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

function assert(checks: string[], ok: boolean, pass: string, fail = pass): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

export function verifyOperationReadinessScenario(): { ok: boolean; checks: string[] } {
  const checks: string[] = [];
  let failCount = 0;
  const record = (ok: boolean) => {
    if (!ok) failCount += 1;
  };

  for (const domain of READINESS_DOMAINS) {
    record(assert(checks, READINESS_DOMAINS.includes(domain), `domain ${domain}`));
  }
  for (const status of READINESS_STATUSES) {
    record(assert(checks, READINESS_STATUSES.includes(status), `status ${status}`));
  }

  const emptySnapshot = buildOperationReadinessSnapshot({ phase: 'dispatch' });
  record(assert(checks, emptySnapshot.overallStatus === 'unknown' || emptySnapshot.overallStatus === 'blocked', 'empty fallback safe'));
  record(assert(checks, emptySnapshot.summary.length > 10, 'empty summary'));

  const blockedSnapshot = buildOperationReadinessSnapshot({
    phase: 'dispatch',
    assignmentStatus: 'missing',
    hasVehicle: false,
  });
  record(assert(checks, blockedSnapshot.overallStatus === 'blocked', 'blocked overall'));
  record(assert(checks, blockedSnapshot.blockers.length >= 1, 'blocked has blockers'));

  const strainedSignals = buildReadinessSignals({
    phase: 'dispatch',
    assignmentStatus: 'ready',
    hasVehicle: true,
    compatibilityBand: 'low',
    planStrategyId: 'rapid_response',
    publicSatisfactionPreview: -3,
  });
  const strainedOverall = deriveReadinessOverallStatus(strainedSignals, 'ready');
  record(
    assert(
      checks,
      strainedOverall === 'strained' || strainedOverall === 'limited' || strainedOverall === 'blocked',
      'strained derive',
    ),
  );

  const dispatchPanel = buildDispatchReadinessFromContext({
    assignmentStatus: 'ready',
    hasVehicle: true,
    compatibilityBand: 'high',
    compatibilityTone: 'positive',
    planStrategyId: 'balanced_plan',
    publicSatisfactionPreview: 0,
  });
  record(assert(checks, dispatchPanel.items.length === 4, 'dispatch max 4 items'));
  record(assert(checks, dispatchPanel.items.every((item) => item.label.length > 0), 'dispatch labels'));
  record(assert(checks, dispatchPanel.items.every((item) => item.statusLabel.length > 0), 'dispatch status labels'));
  record(assert(checks, dispatchPanel.items.every((item) => item.reason.length > 0), 'dispatch descriptions'));

  const fieldPulse = buildFieldResourcePulseFromContext({
    phase: 'field',
    hasVehicle: true,
    assignmentEffectBand: 'medium',
    planStrategyId: 'balanced_plan',
    eventRiskLevel: 'medium',
  });
  record(assert(checks, fieldPulse.items.length <= 4 && fieldPulse.items.length >= 3, 'field pulse items'));
  record(assert(checks, fieldPulse.items.every((item) => item.value.length > 0), 'field pulse values'));

  const resultCost = buildResultResourceCostFromContext({
    phase: 'result',
    planStrategyId: 'rapid_response',
    moraleDelta: -4,
    budgetDelta: -2,
    outcomeTone: 'mixed',
  });
  record(assert(checks, resultCost.summary.length > 10, 'result cost summary'));
  record(assert(checks, resultCost.items.length >= 3, 'result cost items'));

  const reportLine = buildReportReadinessInsight(blockedSnapshot, []);
  record(assert(checks, Boolean(reportLine && reportLine.length > 15), 'report insight non-empty'));

  const eceHint = buildEceReadinessHint(
    buildOperationReadinessSnapshot({
      phase: 'dispatch',
      assignmentStatus: 'ready',
      hasVehicle: true,
      compatibilityBand: 'high',
      compatibilityTone: 'positive',
    }),
    [],
  );
  record(assert(checks, eceHint == null || eceHint.length <= 120, 'ece hint bounded'));

  const deduped = buildReportReadinessInsight(blockedSnapshot, [blockedSnapshot.summary]);
  record(assert(checks, deduped == null || !deduped.includes(blockedSnapshot.summary.slice(0, 12)), 'report dedupe'));

  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION_FOR_VERIFY, 'SAVE_VERSION unchanged'));
  record(assert(checks, !readRepo('src/store/gamePersist.ts').includes('operationReadiness'), 'persist unchanged'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('operationReadiness'), 'applyDecision unchanged'));
  record(
    assert(
      checks,
      !readRepo('src/core/eventSelection/eventSelectionConstants.ts').includes('operationReadiness'),
      'eventSelectionConstants unchanged',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/events/utils/eventDispatchPhasePresentation.ts').includes('buildDispatchReadinessFromContext'),
      'dispatch wired',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/events/utils/eventFieldPhasePresentation.ts').includes('buildOperationReadinessSnapshot'),
      'field wired',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/events/utils/eventResultRevealPresentation.ts').includes('buildResultResourceCostFromContext'),
      'result wired',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/reports/utils/endOfDayReportPresentation.ts').includes('operationalTempoLine'),
      'report wired',
    ),
  );
  record(assert(checks, existsSync(join(REPO_ROOT, 'src/core/operationReadiness/index.ts')), 'index exists'));

  return { ok: failCount === 0, checks };
}
