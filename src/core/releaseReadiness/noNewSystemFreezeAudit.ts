import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildIapManualSetupTracker } from '@/core/iapQa/iapManualSetupTrackerAudit';
import { buildIapSandboxSmokeExecutionResult } from '@/core/iapQa/iapSandboxSmokeExecutionAudit';
import { buildRealDevicePlaytestPlan } from '@/core/playtest/realDevicePlaytestPlan';
import { SAVE_VERSION } from '@/store/gamePersist';

import { runPrivacyPolicyReadinessAudit } from './privacyPolicyReadinessAudit';
import { runStoreMetadataFinalizationAudit } from './storeMetadataFinalizationAudit';
import { runStoreScreenshotReadinessAudit } from './storeScreenshotReadinessAudit';

import {
  NO_NEW_SYSTEM_FREEZE_ALLOWED_SCOPES,
  NO_NEW_SYSTEM_FREEZE_DOCS_PATH,
  NO_NEW_SYSTEM_FREEZE_EXPECTED_SAVE_VERSION,
  NO_NEW_SYSTEM_FREEZE_FORBIDDEN_COPY_PATTERNS,
  NO_NEW_SYSTEM_FREEZE_FORBIDDEN_SCOPES,
  NO_NEW_SYSTEM_FREEZE_IAP_FLOW_FILES,
  NO_NEW_SYSTEM_FREEZE_MANUAL_BLOCKERS,
  NO_NEW_SYSTEM_FREEZE_PROMPT_GUARD,
  NO_NEW_SYSTEM_FREEZE_PROTECTED_RUNTIME_FILES,
  NO_NEW_SYSTEM_FREEZE_REGISTERED_APP_ROUTES,
  NO_NEW_SYSTEM_FREEZE_REGISTERED_CONTENT_PACK_FILES,
  NO_NEW_SYSTEM_FREEZE_REGISTERED_CORE_DIRS,
} from './noNewSystemFreezeConstants';
import type {
  CreviaFreezeAllowedScope,
  CreviaFreezeDecision,
  CreviaFreezeFinding,
  CreviaFreezeForbiddenScope,
  CreviaFreezeHealthStatus,
  CreviaFreezeManualBlocker,
  CreviaFreezePromptGuardItem,
  CreviaFreezeRecommendation,
  CreviaFreezeViolation,
  CreviaNoNewSystemFreezeResult,
  RunNoNewSystemFreezeAuditOptions,
} from './noNewSystemFreezeTypes';
import type { CreviaSoftLaunchReviewMode } from './softLaunchReviewTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function makeFinding(
  id: string,
  severity: CreviaFreezeFinding['severity'],
  title: string,
  message: string,
  recommendation: string,
  automatic = true,
): CreviaFreezeFinding {
  return { id, severity, title, message, recommendation, automatic };
}

export function buildFreezeAllowedScopeList(): CreviaFreezeAllowedScope[] {
  return [...NO_NEW_SYSTEM_FREEZE_ALLOWED_SCOPES];
}

export function buildFreezeForbiddenScopeList(): CreviaFreezeForbiddenScope[] {
  return [...NO_NEW_SYSTEM_FREEZE_FORBIDDEN_SCOPES];
}

export function buildFreezePromptGuardChecklist(): CreviaFreezePromptGuardItem[] {
  return [...NO_NEW_SYSTEM_FREEZE_PROMPT_GUARD];
}

export function detectRecentSystemExpansionRisk(): CreviaFreezeViolation[] {
  const violations: CreviaFreezeViolation[] = [];

  const packDir = join(REPO_ROOT, 'src/core/contentProduction/contentPacks');
  if (existsSync(packDir)) {
    const packFiles = readdirSync(packDir).filter(
      (f) => f.endsWith('.ts') && f !== 'index.ts' && !f.endsWith('.d.ts'),
    );
    const unknownPacks = packFiles.filter(
      (f) =>
        !NO_NEW_SYSTEM_FREEZE_REGISTERED_CONTENT_PACK_FILES.includes(
          f as (typeof NO_NEW_SYSTEM_FREEZE_REGISTERED_CONTENT_PACK_FILES)[number],
        ),
    );
    if (unknownPacks.length > 0) {
      violations.push({
        id: 'risk.new_content_pack_file',
        forbiddenScope: 'new_content_pack',
        severity: 'blocker',
        title: 'Unregistered content pack file detected',
        message: unknownPacks.join(', '),
        recommendation: 'Do not add content packs during freeze. Move to V1.1 backlog.',
      });
    }
  }

  const coreRoot = join(REPO_ROOT, 'src/core');
  if (existsSync(coreRoot)) {
    const topLevelDirs = readdirSync(coreRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => `src/core/${d.name}`);
    const unregisteredDirs = topLevelDirs.filter(
      (d) => !NO_NEW_SYSTEM_FREEZE_REGISTERED_CORE_DIRS.includes(d as (typeof NO_NEW_SYSTEM_FREEZE_REGISTERED_CORE_DIRS)[number]),
    );
    if (unregisteredDirs.length > 0) {
      violations.push({
        id: 'risk.new_core_runtime_dir',
        forbiddenScope: 'new_runtime_activation',
        severity: 'blocker',
        title: 'Unregistered core runtime directory',
        message: unregisteredDirs.slice(0, 5).join(', '),
        recommendation: 'No new runtime systems during freeze.',
      });
    }
  }

  if (SAVE_VERSION !== NO_NEW_SYSTEM_FREEZE_EXPECTED_SAVE_VERSION) {
    violations.push({
      id: 'risk.save_version_bump',
      forbiddenScope: 'save_version_bump',
      severity: 'blocker',
      title: 'SAVE_VERSION changed during freeze',
      message: `Expected ${NO_NEW_SYSTEM_FREEZE_EXPECTED_SAVE_VERSION}, found ${SAVE_VERSION}.`,
      recommendation: 'Revert SAVE_VERSION bump or defer to post-launch migration.',
    });
  }

  const persist = readRepo('src/store/gamePersist.ts');
  if (persist.includes('noNewSystemFreeze') || persist.includes('freezeGateState')) {
    violations.push({
      id: 'risk.persist_shape_change',
      forbiddenScope: 'persist_shape_change',
      severity: 'blocker',
      title: 'Persist shape polluted by freeze audit',
      message: 'gamePersist.ts contains freeze-specific state.',
      recommendation: 'Keep freeze gate out of persist shape.',
    });
  }

  for (const file of NO_NEW_SYSTEM_FREEZE_PROTECTED_RUNTIME_FILES) {
    const content = readRepo(file);
    if (content.length === 0) {
      violations.push({
        id: `risk.missing_protected_file.${file.replace(/[/\\]/g, '_')}`,
        forbiddenScope: file.includes('ensureDaily') ? 'event_generation_rewrite' : file.includes('applyDecision') ? 'applyDecision_rewrite' : file.includes('dayPipeline') ? 'dayPipeline_rewrite' : 'persist_shape_change',
        severity: 'blocker',
        title: `Protected runtime file missing: ${file}`,
        message: 'Core runtime file not found.',
        recommendation: 'Restore protected runtime file before release.',
      });
    }
  }

  const appDir = join(REPO_ROOT, 'src/app');
  if (existsSync(appDir)) {
    const walkRoutes = (dir: string, prefix: string): string[] => {
      const entries = readdirSync(dir, { withFileTypes: true });
      const routes: string[] = [];
      for (const entry of entries) {
        const rel = `${prefix}/${entry.name}`.replace(/\\/g, '/');
        if (entry.isDirectory()) {
          routes.push(...walkRoutes(join(dir, entry.name), rel));
        } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
          routes.push(`src/app${rel}`);
        }
      }
      return routes;
    };
    const allRoutes = walkRoutes(appDir, '');
    const unregisteredRoutes = allRoutes.filter(
      (r) =>
        !NO_NEW_SYSTEM_FREEZE_REGISTERED_APP_ROUTES.includes(
          r as (typeof NO_NEW_SYSTEM_FREEZE_REGISTERED_APP_ROUTES)[number],
        ),
    );
    if (unregisteredRoutes.length > 0) {
      violations.push({
        id: 'risk.new_screen_or_route',
        forbiddenScope: 'new_screen_or_route',
        severity: 'blocker',
        title: 'Unregistered app route detected',
        message: unregisteredRoutes.slice(0, 3).join(', '),
        recommendation: 'No new screens/routes during freeze.',
      });
    }
  }

  for (const file of NO_NEW_SYSTEM_FREEZE_IAP_FLOW_FILES) {
    const content = readRepo(file);
    if (content.includes('// FREEZE_REWRITE_MARKER')) {
      violations.push({
        id: `risk.iap_flow_rewrite.${file.replace(/[/\\]/g, '_')}`,
        forbiddenScope: 'iap_purchase_flow_rewrite',
        severity: 'blocker',
        title: 'IAP purchase flow rewrite marker detected',
        message: file,
        recommendation: 'Only bugfix IAP issues during freeze.',
      });
    }
  }

  const forbiddenCopySamples = [
    readRepo('src/core/monetization/monetizationConstants.ts'),
    readRepo('src/core/iap/iapOfferPresentation.ts'),
  ].join('\n');
  for (const pattern of NO_NEW_SYSTEM_FREEZE_FORBIDDEN_COPY_PATTERNS) {
    if (pattern.test(forbiddenCopySamples)) {
      violations.push({
        id: 'risk.forbidden_copy_guard_bypass',
        forbiddenScope: 'large_ui_redesign',
        severity: 'warn',
        title: 'Forbidden copy pattern in player-facing surface',
        message: pattern.source,
        recommendation: 'Fix false claim / legacy copy only; no redesign.',
      });
      break;
    }
  }

  return violations;
}

export function collectFreezeViolations(): CreviaFreezeViolation[] {
  return detectRecentSystemExpansionRisk();
}

function buildManualBlockerList(): CreviaFreezeManualBlocker[] {
  const manualSetup = buildIapManualSetupTracker();
  const smoke = buildIapSandboxSmokeExecutionResult();
  const playtest = buildRealDevicePlaytestPlan();
  const privacy = runPrivacyPolicyReadinessAudit({ mode: 'launch_candidate' });
  const screenshots = runStoreScreenshotReadinessAudit({ mode: 'launch_candidate' });
  const metadata = runStoreMetadataFinalizationAudit({ mode: 'launch_candidate' });

  const pendingById: Record<string, boolean> = {
    'manual.real_device_playtest_pending': playtest.manualCompletionRequired,
    'manual.iap_sandbox_smoke_pending': !smoke.sandboxSmokePassed,
    'manual.revenuecat_keys_pending': !manualSetup.revenueCatKeysConfigured,
    'manual.app_store_product_pending': manualSetup.storeProductsPending,
    'manual.play_console_product_pending': manualSetup.storeProductsPending,
    'manual.eas_secrets_pending': manualSetup.easSecretsPending,
    'manual.privacy_url_placeholder': privacy.publishedPrivacyUrlIsPlaceholder,
    'manual.screenshots_pending': screenshots.blockers.length > 0 || screenshots.health !== 'PASS',
    'manual.metadata_console_entry_pending': metadata.blockers.length > 0 || metadata.health !== 'PASS',
  };

  return NO_NEW_SYSTEM_FREEZE_MANUAL_BLOCKERS.map((b) => ({
    ...b,
    status: pendingById[b.id] ? 'pending' : 'resolved',
  }));
}

export function buildFreezeDecision(
  mode: CreviaSoftLaunchReviewMode,
  violations: CreviaFreezeViolation[],
  manualBlockers: CreviaFreezeManualBlocker[],
): CreviaFreezeDecision {
  const hasBlockerViolation = violations.some((v) => v.severity === 'blocker');
  if (hasBlockerViolation) {
    return 'freeze_blocked_by_active_system_work';
  }

  const manualPending = manualBlockers.some((b) => b.status === 'pending');

  if (mode === 'soft_launch_candidate') {
    return manualPending ? 'fix_only_mode' : 'freeze_active';
  }

  if (mode === 'launch_candidate') {
    return manualPending ? 'fix_only_mode' : 'freeze_active';
  }

  if (manualPending) {
    return 'freeze_recommended_after_manual_blockers';
  }

  return 'freeze_ready';
}

export function buildFreezeNextActions(
  decision: CreviaFreezeDecision,
  manualBlockers: CreviaFreezeManualBlocker[],
  violations: CreviaFreezeViolation[],
): string[] {
  const actions: string[] = [];

  if (violations.some((v) => v.severity === 'blocker')) {
    actions.push('Revert system expansion changes before continuing release prep.');
    actions.push(...violations.filter((v) => v.severity === 'blocker').slice(0, 2).map((v) => v.recommendation));
  }

  const pending = manualBlockers.filter((b) => b.status === 'pending');
  if (pending.length > 0) {
    actions.push(`${pending.length} manual blocker(s) open — freeze required, not optional.`);
    actions.push(...pending.slice(0, 3).map((b) => b.title));
  }

  if (decision === 'fix_only_mode' || decision === 'freeze_active') {
    actions.push('Only bugfix, crash fix, layout, copy, store/IAP readiness, and verify patches allowed.');
    actions.push('Run npm run verify:no-new-system-freeze before each patch.');
  }

  if (decision === 'freeze_recommended_after_manual_blockers') {
    actions.push('Enter fix-only mode while manual blockers remain.');
    actions.push('Use prompt guard checklist before accepting new Cursor prompts.');
  }

  if (actions.length === 0) {
    actions.push('Maintain freeze gate; run verify:no-new-system-freeze on each patch.');
  }

  return actions;
}

function buildRecommendations(
  decision: CreviaFreezeDecision,
  manualBlockers: CreviaFreezeManualBlocker[],
): CreviaFreezeRecommendation[] {
  const recs: CreviaFreezeRecommendation[] = [];
  const pending = manualBlockers.filter((b) => b.status === 'pending');

  if (pending.length > 0) {
    recs.push({
      id: 'rec.manual_blockers_drive_freeze',
      priority: 'high',
      title: 'Manual blockers require fix-only freeze',
      action: `${pending.length} manual readiness items pending — freeze is mandatory, not blocked by them.`,
      manual: true,
    });
  }

  recs.push({
    id: 'rec.prompt_guard',
    priority: 'high',
    title: 'Prompt guard checklist',
    action: 'Review docs/crevia-no-new-system-freeze.md before each Cursor prompt.',
    manual: false,
  });

  if (decision === 'fix_only_mode' || decision === 'freeze_active') {
    recs.push({
      id: 'rec.fix_only',
      priority: 'high',
      title: 'Fix-only mode active',
      action: 'No new systems, content packs, or runtime activation until soft launch.',
      manual: false,
    });
  }

  return recs;
}

function buildGateFindings(
  allowed: CreviaFreezeAllowedScope[],
  forbidden: CreviaFreezeForbiddenScope[],
  violations: CreviaFreezeViolation[],
  manualBlockers: CreviaFreezeManualBlocker[],
  decision: CreviaFreezeDecision,
): CreviaFreezeFinding[] {
  const findings: CreviaFreezeFinding[] = [];

  const docs = readRepo(NO_NEW_SYSTEM_FREEZE_DOCS_PATH);
  findings.push(
    docs.length > 0
      ? makeFinding(
          'freeze.no_new_system_gate_present',
          'pass',
          'No-New-System freeze gate present',
          NO_NEW_SYSTEM_FREEZE_DOCS_PATH,
          'Keep docs updated with allowed/forbidden scope.',
        )
      : makeFinding(
          'freeze.no_new_system_gate_present',
          'blocker',
          'No-New-System freeze gate missing',
          'Docs not found.',
          `Create ${NO_NEW_SYSTEM_FREEZE_DOCS_PATH}.`,
        ),
  );

  findings.push(
    allowed.length >= 12
      ? makeFinding(
          'freeze.allowed_scope_defined',
          'pass',
          'Allowed scope defined',
          `${allowed.length} allowed scopes registered.`,
          'Only patch within allowed scope during freeze.',
        )
      : makeFinding(
          'freeze.allowed_scope_defined',
          'blocker',
          'Allowed scope incomplete',
          `${allowed.length} scopes (minimum 12).`,
          'Expand allowed scope registry.',
        ),
  );

  findings.push(
    forbidden.length >= 15
      ? makeFinding(
          'freeze.forbidden_scope_defined',
          'pass',
          'Forbidden scope defined',
          `${forbidden.length} forbidden scopes registered.`,
          'Reject prompts outside allowed scope.',
        )
      : makeFinding(
          'freeze.forbidden_scope_defined',
          'blocker',
          'Forbidden scope incomplete',
          `${forbidden.length} scopes (minimum 15).`,
          'Expand forbidden scope registry.',
        ),
  );

  const pendingManual = manualBlockers.filter((b) => b.status === 'pending');
  findings.push(
    makeFinding(
      'freeze.manual_blockers_remaining',
      pendingManual.length > 0 ? 'warn' : 'pass',
      pendingManual.length > 0
        ? `${pendingManual.length} manual blockers remaining`
        : 'All manual blockers resolved',
      pendingManual.map((b) => b.title).join('; ') || 'None.',
      'Manual blockers drive freeze requirement; they do not cancel freeze.',
      false,
    ),
  );

  const freezeActive =
    decision === 'freeze_active' ||
    decision === 'fix_only_mode' ||
    decision === 'freeze_recommended_after_manual_blockers';

  findings.push(
    makeFinding(
      'freeze.recommendation',
      freezeActive ? 'pass' : violations.length > 0 ? 'blocker' : 'warn',
      `Freeze decision: ${decision}`,
      violations.length > 0
        ? `${violations.length} expansion risk(s) detected.`
        : pendingManual.length > 0
          ? 'Fix-only mode while manual blockers remain.'
          : 'Freeze gate ready.',
      NO_NEW_SYSTEM_FREEZE_DOCS_PATH,
    ),
  );

  for (const v of violations) {
    findings.push(
      makeFinding(
        v.id,
        v.severity === 'blocker' ? 'blocker' : 'warn',
        v.title,
        v.message,
        v.recommendation,
      ),
    );
  }

  return findings;
}

function resolveHealth(
  findings: CreviaFreezeFinding[],
  violations: CreviaFreezeViolation[],
): CreviaFreezeHealthStatus {
  if (findings.some((f) => f.severity === 'blocker') || violations.some((v) => v.severity === 'blocker')) {
    return 'BLOCKED';
  }
  if (findings.some((f) => f.severity === 'warn') || violations.some((v) => v.severity === 'warn')) {
    return 'WARN';
  }
  return 'PASS';
}

export function runNoNewSystemFreezeAudit(
  options: RunNoNewSystemFreezeAuditOptions = {},
): CreviaNoNewSystemFreezeResult {
  const mode = options.mode ?? 'launch_candidate';
  const allowedScopes = buildFreezeAllowedScopeList();
  const forbiddenScopes = buildFreezeForbiddenScopeList();
  const violations = collectFreezeViolations();
  const manualBlockers = buildManualBlockerList();
  const decision = buildFreezeDecision(mode, violations, manualBlockers);
  const promptGuardChecklist = buildFreezePromptGuardChecklist();
  const findings = buildGateFindings(allowedScopes, forbiddenScopes, violations, manualBlockers, decision);
  const health = resolveHealth(findings, violations);
  const recommendations = buildRecommendations(decision, manualBlockers);
  const nextActions = buildFreezeNextActions(decision, manualBlockers, violations);

  const freezeActive =
    decision === 'freeze_active' ||
    decision === 'fix_only_mode' ||
    decision === 'freeze_recommended_after_manual_blockers';
  const fixOnlyMode = decision === 'fix_only_mode' || decision === 'freeze_recommended_after_manual_blockers';

  return {
    mode,
    health,
    decision,
    freezeActive,
    fixOnlyMode,
    allowedScopes,
    forbiddenScopes,
    findings,
    violations,
    recommendations,
    manualBlockers,
    promptGuardChecklist,
    nextActions,
    saveVersion: SAVE_VERSION,
    expectedSaveVersion: NO_NEW_SYSTEM_FREEZE_EXPECTED_SAVE_VERSION,
    docsPath: NO_NEW_SYSTEM_FREEZE_DOCS_PATH,
  };
}

export function isNoNewSystemFreezeActive(mode: CreviaSoftLaunchReviewMode): boolean {
  const result = runNoNewSystemFreezeAudit({ mode });
  return (
    result.freezeActive &&
    result.decision !== 'freeze_blocked_by_active_system_work' &&
    result.findings.some((f) => f.id === 'freeze.no_new_system_gate_present' && f.severity === 'pass')
  );
}
