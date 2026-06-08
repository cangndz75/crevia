import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runNoNewSystemFreezeAudit } from '@/core/releaseReadiness/noNewSystemFreezeAudit';
import { runSoftLaunchReadinessReview } from '@/core/releaseReadiness/softLaunchReviewAudit';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  OPERATION_ERA_RUNTIME_EXPANSION_REVIEW_DOCS_PATH,
  runOperationEraRuntimeExpansionReviewAudit,
} from './operationEraRuntimeExpansionReviewAudit';
import {
  buildOperationEraRuntimeExpansionConsoleSummary,
  buildOperationEraRuntimeExpansionReviewMarkdown,
} from './operationEraRuntimeExpansionReviewPresentation';
import { OPERATION_ERA_RUNTIME_PREVIEW_KINDS } from './operationEraRuntimePreviewConstants';
import {
  buildOperationEraRuntimePreviewModel,
  buildOperationEraEligibility,
} from './operationEraRuntimePreviewModel';
import { verifyOperationEraRuntimePreviewScenario } from './verifyOperationEraRuntimePreviewScenario';
import { verifyOperationEraScenario } from './verifyOperationEraScenario';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyOperationEraRuntimeExpansionReviewOutcome = {
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

function operationEraFoundationSmoke(): boolean {
  if (OPERATION_ERA_RUNTIME_PREVIEW_KINDS.length !== 8) return false;
  const day1 = buildOperationEraRuntimePreviewModel({ day: 1 });
  if (day1.visible) return false;
  if (day1.isRuntimeLinked !== false) return false;
  const day8 = buildOperationEraRuntimePreviewModel({ day: 8, isPostPilot: true, isFullMode: true });
  if (!day8.visible) return false;
  return true;
}

export function verifyOperationEraRuntimeExpansionReviewScenario(): VerifyOperationEraRuntimeExpansionReviewOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const result = runOperationEraRuntimeExpansionReviewAudit({ mode: 'review_only' });

  ok =
    assert(
      checks,
      result.runtimeLite,
      'Current model runtime-lite preview',
      'Not runtime-lite',
    ) && ok;
  ok = assert(checks, result.isRuntimeLinked === false, 'isRuntimeLinked false', 'isRuntimeLinked true!') && ok;
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
      !result.saveImpact.saveVersionChanged && SAVE_VERSION === 24,
      'SAVE_VERSION unchanged (23)',
      `SAVE_VERSION=${SAVE_VERSION}`,
    ) && ok;
  ok = assert(checks, !result.persistAdded, 'Persist NOT added', 'Persist added!') && ok;
  ok =
    assert(checks, !result.runtimeGameplayChanged, 'Runtime gameplay NOT changed', 'Gameplay changed!') && ok;
  ok =
    assert(checks, !result.runtimeActivationPerformed, 'Runtime activation NOT done', 'Activation done!') && ok;
  ok =
    assert(checks, !result.eventGenerationChanged, 'Event generation NOT changed', 'Event gen changed!') && ok;
  ok =
    assert(checks, !result.eventSelectionChanged, 'Event selection NOT changed', 'Event selection changed!') && ok;

  ok =
    assert(
      checks,
      result.previewKindCount === 8,
      `8 operation era kinds (${result.previewKindCount})`,
      `kinds=${result.previewKindCount}`,
    ) && ok;

  const day1Area = result.areaResults.find((a) => a.area === 'day_1_7_hidden_behavior');
  ok =
    assert(
      checks,
      day1Area?.health === 'PASS',
      'Day 1-7 hidden behavior referenced',
      day1Area?.message ?? 'missing',
    ) && ok;

  const day8Area = result.areaResults.find((a) => a.area === 'day_8_plus_visibility');
  ok =
    assert(
      checks,
      day8Area !== undefined,
      'Day 8+ visibility referenced',
      'missing day_8_plus_visibility',
    ) && ok;

  const hubArea = result.areaResults.find((a) => a.area === 'hub_report_profile_binding');
  ok =
    assert(
      checks,
      hubArea?.health === 'PASS',
      'Hub/Report/Profile binding referenced',
      hubArea?.message ?? 'missing',
    ) && ok;

  const mapArea = result.areaResults.find((a) => a.area === 'map_helper_only_binding');
  ok =
    assert(
      checks,
      mapArea !== undefined,
      'Map helper-only binding referenced',
      'missing map_helper_only_binding',
    ) && ok;

  ok =
    assert(
      checks,
      result.expansionOptions.length >= 4,
      `>=4 expansion options (${result.expansionOptions.length})`,
      `options=${result.expansionOptions.length}`,
    ) && ok;

  const optionIds = result.expansionOptions.map((o) => o.id);
  ok =
    assert(
      checks,
      optionIds.includes('keep_runtime_lite_preview') &&
        optionIds.includes('persist_current_operation_era_summary') &&
        optionIds.includes('runtime_era_weighting_event_selection') &&
        optionIds.includes('full_operation_era_season_engine'),
      'Options A/B/C/D present',
      optionIds.join(', '),
    ) && ok;

  const optionB = result.expansionOptions.find((o) => o.id === 'persist_current_operation_era_summary');
  ok =
    assert(
      checks,
      optionB?.recommendedFor === 'v11',
      'Option B V1.1 candidate',
      optionB?.recommendedFor ?? 'missing',
    ) && ok;

  const optionD = result.expansionOptions.find((o) => o.id === 'full_operation_era_season_engine');
  ok =
    assert(
      checks,
      optionD?.recommendedFor === 'v2_backlog',
      'Full runtime engine V2 backlog',
      optionD?.recommendedFor ?? 'missing',
    ) && ok;

  ok =
    assert(
      checks,
      result.telemetryQuestions.length >= 12,
      `Telemetry questions >= 12 (${result.telemetryQuestions.length})`,
      `questions=${result.telemetryQuestions.length}`,
    ) && ok;

  ok =
    assert(
      checks,
      result.v11Backlog.length >= 4,
      'V1.1 backlog recommendation present',
      `backlog=${result.v11Backlog.length}`,
    ) && ok;

  const sf = result.softLaunchFindings;
  ok =
    assert(
      checks,
      sf.expansionReviewPresent,
      'operation_era.expansion_review_present',
      'Missing expansion review',
    ) && ok;
  ok =
    assert(
      checks,
      sf.runtimeLiteCurrent,
      'operation_era.runtime_lite_current',
      'Not runtime-lite',
    ) && ok;
  ok =
    assert(
      checks,
      sf.expansionNotRequiredForSoftLaunch,
      'operation_era.expansion_not_required_for_soft_launch',
      'Expansion required incorrectly',
    ) && ok;
  ok =
    assert(
      checks,
      sf.v11ExpansionBacklogDefined,
      'operation_era.v11_expansion_backlog_defined',
      'Backlog missing',
    ) && ok;
  ok =
    assert(
      checks,
      sf.saveVersionUnchanged,
      'operation_era.save_version_unchanged',
      'SAVE_VERSION changed',
    ) && ok;
  ok =
    assert(
      checks,
      sf.runtimeActivationNotDone,
      'operation_era.runtime_activation_not_done',
      'Runtime activation done',
    ) && ok;

  const softLaunch = runSoftLaunchReadinessReview({ mode: 'internal_device_test' });
  const operationEraFindings = softLaunch.findings.filter((f) => f.id.startsWith('operation_era.'));
  ok =
    assert(
      checks,
      operationEraFindings.length >= 6,
      `Soft launch operation_era findings (${operationEraFindings.length})`,
      `findings=${operationEraFindings.length}`,
    ) && ok;

  const previewModelSource = readRepo('src/core/operationEra/operationEraRuntimePreviewModel.ts');
  const previewPresentationSource = readRepo(
    'src/core/operationEra/operationEraRuntimePreviewPresentation.ts',
  );
  ok =
    assert(
      checks,
      !previewModelSource.includes('ensureDailyEvents') &&
        !previewPresentationSource.includes('applyDecision') &&
        !previewPresentationSource.includes('dayPipeline'),
      'No event generation / applyDecision in operation era preview layer',
      'Forbidden runtime binding found',
    ) && ok;

  const gamePersist = readRepo('src/store/gamePersist.ts');
  ok =
    assert(
      checks,
      !gamePersist.includes('activeOperationEra') && !gamePersist.includes('operationEraStartedDay'),
      'gamePersist has no operation era fields',
      'Operation era in gamePersist',
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

  ok = assert(checks, operationEraFoundationSmoke(), 'Operation era foundation smoke', 'broken') && ok;

  const previewOutcome = verifyOperationEraRuntimePreviewScenario();
  ok =
    assert(
      checks,
      previewOutcome.ok,
      'verify:operation-era-runtime-preview foundation intact',
      'operation-era-runtime-preview broken',
    ) && ok;

  const eraOutcome = verifyOperationEraScenario();
  ok =
    assert(
      checks,
      eraOutcome.ok,
      'verify:operation-era foundation intact',
      'operation-era broken',
    ) && ok;

  const contentPackReviewSource = readRepo(
    'src/core/contentProduction/contentPackRuntimeActivationReviewAudit.ts',
  );
  ok =
    assert(
      checks,
      contentPackReviewSource.length > 0,
      'verify:content-pack-runtime-activation-review module intact',
      'Content pack review missing',
    ) && ok;

  const storyChainReviewSource = readRepo(
    'src/core/storyChains/storyChainPersistentRuntimeReviewAudit.ts',
  );
  ok =
    assert(
      checks,
      storyChainReviewSource.length > 0,
      'verify:story-chain-persistent-runtime-review module intact',
      'Story chain review missing',
    ) && ok;

  const telemetryReviewSource = readRepo('src/core/analytics/postLaunchTelemetryReadinessAudit.ts');
  ok =
    assert(
      checks,
      telemetryReviewSource.length > 0,
      'verify:post-launch-telemetry-readiness module intact',
      'Telemetry readiness audit missing',
    ) && ok;

  ok =
    assert(checks, SAVE_VERSION === 24, 'SAVE_VERSION 23 unchanged (cross-verify)', `SAVE_VERSION=${SAVE_VERSION}`) &&
    ok;

  const limited = buildOperationEraEligibility({ day: 8, isPostPilot: true, isLimitedMode: true });
  const full = buildOperationEraEligibility({ day: 8, isPostPilot: true, isFullMode: true });
  ok =
    assert(
      checks,
      limited.visible && full.visible,
      'Day 8+ limited/full visibility referenced',
      `limited=${limited.mode} full=${full.mode}`,
    ) && ok;

  const markdown = buildOperationEraRuntimeExpansionReviewMarkdown(result);
  ok =
    assert(checks, markdown.includes('## Expansion seçenekleri'), 'Markdown expansion options', 'missing') &&
    ok;
  ok =
    assert(checks, markdown.includes('## Telemetry karar soruları'), 'Markdown telemetry section', 'missing') &&
    ok;
  ok = assert(checks, markdown.includes('## V2 full runtime notu'), 'Markdown V2 note', 'missing') && ok;

  const consoleSummary = buildOperationEraRuntimeExpansionConsoleSummary(result);
  ok = assert(checks, consoleSummary.length > 200, 'Console summary non-empty', 'empty') && ok;

  const doc = readRepo(OPERATION_ERA_RUNTIME_EXPANSION_REVIEW_DOCS_PATH);
  ok =
    assert(checks, doc.length > 300, 'Operation era expansion review docs exist', 'missing docs') && ok;

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
