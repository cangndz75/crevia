import { existsSync, readFileSync } from 'node:fs';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import {
  detectRecentSystemExpansionRisk,
  runNoNewSystemFreezeAudit,
} from '@/core/releaseReadiness/noNewSystemFreezeAudit';
import { runSoftLaunchReadinessReview } from '@/core/releaseReadiness/softLaunchReviewAudit';
import { verifyNoNewSystemFreezeScenario } from '@/core/releaseReadiness/verifyNoNewSystemFreezeScenario';
import { verifySoftLaunchReviewScenario } from '@/core/releaseReadiness/verifySoftLaunchReviewScenario';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import { runContentPackRuntimeActivationReviewAudit } from './contentPackRuntimeActivationReviewAudit';
import {
  buildContentPackActivationConsoleSummary,
  buildContentPackActivationReviewMarkdown,
} from './contentPackRuntimeActivationReviewPresentation';
import { verifyContainerEnvironmentPackOneScenario } from './verifyContainerEnvironmentPackOneScenario';
import { verifyContentProductionScenario } from './verifyContentProductionScenario';
import { verifyCrisisAdjacentPackOneScenario } from './verifyCrisisAdjacentPackOneScenario';
import { verifyDistrictPackOneScenario } from './verifyDistrictPackOneScenario';
import { verifySocialTrustPackOneScenario } from './verifySocialTrustPackOneScenario';
import { verifyVehicleRoutePackOneScenario } from './verifyVehicleRoutePackOneScenario';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyContentPackRuntimeActivationReviewOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  activationHealth: string;
  decision: string;
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

export function verifyContentPackRuntimeActivationReviewScenario(): VerifyContentPackRuntimeActivationReviewOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const result = runContentPackRuntimeActivationReviewAudit({ mode: 'review_only' });

  // 5 content packs in report
  ok = assert(checks, result.packSummaries.length === 5, '5 content packs in report', `Got ${result.packSummaries.length}`) && ok;

  // Total family count >= 80
  ok = assert(checks, result.totalFamilyCount >= 80, `Total families >= 80 (${result.totalFamilyCount})`, `families=${result.totalFamilyCount} (<80)`) && ok;

  // Total variant count >= 300
  ok = assert(checks, result.totalVariantCount >= 300, `Total variants >= 300 (${result.totalVariantCount})`, `variants=${result.totalVariantCount} (<300)`) && ok;

  // Every pack runtimeLinked = false
  const allNotLinked = result.packSummaries.every((p) => p.runtimeLinked === false);
  ok = assert(checks, allNotLinked, 'All packs runtimeLinked=false', 'Some packs runtimeLinked=true') && ok;

  // Activation not performed
  ok = assert(checks, result.runtimeActivationPerformed === false, 'Runtime activation NOT performed', 'Activation performed!') && ok;

  // No-New-System Freeze active => blocked/review-only
  ok = assert(
    checks,
    result.freezeActive && (result.decision === 'blocked_by_freeze' || result.decision === 'ready_for_v11_review_but_not_now'),
    'Freeze active — activation blocked/review-only',
    `freeze=${result.freezeActive} decision=${result.decision}`,
  ) && ok;

  // Event generation not changed
  ok = assert(checks, result.eventGenerationChanged === false, 'Event generation NOT changed', 'Event generation changed!') && ok;

  // Forbidden/panic guard results present
  const forbiddenArea = result.areaResults.find((a) => a.area === 'forbidden_copy_guard');
  ok = assert(checks, forbiddenArea !== undefined, 'Forbidden copy guard area present', 'Missing forbidden_copy_guard area') && ok;

  const panicArea = result.areaResults.find((a) => a.area === 'crisis_panic_wording_guard');
  ok = assert(checks, panicArea !== undefined, 'Panic wording guard area present', 'Missing crisis_panic_wording_guard area') && ok;

  // Duplicate collision area
  const dupArea = result.areaResults.find((a) => a.area === 'duplicate_cross_pack_collision');
  ok = assert(checks, dupArea !== undefined, 'Duplicate collision area present', 'Missing duplicate area') && ok;

  // V1.1 backlog >= 8 items
  ok = assert(checks, result.v11Backlog.length >= 8, `V1.1 backlog >= 8 items (${result.v11Backlog.length})`, `backlog=${result.v11Backlog.length} (<8)`) && ok;

  // Story chain compatibility
  const storyChainArea = result.areaResults.find((a) => a.area === 'story_chain_compatibility');
  ok = assert(checks, storyChainArea !== undefined, 'Story chain compatibility evaluated', 'Missing story_chain_compatibility') && ok;

  // Operation era compatibility
  const eraArea = result.areaResults.find((a) => a.area === 'operation_era_compatibility');
  ok = assert(checks, eraArea !== undefined, 'Operation era compatibility evaluated', 'Missing operation_era_compatibility') && ok;

  // Soft launch findings via result (activation review internally checks these)
  const sf = result.softLaunchFindings;
  ok = assert(checks, sf.activationReviewPresent, 'content.activation_review_present', 'Missing activation review') && ok;
  ok = assert(checks, sf.runtimeActivationBlockedByFreeze, 'content.runtime_activation_blocked_by_freeze', 'Not blocked') && ok;
  ok = assert(checks, sf.packCoverageSufficient, 'content.pack_coverage_sufficient', 'Coverage insufficient') && ok;
  ok = assert(checks, sf.v11BacklogDefined, 'content.v11_backlog_defined', 'Backlog not defined') && ok;
  ok = assert(checks, sf.activationNotRequiredForSoftLaunch, 'content.activation_not_required_for_soft_launch', 'Required for soft launch') && ok;

  // No event generation import/binding in review layer
  const auditSource = readRepo('src/core/contentProduction/contentPackRuntimeActivationReviewAudit.ts');
  ok =
    assert(
      checks,
      !auditSource.includes('@/core/eventGeneration') &&
        !auditSource.includes('ensureDailyEvents') &&
        !auditSource.includes('applyDecision'),
      'No event generation import/binding in audit',
      'Audit imports event generation',
    ) && ok;

  // Freeze compliance: no new content pack, activation deferred
  const expansionRisk = detectRecentSystemExpansionRisk();
  ok =
    assert(
      checks,
      !expansionRisk.some((v) => v.forbiddenScope === 'new_content_pack'),
      'No new content pack during freeze',
      'Unregistered content pack detected',
    ) && ok;
  ok =
    assert(
      checks,
      result.v11Backlog.length >= 8,
      'Content activation deferred to V1.1 backlog',
      'V1.1 backlog insufficient',
    ) && ok;
  const freezeAudit = runNoNewSystemFreezeAudit({ mode: 'internal_device_test' });
  ok =
    assert(
      checks,
      freezeAudit.violations.filter((v) => v.severity === 'blocker').length === 0,
      'Freeze forbidden scope not violated',
      'Freeze blocker violations present',
    ) && ok;

  // Soft Launch Review reads content activation findings
  const softLaunchReview = runSoftLaunchReadinessReview({ mode: 'internal_device_test' });
  const activationFindingIds = [
    'content.activation_review_present',
    'content.runtime_activation_blocked_by_freeze',
    'content.pack_coverage_sufficient',
    'content.v11_backlog_defined',
    'content.activation_not_required_for_soft_launch',
  ];
  for (const id of activationFindingIds) {
    ok =
      assert(
        checks,
        softLaunchReview.findings.some((f) => f.id === id),
        `Soft launch review reads ${id}`,
        `Missing ${id}`,
      ) && ok;
  }

  // Verify other scripts don't break
  ok = assert(checks, verifyContentProductionScenario().ok, 'verify:content-production compatible', 'Broken') && ok;
  ok = assert(checks, verifyDistrictPackOneScenario().ok, 'verify:district-pack-one compatible', 'Broken') && ok;
  ok =
    assert(checks, verifyVehicleRoutePackOneScenario().ok, 'verify:vehicle-route-pack-one compatible', 'Broken') &&
    ok;
  ok =
    assert(
      checks,
      verifyContainerEnvironmentPackOneScenario().ok,
      'verify:container-environment-pack-one compatible',
      'Broken',
    ) && ok;
  ok = assert(checks, verifySocialTrustPackOneScenario().ok, 'verify:social-trust-pack-one compatible', 'Broken') && ok;
  ok =
    assert(checks, verifyCrisisAdjacentPackOneScenario().ok, 'verify:crisis-adjacent-pack-one compatible', 'Broken') &&
    ok;
  ok = assert(checks, verifyNoNewSystemFreezeScenario().ok, 'verify:no-new-system-freeze compatible', 'Broken') && ok;
  ok = assert(checks, verifySoftLaunchReviewScenario().ok, 'verify:soft-launch-review compatible', 'Broken') && ok;

  const fullLoop = runFullLoopAnalysis();
  ok = assert(checks, fullLoop.totalFAIL === 0, 'verify:full-loop compatible', `FAIL=${fullLoop.totalFAIL}`) && ok;
  ok = assert(checks, verifyFullUxFlowScenario().ok, 'verify:full-ux-flow compatible', 'UX broken') && ok;

  ok = assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION 23 unchanged', `SAVE_VERSION=${SAVE_VERSION}`) && ok;

  // Markdown output
  const markdown = buildContentPackActivationReviewMarkdown(result);
  ok = assert(checks, markdown.includes('## Pack readiness'), 'Markdown pack readiness section', 'Missing pack readiness') && ok;
  ok = assert(checks, markdown.includes('## V1.1 backlog'), 'Markdown V1.1 backlog section', 'Missing V1.1 backlog') && ok;

  // Console summary
  const consoleSummary = buildContentPackActivationConsoleSummary(result);
  ok = assert(checks, consoleSummary.length > 200, 'Console summary non-empty', 'Empty console') && ok;

  // Docs exist
  const doc = readRepo(result.docsPath);
  ok = assert(checks, doc.length > 300, 'Activation review docs exist', 'Missing docs') && ok;

  // Warn tracking
  if (result.health === 'WARN') hasWarn = true;
  if (result.warnings.length > 0) hasWarn = true;

  if (!warn(checks, result.warnings.some((w) => w.id === 'activation.runtime_adapter_not_implemented'), 'Runtime adapter not implemented WARN', 'Missing adapter WARN')) {
    hasWarn = true;
  }

  return {
    ok,
    warn: hasWarn,
    checks,
    activationHealth: result.health,
    decision: result.decision,
  };
}
