import { existsSync, readFileSync } from 'node:fs';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { runNoNewSystemFreezeAudit } from '@/core/releaseReadiness/noNewSystemFreezeAudit';
import { runSoftLaunchReadinessReview } from '@/core/releaseReadiness/softLaunchReviewAudit';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  STORY_CHAIN_PERSISTENT_RUNTIME_REVIEW_DOCS_PATH,
  runStoryChainPersistentRuntimeReviewAudit,
} from './storyChainPersistentRuntimeReviewAudit';
import {
  buildStoryChainPersistentRuntimeConsoleSummary,
  buildStoryChainPersistentRuntimeReviewMarkdown,
} from './storyChainPersistentRuntimeReviewPresentation';
import { STORY_CHAIN_TEMPLATES } from './storyChainTemplates';
import {
  buildStoryChainRuntimeHintModel,
  buildStoryChainRuntimeHintVisibility,
} from './storyChainRuntimeHintPresentation';
import { resolveStoryChainForDistrict } from './storyChainResolver';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyStoryChainPersistentRuntimeReviewOutcome = {
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


function storyChainFoundationSmoke(): boolean {
  if (STORY_CHAIN_TEMPLATES.length < 8) return false;
  if (buildStoryChainRuntimeHintVisibility({ day: 1 }) !== 'hidden') return false;
  if (buildStoryChainRuntimeHintModel({ day: 1 }).visible) return false;
  const resolved = resolveStoryChainForDistrict('merkez', { currentDay: 5 });
  if (resolved?.isRuntimeLinked !== false) return false;
  return true;
}

function storyChainRuntimeHintSmoke(): boolean {
  if (buildStoryChainRuntimeHintVisibility({ day: 1 }) !== 'hidden') return false;
  const day8 = buildStoryChainRuntimeHintModel({ day: 8, isPostPilot: true });
  if (day8.visibility !== 'detailed') return false;
  return true;
}

export function verifyStoryChainPersistentRuntimeReviewScenario(): VerifyStoryChainPersistentRuntimeReviewOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const result = runStoryChainPersistentRuntimeReviewAudit({ mode: 'review_only' });

  ok =
    assert(
      checks,
      result.presentationOnly,
      'Current model presentation-only',
      'Not presentation-only',
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
      !result.saveImpact.saveVersionChanged && isCurrentSaveVersion(SAVE_VERSION),
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

  const maxOneArea = result.areaResults.find((a) => a.area === 'hub_map_result_report_max_one_line');
  ok =
    assert(
      checks,
      maxOneArea?.health === 'PASS',
      'Hub/Map/Result/Report max 1 line referenced',
      maxOneArea?.message ?? 'missing',
    ) && ok;

  const day1Area = result.areaResults.find((a) => a.area === 'day_1_hidden_behavior');
  ok =
    assert(
      checks,
      day1Area?.health === 'PASS',
      'Day 1 hidden behavior referenced',
      day1Area?.message ?? 'missing',
    ) && ok;

  const day8Area = result.areaResults.find((a) => a.area === 'day_8_plus_detailed_behavior');
  ok =
    assert(
      checks,
      day8Area?.health === 'PASS',
      'Day 8+ detailed behavior referenced',
      day8Area?.message ?? 'missing',
    ) && ok;

  const dupArea = result.areaResults.find((a) => a.area === 'duplicate_suppression');
  ok =
    assert(
      checks,
      dupArea !== undefined,
      'Duplicate suppression referenced',
      'missing duplicate_suppression',
    ) && ok;

  ok =
    assert(
      checks,
      result.persistenceOptions.length >= 4,
      `>=4 persistence options (${result.persistenceOptions.length})`,
      `options=${result.persistenceOptions.length}`,
    ) && ok;

  const optionIds = result.persistenceOptions.map((o) => o.id);
  ok =
    assert(
      checks,
      optionIds.includes('keep_presentation_only_derived_hints') &&
        optionIds.includes('persist_active_chain_summary') &&
        optionIds.includes('persist_chain_event_history_window') &&
        optionIds.includes('full_story_chain_runtime_engine'),
      'Options A/B/C/D present',
      optionIds.join(', '),
    ) && ok;

  const optionB = result.persistenceOptions.find((o) => o.id === 'persist_active_chain_summary');
  ok =
    assert(
      checks,
      optionB?.recommendedFor === 'v11',
      'Option B V1.1 candidate',
      optionB?.recommendedFor ?? 'missing',
    ) && ok;

  const optionD = result.persistenceOptions.find((o) => o.id === 'full_story_chain_runtime_engine');
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
      result.telemetryQuestions.length >= 10,
      `Telemetry questions >= 10 (${result.telemetryQuestions.length})`,
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
      sf.persistenceReviewPresent,
      'story_chain.persistence_review_present',
      'Missing persistence review',
    ) && ok;
  ok =
    assert(
      checks,
      sf.presentationOnlyCurrent,
      'story_chain.presentation_only_current',
      'Not presentation-only',
    ) && ok;
  ok =
    assert(
      checks,
      sf.persistNotRequiredForSoftLaunch,
      'story_chain.persist_not_required_for_soft_launch',
      'Persist required incorrectly',
    ) && ok;
  ok =
    assert(
      checks,
      sf.v11PersistenceBacklogDefined,
      'story_chain.v11_persistence_backlog_defined',
      'Backlog missing',
    ) && ok;
  ok =
    assert(
      checks,
      sf.saveVersionUnchanged,
      'story_chain.save_version_unchanged',
      'SAVE_VERSION changed',
    ) && ok;
  ok =
    assert(
      checks,
      sf.runtimeActivationNotDone,
      'story_chain.runtime_activation_not_done',
      'Runtime activation done',
    ) && ok;

  const softLaunch = runSoftLaunchReadinessReview({ mode: 'internal_device_test' });
  const storyChainFindings = softLaunch.findings.filter((f) => f.id.startsWith('story_chain.'));
  ok =
    assert(
      checks,
      storyChainFindings.length >= 6,
      `Soft launch story_chain findings (${storyChainFindings.length})`,
      `findings=${storyChainFindings.length}`,
    ) && ok;

  const resolverSource = readRepo('src/core/storyChains/storyChainResolver.ts');
  const hintSource = readRepo('src/core/storyChains/storyChainRuntimeHintPresentation.ts');
  ok =
    assert(
      checks,
      !resolverSource.includes('@/core/eventGeneration') &&
        !resolverSource.includes('ensureDailyEvents') &&
        !hintSource.includes('applyDecision'),
      'No event generation import in story chain runtime layer',
      'Event generation import found',
    ) && ok;

  const gamePersist = readRepo('src/store/gamePersist.ts');
  ok =
    assert(
      checks,
      !gamePersist.includes('activeStoryChains') && !gamePersist.includes('storyChainState'),
      'gamePersist has no story chain fields',
      'Story chain in gamePersist',
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

  ok = assert(checks, storyChainFoundationSmoke(), 'verify:story-chains foundation smoke', 'broken') && ok;
  ok =
    assert(checks, storyChainRuntimeHintSmoke(), 'verify:story-chain-runtime-hints smoke', 'broken') &&
    ok;

  const contentPackReviewSource = readRepo(
    'src/core/contentProduction/contentPackRuntimeActivationReviewAudit.ts',
  );
  ok =
    assert(
      checks,
      contentPackReviewSource.includes('story_chain_compatibility'),
      'verify:content-pack-runtime-activation-review story chain area intact',
      'Missing story_chain_compatibility in content pack review',
    ) && ok;

  const telemetryReviewSource = readRepo('src/core/analytics/postLaunchTelemetryReadinessAudit.ts');
  ok =
    assert(
      checks,
      telemetryReviewSource.length > 0,
      'verify:post-launch-telemetry-readiness module intact',
      'Telemetry readiness audit missing',
    ) && ok;

  ok = assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION 23 unchanged (cross-verify)', `SAVE_VERSION=${SAVE_VERSION}`) && ok;

  const markdown = buildStoryChainPersistentRuntimeReviewMarkdown(result);
  ok = assert(checks, markdown.includes('## Persistence seçenekleri'), 'Markdown persistence options', 'missing') && ok;
  ok =
    assert(checks, markdown.includes('## Telemetry karar soruları'), 'Markdown telemetry section', 'missing') && ok;
  ok = assert(checks, markdown.includes('## V2 full runtime notu'), 'Markdown V2 note', 'missing') && ok;

  const consoleSummary = buildStoryChainPersistentRuntimeConsoleSummary(result);
  ok = assert(checks, consoleSummary.length > 200, 'Console summary non-empty', 'empty') && ok;

  const doc = readRepo(STORY_CHAIN_PERSISTENT_RUNTIME_REVIEW_DOCS_PATH);
  ok = assert(checks, doc.length > 300, 'Story chain persistence review docs exist', 'missing docs') && ok;

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
