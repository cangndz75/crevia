import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runNoNewSystemFreezeAudit } from '@/core/releaseReadiness/noNewSystemFreezeAudit';
import { verifyNoNewSystemFreezeScenario } from '@/core/releaseReadiness/verifyNoNewSystemFreezeScenario';
import { runSoftLaunchReadinessReview } from '@/core/releaseReadiness/softLaunchReviewAudit';
import { verifySoftLaunchReviewScenario } from '@/core/releaseReadiness/verifySoftLaunchReviewScenario';
import { verifyDistrictOperationsRuntimeScenario } from '@/core/districtOperationsRuntime/verifyDistrictOperationsRuntimeScenario';
import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  DISTRICT_OPERATION_ACTION_PERSISTENCE_REVIEW_DOCS_PATH,
  runDistrictOperationActionPersistenceReviewAudit,
} from './districtOperationActionPersistenceReviewAudit';
import {
  buildDistrictOperationActionPersistenceConsoleSummary,
  buildDistrictOperationActionPersistenceReviewMarkdown,
} from './districtOperationActionPersistenceReviewPresentation';
import { verifyDistrictOperationActionScenario } from './verifyDistrictOperationActionScenario';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyDistrictOperationActionPersistenceReviewOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  reviewHealth: string;
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, message: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${message}`);
  return ok;
}

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function scenarioOk(outcome: { ok: boolean; checks: string[] }): boolean {
  return outcome.ok && !outcome.checks.some((line) => line.startsWith('FAIL'));
}

export function verifyDistrictOperationActionPersistenceReviewScenario(): VerifyDistrictOperationActionPersistenceReviewOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const result = runDistrictOperationActionPersistenceReviewAudit({ mode: 'review_only' });

  ok = assert(checks, result.sessionOnly, 'Current model session-only', 'Not session-only') && ok;
  ok =
    assert(
      checks,
      !result.saveImpact.persistShapeChanged,
      'Persist shape unchanged',
      'Persist shape changed',
    ) && ok;
  ok =
    assert(
      checks,
      !result.saveImpact.saveVersionChanged && SAVE_VERSION === 25,
      'SAVE_VERSION unchanged (23)',
      `SAVE_VERSION=${SAVE_VERSION}`,
    ) && ok;
  ok = assert(checks, !result.persistAdded, 'Persist NOT added', 'Persist added!') && ok;
  ok =
    assert(checks, !result.runtimeGameplayChanged, 'Runtime gameplay NOT changed', 'Gameplay changed!') && ok;

  const dailyMaxArea = result.areaResults.find((a) => a.area === 'daily_max_one_action');
  ok =
    assert(
      checks,
      dailyMaxArea?.health === 'PASS',
      'Daily max 1 action rule referenced',
      dailyMaxArea?.message ?? 'missing',
    ) && ok;

  const idempotencyArea = result.areaResults.find((a) => a.area === 'idempotency');
  ok =
    assert(
      checks,
      idempotencyArea?.health === 'PASS',
      'Idempotency referenced',
      idempotencyArea?.message ?? 'missing',
    ) && ok;

  const visibilityAreas = result.areaResults.filter((a) => a.area === 'day_visibility_guards');
  ok =
    assert(
      checks,
      visibilityAreas.length >= 3 && visibilityAreas.every((a) => a.health === 'PASS'),
      'Day 1 hidden / Day 2-3 preview / Day 4+ selectable',
      `visibility areas=${visibilityAreas.length}`,
    ) && ok;

  ok =
    assert(
      checks,
      result.persistenceOptions.length >= 3,
      `>=3 persistence options (${result.persistenceOptions.length})`,
      `options=${result.persistenceOptions.length}`,
    ) && ok;

  const optionIds = result.persistenceOptions.map((o) => o.id);
  ok =
    assert(
      checks,
      optionIds.includes('keep_session_only') &&
        optionIds.includes('persist_daily_selected_summary') &&
        optionIds.includes('persist_action_history_window'),
      'Options A/B/C present',
      optionIds.join(', '),
    ) && ok;

  ok =
    assert(
      checks,
      result.v11Backlog.length >= 4,
      'V1.1 backlog recommendation present',
      `backlog=${result.v11Backlog.length}`,
    ) && ok;

  ok =
    assert(
      checks,
      result.telemetryQuestions.length >= 8,
      `Telemetry questions >= 8 (${result.telemetryQuestions.length})`,
      `questions=${result.telemetryQuestions.length}`,
    ) && ok;

  const sf = result.softLaunchFindings;
  ok =
    assert(
      checks,
      sf.persistenceReviewPresent,
      'district_action.persistence_review_present',
      'Missing persistence review',
    ) && ok;
  ok =
    assert(
      checks,
      sf.sessionOnlyCurrent,
      'district_action.session_only_current',
      'Not session-only',
    ) && ok;
  ok =
    assert(
      checks,
      sf.persistNotRequiredForSoftLaunch,
      'district_action.persist_not_required_for_soft_launch',
      'Persist required incorrectly',
    ) && ok;
  ok =
    assert(
      checks,
      sf.v11PersistenceBacklogDefined,
      'district_action.v11_persistence_backlog_defined',
      'Backlog missing',
    ) && ok;
  ok =
    assert(
      checks,
      sf.saveVersionUnchanged,
      'district_action.save_version_unchanged',
      'SAVE_VERSION changed',
    ) && ok;

  const softLaunch = runSoftLaunchReadinessReview({ mode: 'internal_device_test' });
  const districtFindings = softLaunch.findings.filter((f) => f.id.startsWith('district_action.'));
  ok =
    assert(
      checks,
      districtFindings.length >= 5,
      `Soft launch district_action findings (${districtFindings.length})`,
      `findings=${districtFindings.length}`,
    ) && ok;

  const freeze = runNoNewSystemFreezeAudit({ mode: 'internal_device_test' });
  ok =
    assert(
      checks,
      result.freezeCompliant,
      'No-New-System Freeze compliant (review-only)',
      `freezeCompliant=${result.freezeCompliant}`,
    ) && ok;
  ok =
    assert(
      checks,
      !freeze.violations.some((v) => v.id === 'risk.save_version_bump'),
      'Freeze SAVE_VERSION violation absent',
      'SAVE_VERSION bump detected',
    ) && ok;

  ok = assert(checks, scenarioOk(verifyDistrictOperationActionScenario()), 'verify:district-operation-actions', 'broken') && ok;
  ok =
    assert(
      checks,
      scenarioOk(verifyDistrictOperationsRuntimeScenario()),
      'verify:district-operations-runtime',
      'broken',
    ) && ok;
  ok = assert(checks, verifyNoNewSystemFreezeScenario().ok, 'verify:no-new-system-freeze', 'broken') && ok;
  ok = assert(checks, verifySoftLaunchReviewScenario().ok, 'verify:soft-launch-review', 'broken') && ok;

  const fullLoop = runFullLoopAnalysis();
  ok = assert(checks, fullLoop.totalFAIL === 0, 'verify:full-loop', `${fullLoop.totalFAIL} FAIL`) && ok;
  ok = assert(checks, verifyFullUxFlowScenario().ok, 'verify:full-ux-flow', 'broken') && ok;

  const markdown = buildDistrictOperationActionPersistenceReviewMarkdown(result);
  ok = assert(checks, markdown.includes('## Persistence seçenekleri'), 'Markdown persistence options', 'missing') && ok;
  ok = assert(checks, markdown.includes('## Telemetry karar soruları'), 'Markdown telemetry section', 'missing') && ok;

  const consoleSummary = buildDistrictOperationActionPersistenceConsoleSummary(result);
  ok = assert(checks, consoleSummary.length > 200, 'Console summary non-empty', 'empty') && ok;

  const doc = readRepo(DISTRICT_OPERATION_ACTION_PERSISTENCE_REVIEW_DOCS_PATH);
  ok = assert(checks, doc.length > 300, 'Persistence review docs exist', 'missing docs') && ok;

  if (result.health === 'WARN') hasWarn = true;
  if (result.risks.some((r) => r.severity === 'warning')) hasWarn = true;
  if (!warn(checks, result.health !== 'BLOCKED', 'Review not BLOCKED', `health=${result.health}`)) {
    hasWarn = true;
  }

  return {
    ok,
    warn: hasWarn,
    checks,
    reviewHealth: result.health,
  };
}
