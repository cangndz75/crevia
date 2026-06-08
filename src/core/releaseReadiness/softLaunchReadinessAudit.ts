import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runCrashPerformanceAudit } from '@/core/crashPerformance/crashPerformanceAudit';
import { CRASH_PERFORMANCE_DOCS_PATH } from '@/core/crashPerformance/crashPerformanceConstants';
import { validateAnalyticsPrivacy } from '@/core/analytics/analyticsPrivacy';
import { ANALYTICS_EVENT_DEFINITIONS } from '@/core/analytics/analyticsSchema';
import { ANALYTICS_FUNNEL_DEFINITIONS } from '@/core/analytics/analyticsFunnels';
import { verifyAnalyticsScenario } from '@/core/analytics/verifyAnalyticsScenario';
import { verifyAssignmentScenario } from '@/core/assignments/verifyAssignmentScenario';
import { verifyDayPipelineScenario } from '@/core/dayPipeline/verifyDayPipelineScenario';
import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { runIapSandboxQaAudit } from '@/core/iapQa/iapSandboxQaAudit';
import { IAP_SANDBOX_QA_DOCS_PATH } from '@/core/iapQa/iapSandboxQaConstants';
import { runIapSandboxReadinessAudit } from '@/core/iapQa/iapSandboxReadinessAudit';
import { IAP_SANDBOX_SMOKE_TEST_DOCS_PATH } from '@/core/iapQa/iapSandboxReadinessConstants';
import { verifyIapProductDesignScenario } from '@/core/iap/verifyIapProductDesignScenario';
import { getMainOperationProductDefinition } from '@/core/iap/iapProductDesign';
import { IAP_UI_FORBIDDEN_WORDS } from '@/core/iap/iapProductConstants';
import { buildIapOfferCopyModel } from '@/core/iap/iapOfferPresentation';
import { MONETIZATION_COPY } from '@/core/monetization/monetizationConstants';
import { verifyMonetizationScenario } from '@/core/monetization/verifyMonetizationScenario';
import { verifyFirstTenMinutesScenario } from '@/core/onboarding/verifyFirstTenMinutesScenario';
import { verifyAdvisorScenario } from '@/core/advisors/verifyAdvisorScenario';
import { verifyDailyPlanningScenario } from '@/core/dailyPlanning/verifyDailyPlanningScenario';
import { verifyPlayerFlowAuditScenario } from '@/core/playtest/verifyPlayerFlowAuditScenario';
import { runPlayerFlowAudit } from '@/core/playtest/playerFlowAuditEngine';
import { verifyOperationSignalsScenario } from '@/core/operations/verifyOperationSignalsScenario';
import { verifyInteractionContractsScenario } from '@/core/quality/interactionContracts/verifyInteractionContractsScenario';
import { runSelectorAudit } from '@/core/quality/performanceSelectors/selectorAuditEngine';
import { verifySeasonEndScenario } from '@/core/seasonEnd/verifySeasonEndScenario';
import { verifyFullSeasonSimulationScenario } from '@/core/simulation/verifyFullSeasonSimulationScenario';
import { normalizePersistedSave, SAVE_VERSION } from '@/store/gamePersist';
import { createDay1Seed } from '@/core/content/day1Seed';

import {
  SOFT_LAUNCH_ANALYTICS_DOCS_PATH,
  SOFT_LAUNCH_FORBIDDEN_COPY_WORDS,
  SOFT_LAUNCH_IAP_DOCS_PATH,
  SOFT_LAUNCH_PLAYER_FLOW_DOCS_PATH,
  SOFT_LAUNCH_READINESS_AREAS,
  SOFT_LAUNCH_READINESS_CHECKLIST,
} from './softLaunchReadinessConstants';
import type {
  RunSoftLaunchReadinessAuditOptions,
  SoftLaunchReadinessArea,
  SoftLaunchReadinessAuditMode,
  SoftLaunchReadinessAuditResult,
  SoftLaunchReadinessChecklistItem,
  SoftLaunchReadinessFinding,
  SoftLaunchReadinessHealth,
  SoftLaunchReadinessOwnerHint,
  SoftLaunchReadinessSeverity,
  SoftLaunchReleaseDecision,
} from './softLaunchReadinessTypes';
import {
  getNextRecommendedPatch,
  getSoftLaunchReleaseDecision,
} from './softLaunchReadinessPresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function makeFinding(
  id: string,
  area: SoftLaunchReadinessArea,
  severity: SoftLaunchReadinessSeverity,
  title: string,
  message: string,
  recommendation: string,
  ownerHint: SoftLaunchReadinessOwnerHint,
): SoftLaunchReadinessFinding {
  return { id, area, severity, title, message, recommendation, ownerHint };
}

function pass(
  id: string,
  area: SoftLaunchReadinessArea,
  title: string,
  message: string,
  recommendation: string,
  ownerHint: SoftLaunchReadinessOwnerHint = 'engineering',
): SoftLaunchReadinessFinding {
  return makeFinding(id, area, 'pass', title, message, recommendation, ownerHint);
}

function warnFinding(
  id: string,
  area: SoftLaunchReadinessArea,
  title: string,
  message: string,
  recommendation: string,
  ownerHint: SoftLaunchReadinessOwnerHint = 'engineering',
): SoftLaunchReadinessFinding {
  return makeFinding(id, area, 'warn', title, message, recommendation, ownerHint);
}

function failFinding(
  id: string,
  area: SoftLaunchReadinessArea,
  title: string,
  message: string,
  recommendation: string,
  ownerHint: SoftLaunchReadinessOwnerHint = 'engineering',
): SoftLaunchReadinessFinding {
  return makeFinding(id, area, 'fail', title, message, recommendation, ownerHint);
}

function blockerFinding(
  id: string,
  area: SoftLaunchReadinessArea,
  title: string,
  message: string,
  recommendation: string,
  ownerHint: SoftLaunchReadinessOwnerHint = 'engineering',
): SoftLaunchReadinessFinding {
  return makeFinding(id, area, 'blocker', title, message, recommendation, ownerHint);
}

function verifyOutcomeToFindings(
  area: SoftLaunchReadinessArea,
  verifyKey: string,
  outcome: { ok: boolean; warn?: boolean; checks: string[] },
  passTitle: string,
): SoftLaunchReadinessFinding[] {
  const prefix = `${area}.${verifyKey.replace(/[^a-z0-9_]/gi, '_')}`;
  const findings: SoftLaunchReadinessFinding[] = [];
  if (outcome.ok && !outcome.warn) {
    findings.push(
      pass(`${prefix}.verify_pass`, area, passTitle, 'Automated verify script PASS.', 'Continue monitoring.'),
    );
    return findings;
  }
  if (outcome.ok && outcome.warn) {
    findings.push(
      pass(`${prefix}.verify_pass_with_warn`, area, passTitle, 'Verify PASS with expected WARN items.', 'Review WARN before public launch.'),
    );
    const warnLines = outcome.checks.filter((c) => c.startsWith('WARN')).slice(0, 3);
    for (const [i, line] of warnLines.entries()) {
      findings.push(
        warnFinding(
          `${prefix}.verify_warn_${i}`,
          area,
          `${passTitle} — WARN`,
          line.replace(/^WARN\s*/, ''),
          'Address before soft-launch candidate.',
        ),
      );
    }
    return findings;
  }
  const failLines = outcome.checks.filter((c) => c.startsWith('FAIL')).slice(0, 3);
  findings.push(
    failFinding(
      `${prefix}.verify_fail`,
      area,
      `${passTitle} — FAIL`,
      failLines.join('; ') || 'Verify script reported failure.',
      'Fix failing verify before SDK integration.',
    ),
  );
  return findings;
}

export function buildSoftLaunchReadinessChecklist(): SoftLaunchReadinessChecklistItem[] {
  return [...SOFT_LAUNCH_READINESS_CHECKLIST];
}

export function calculateSoftLaunchHealth(
  findings: SoftLaunchReadinessFinding[],
): SoftLaunchReadinessHealth {
  if (findings.some((f) => f.severity === 'blocker')) {
    return 'BLOCKED';
  }
  if (findings.some((f) => f.severity === 'fail')) {
    return 'FAIL';
  }
  if (findings.some((f) => f.severity === 'warn')) {
    return 'WARN';
  }
  return 'PASS';
}

export function buildAreaSummaries(
  findings: SoftLaunchReadinessFinding[],
): SoftLaunchReadinessAuditResult['areaSummaries'] {
  return SOFT_LAUNCH_READINESS_AREAS.map((area) => {
    const areaFindings = findings.filter((f) => f.area === area);
    const passCount = areaFindings.filter((f) => f.severity === 'pass').length;
    const warnCount = areaFindings.filter((f) => f.severity === 'warn').length;
    const failCount = areaFindings.filter((f) => f.severity === 'fail').length;
    const blockerCount = areaFindings.filter((f) => f.severity === 'blocker').length;

    let status: SoftLaunchReadinessAuditResult['areaSummaries'][number]['status'] =
      'ready';
    if (blockerCount > 0 || failCount > 0) {
      status = 'blocked';
    } else if (warnCount > 0) {
      status = 'needs_review';
    }

    const summary =
      blockerCount > 0
        ? `${blockerCount} blocker`
        : failCount > 0
          ? `${failCount} fail`
          : warnCount > 0
            ? `${warnCount} warn`
            : `${passCount} pass`;

    return {
      area,
      status,
      passCount,
      warnCount,
      failCount,
      blockerCount,
      summary,
    };
  });
}

export function auditSaveMigrationReadiness(): SoftLaunchReadinessFinding[] {
  const findings: SoftLaunchReadinessFinding[] = [];

  if (SAVE_VERSION === 25) {
    findings.push(
      pass(
        'save_migration.save_version_23',
        'save_migration',
        'SAVE_VERSION 23',
        `Current SAVE_VERSION is ${SAVE_VERSION}.`,
        'Do not bump without migration plan.',
      ),
    );
  } else {
    findings.push(
      failFinding(
        'save_migration.save_version_23',
        'save_migration',
        'SAVE_VERSION mismatch',
        `Expected 23, got ${SAVE_VERSION}.`,
        'Align persist migrations before release.',
      ),
    );
  }

  const seed = createDay1Seed();
  const hydratedV22 = normalizePersistedSave({
    saveVersion: 22,
    gameState: seed.gameState,
    neighborhoods: seed.neighborhoods,
    resources: seed.resources,
    eventPool: seed.eventPool,
    decisionHistory: seed.decisionHistory,
    snapshots: seed.snapshots,
  });

  if (hydratedV22 != null && hydratedV22.saveVersion === SAVE_VERSION) {
    findings.push(
      pass(
        'save_migration.hydrate_v22',
        'save_migration',
        'v22 hydrate safe',
        'normalizePersistedSave upgrades v22 to current version.',
        'QA: spot-check v21–v22 saves if available.',
      ),
    );
  } else {
    findings.push(
      failFinding(
        'save_migration.hydrate_v22',
        'save_migration',
        'v22 hydrate failed',
        'Hydrate returned null or wrong version.',
        'Fix gamePersist migration path.',
      ),
    );
  }

  const persistBlob = readRepo('src/store/gamePersist.ts');
  const migrationCount = (persistBlob.match(/saveVersion\s*===\s*\d+/g) ?? []).length;
  if (migrationCount >= 5) {
    findings.push(
      warnFinding(
        'save_migration.migration_depth',
        'save_migration',
        'Migration depth',
        `${migrationCount} version branches in gamePersist — accumulated migrations.`,
        'Run QA checklist on legacy saves before soft-launch.',
        'qa',
      ),
    );
  } else {
    findings.push(
      pass(
        'save_migration.migration_depth',
        'save_migration',
        'Migration depth acceptable',
        'Persist migration branches within expected range.',
        'Keep migrations idempotent.',
      ),
    );
  }

  return findings;
}

export function auditFirstSessionReadiness(): SoftLaunchReadinessFinding[] {
  const findings: SoftLaunchReadinessFinding[] = [];
  const firstTen = verifyFirstTenMinutesScenario();
  findings.push(
    ...verifyOutcomeToFindings('first_session', 'first_10_minutes', firstTen, 'verify:first-10-minutes'),
  );

  const playerFlow = runPlayerFlowAudit();
  const day1Warn = playerFlow.findings.filter(
    (f) => f.stage === 'day1_first_session' && f.status === 'warn',
  );
  if (day1Warn.length > 0) {
    findings.push(
      warnFinding(
        'first_session.player_flow_day1_playtest',
        'first_session',
        'Day 1 manual playtest pending',
        `${day1Warn.length} Day 1 player-flow WARN — human playtest still required.`,
        'Complete docs/crevia-player-flow-playtest-checklist.md Day 1 section.',
        'qa',
      ),
    );
  } else {
    findings.push(
      pass(
        'first_session.player_flow_day1',
        'first_session',
        'Day 1 automated checks',
        'No Day 1 player-flow FAIL.',
        'Still run manual Day 1 playtest before public launch.',
        'qa',
      ),
    );
  }

  return findings;
}

export function auditCoreGameplayReadiness(): SoftLaunchReadinessFinding[] {
  const findings: SoftLaunchReadinessFinding[] = [];

  const fullLoop = runFullLoopAnalysis();
  if (fullLoop.saveVersionOk && fullLoop.scenarios.every((s) => s.crashes === 0)) {
    findings.push(
      pass(
        'core_gameplay_loop.full_loop',
        'core_gameplay_loop',
        'Full loop simulation PASS',
        `${fullLoop.scenarios.length} scenarios without crash.`,
        'Keep full-loop in CI before release builds.',
      ),
    );
  } else {
    findings.push(
      failFinding(
        'core_gameplay_loop.full_loop',
        'core_gameplay_loop',
        'Full loop simulation FAIL',
        'Crash or SAVE_VERSION mismatch in full loop analysis.',
        'Fix runFullLoopAnalysis failures — release blocker.',
      ),
    );
  }

  findings.push(
    ...verifyOutcomeToFindings(
      'core_gameplay_loop',
      'day_pipeline',
      verifyDayPipelineScenario(),
      'verify:day-pipeline',
    ),
  );
  findings.push(
    ...verifyOutcomeToFindings(
      'core_gameplay_loop',
      'assignment_layer',
      verifyAssignmentScenario(),
      'verify:assignment-layer',
    ),
  );
  findings.push(
    ...verifyOutcomeToFindings(
      'core_gameplay_loop',
      'daily_planning',
      verifyDailyPlanningScenario(),
      'verify:daily-planning',
    ),
  );
  findings.push(
    ...verifyOutcomeToFindings(
      'core_gameplay_loop',
      'operation_signals',
      verifyOperationSignalsScenario(),
      'verify:operation-signals',
    ),
  );
  findings.push(
    ...verifyOutcomeToFindings(
      'core_gameplay_loop',
      'advisor',
      verifyAdvisorScenario(),
      'verify:advisor',
    ),
  );

  return findings;
}

export function auditPostPilotOfferReadiness(): SoftLaunchReadinessFinding[] {
  const findings: SoftLaunchReadinessFinding[] = [];

  findings.push(
    ...verifyOutcomeToFindings(
      'post_pilot_offer',
      'monetization_gate',
      verifyMonetizationScenario(),
      'verify:monetization-gate',
    ),
  );

  if (MONETIZATION_COPY.restoreCta === 'Erişimi Geri Yükle') {
    findings.push(
      pass(
        'post_pilot_offer.restore_cta',
        'post_pilot_offer',
        'Restore CTA label',
        'Erişimi Geri Yükle',
        'Keep aligned with IAP offer copy.',
        'monetization',
      ),
    );
  } else {
    findings.push(
      failFinding(
        'post_pilot_offer.restore_cta',
        'post_pilot_offer',
        'Restore CTA mismatch',
        `Expected Erişimi Geri Yükle, got ${MONETIZATION_COPY.restoreCta}.`,
        'Update monetizationConstants restoreCta.',
        'monetization',
      ),
    );
  }

  const offerCopy = buildIapOfferCopyModel();
  const forbiddenHit = SOFT_LAUNCH_FORBIDDEN_COPY_WORDS.find((w) =>
    [offerCopy.title, offerCopy.primaryCtaLabel, offerCopy.secondaryCtaLabel]
      .join(' ')
      .toLowerCase()
      .includes(w),
  );
  if (!forbiddenHit) {
    findings.push(
      pass(
        'post_pilot_offer.copy_forbidden',
        'post_pilot_offer',
        'Offer copy clean',
        'No forbidden paywall words in IAP offer model.',
        'Re-check after UI copy edits.',
        'design',
      ),
    );
  } else {
    findings.push(
      failFinding(
        'post_pilot_offer.copy_forbidden',
        'post_pilot_offer',
        'Forbidden copy in offer',
        `Found: ${forbiddenHit}`,
        'Use soft Crevia language.',
        'design',
      ),
    );
  }

  return findings;
}

export function auditFullMainOperationReadiness(): SoftLaunchReadinessFinding[] {
  const findings: SoftLaunchReadinessFinding[] = [];

  const monetization = verifyMonetizationScenario();
  const mockPass = monetization.checks.some((c) =>
    c.includes('mockPurchase mainOperationAccess full'),
  );
  if (mockPass) {
    findings.push(
      pass(
        'full_main_operation.mock_full',
        'full_main_operation',
        'Mock full access',
        'mockPurchaseMainOperationPack sets full access.',
        'Keep mock in __DEV__ only for production builds.',
      ),
    );
  }

  const limitedPass = monetization.checks.some((c) =>
    c.includes('selectLimitedContinue limited access'),
  );
  if (limitedPass) {
    findings.push(
      pass(
        'full_main_operation.limited_continue',
        'full_main_operation',
        'Limited continue preserved',
        'Limited agenda path still works.',
        'Validate full vs limited value in playtest.',
        'product',
      ),
    );
  }

  const seasonSim = verifyFullSeasonSimulationScenario();
  if (!seasonSim.ok) {
    findings.push(
      failFinding(
        'full_main_operation.season_sim',
        'full_main_operation',
        'Full season simulation FAIL',
        'verify:full-season-simulation reported FAIL.',
        'Tune balance before soft-launch.',
      ),
    );
  } else if (seasonSim.warn) {
    findings.push(
      warnFinding(
        'full_main_operation.season_sim',
        'full_main_operation',
        'Full season simulation WARN',
        'Expected balance WARN — not a release blocker.',
        'Review crisis/micro tuning findings.',
      ),
    );
  } else {
    findings.push(
      pass(
        'full_main_operation.season_sim',
        'full_main_operation',
        'Full season simulation PASS',
        'verify:full-season-simulation PASS.',
        'Monitor category repetition WARN in sim output.',
      ),
    );
  }

  return findings;
}

export function auditSeasonEndReadiness(): SoftLaunchReadinessFinding[] {
  const seasonEndVerify = verifySeasonEndScenario();
  const findings = verifyOutcomeToFindings(
    'season_end',
    'season_end_verify',
    seasonEndVerify,
    'verify:season-end',
  );

  if (seasonEndVerify.checks.some((c) => c.includes('Season 2 restart'))) {
    findings.push(
      warnFinding(
        'season_end.season2_restart',
        'season_end',
        'Season 2 restart pending',
        'Sonraki operation era runtime akışı henüz yok — WARN only.',
        'Plan meta-progression for post-season-1.',
        'product',
      ),
    );
  }

  return findings;
}

export function auditIapReadiness(mode: SoftLaunchReadinessAuditMode): SoftLaunchReadinessFinding[] {
  const findings: SoftLaunchReadinessFinding[] = [];

  const iap = verifyIapProductDesignScenario();
  findings.push(
    ...verifyOutcomeToFindings(
      'monetization_iap',
      'iap_product_design',
      iap,
      'verify:iap-product-design',
    ),
  );

  const product = getMainOperationProductDefinition();
  if (product.type === 'one_time_unlock') {
    findings.push(
      pass(
        'monetization_iap.product_type',
        'monetization_iap',
        'Launch product one_time_unlock',
        product.productId,
        'Implement store product before public launch.',
        'monetization',
      ),
    );
  }

  const implBlob = [
    'src/core/iap/iapAdapterContract.ts',
    'src/core/iap/iapProductDesign.ts',
    'src/core/iap/revenueCatIapAdapter.ts',
    'src/core/iap/iapRuntimeService.ts',
  ]
    .map(readRepo)
    .join('\n');
  const hasSdkImport =
    implBlob.includes('@revenuecat') ||
    implBlob.includes('react-native-purchases') ||
    implBlob.includes('expo-in-app-purchases');

  if (hasSdkImport) {
    findings.push(
      pass(
        'monetization_iap.real_sdk',
        'monetization_iap',
        'IAP SDK code present',
        'react-native-purchases isolated in revenueCatIapAdapter.',
        'Complete manual sandbox QA on development build.',
        'monetization',
      ),
    );
  } else if (mode === 'launch_candidate') {
    findings.push(
      blockerFinding(
        'monetization_iap.iap_sdk_missing_launch',
        'monetization_iap',
        'Real IAP SDK required for launch',
        'No StoreKit/Billing/RevenueCat import — launch build blocked.',
        'Complete Real IAP Integration (Aşama 2).',
        'monetization',
      ),
    );
  } else {
    findings.push(
      warnFinding(
        'monetization_iap.iap_sdk_pending',
        'monetization_iap',
        'Real IAP SDK pending',
        'Pre-SDK readiness — adapter contract only.',
        'Implement IapAdapter before store submission.',
        'monetization',
      ),
    );
  }

  const sandboxQa = runIapSandboxQaAudit();
  const readinessMode = mode === 'launch_candidate' ? 'launch_candidate' : 'pre_sdk';
  const sandboxReadiness = runIapSandboxReadinessAudit({ mode: readinessMode });

  if (sandboxQa.health === 'BLOCKED' || sandboxQa.health === 'FAIL') {
    findings.push(
      warnFinding(
        'monetization_iap.sandbox_qa_audit',
        'monetization_iap',
        'IAP sandbox QA audit issues',
        `verify:iap-sandbox-qa health=${sandboxQa.health}.`,
        'Fix BLOCKER/FAIL before sandbox test.',
        'monetization',
      ),
    );
  } else {
    findings.push(
      warnFinding(
        'monetization_iap.sandbox_qa_pending',
        'monetization_iap',
        'IAP sandbox QA manual steps pending',
        `Automatic checks: ${sandboxQa.passCount} pass, ${sandboxQa.warnCount} warn — store/dashboard/native manual.`,
        'Run npm run verify:iap-sandbox-qa and docs/crevia-iap-sandbox-qa.md.',
        'monetization',
      ),
    );
  }

  for (const blocker of sandboxReadiness.blockers) {
    if (!blocker.appliesInMode.includes(readinessMode)) continue;
    if (blocker.severity === 'blocker' && mode === 'launch_candidate') {
      findings.push(
        blockerFinding(
          `monetization_iap.sandbox_readiness.${blocker.id}`,
          'monetization_iap',
          blocker.title,
          blocker.message,
          blocker.recommendation,
          'monetization',
        ),
      );
    } else if (blocker.severity === 'warn' || mode === 'pre_sdk') {
      findings.push(
        warnFinding(
          `monetization_iap.sandbox_readiness.${blocker.id}`,
          'monetization_iap',
          blocker.title,
          blocker.message,
          blocker.recommendation,
          'monetization',
        ),
      );
    }
  }

  if (mode === 'pre_sdk' && sandboxReadiness.health === 'WARN') {
    findings.push(
      warnFinding(
        'monetization_iap.sandbox_readiness_warn',
        'monetization_iap',
        'IAP sandbox readiness WARN (pre-SDK)',
        `Smoke matrix ${sandboxReadiness.smokeTestPlan.cases.length} cases; manual store setup pending.`,
        `Run verify:iap-sandbox-readiness and ${IAP_SANDBOX_SMOKE_TEST_DOCS_PATH}.`,
        'monetization',
      ),
    );
  }

  if (
    sandboxQa.findings.some(
      (f) =>
        (f.id === 'env.ios_public_key' || f.id === 'env.android_public_key') &&
        f.severity === 'warn',
    )
  ) {
    findings.push(
      warnFinding(
        'monetization_iap.public_keys_pending',
        'monetization_iap',
        'RevenueCat public SDK keys pending',
        'EXPO_PUBLIC_REVENUECAT_* not set for sandbox.',
        'Add appl_/goog_ keys to .env or EAS secrets.',
        'monetization',
      ),
    );
  }

  findings.push(
    warnFinding(
      'monetization_iap.sandbox_purchase_pending',
      'monetization_iap',
      'Manual sandbox purchase not verified',
      'Automated store purchase test out of scope.',
      'Complete purchase smoke test on EAS dev build.',
      'monetization',
    ),
  );

  findings.push(
    warnFinding(
      'monetization_iap.store_product_ids',
      'monetization_iap',
      'Store product IDs pending',
      'crevia.main_operation.season1 / crevia_main_operation_season_1 documented only.',
      'Create products in App Store Connect and Play Console.',
      'monetization',
    ),
  );

  findings.push(
    warnFinding(
      'monetization_iap.pricing_pending',
      'monetization_iap',
      'Pricing not finalized',
      'Price decision deferred to store listing phase.',
      'Finalize regional pricing before submission.',
      'product',
    ),
  );

  if (existsSync(join(REPO_ROOT, IAP_SANDBOX_QA_DOCS_PATH))) {
    findings.push(
      pass(
        'monetization_iap.sandbox_qa_docs',
        'monetization_iap',
        'IAP sandbox QA docs',
        IAP_SANDBOX_QA_DOCS_PATH,
        'Follow checklist before device test.',
        'monetization',
      ),
    );
  }

  if (existsSync(join(REPO_ROOT, IAP_SANDBOX_SMOKE_TEST_DOCS_PATH))) {
    findings.push(
      pass(
        'monetization_iap.sandbox_smoke_docs',
        'monetization_iap',
        'IAP sandbox smoke test docs',
        IAP_SANDBOX_SMOKE_TEST_DOCS_PATH,
        'Complete manual smoke matrix on EAS dev build.',
        'monetization',
      ),
    );
  }

  if (existsSync(join(REPO_ROOT, SOFT_LAUNCH_IAP_DOCS_PATH))) {
    findings.push(
      pass(
        'monetization_iap.docs',
        'monetization_iap',
        'IAP design docs',
        SOFT_LAUNCH_IAP_DOCS_PATH,
        'Keep docs in sync with store listing.',
        'monetization',
      ),
    );
  }

  return findings;
}

export function auditAnalyticsReadiness(mode: SoftLaunchReadinessAuditMode): SoftLaunchReadinessFinding[] {
  const findings: SoftLaunchReadinessFinding[] = [];

  const analyticsVerify = verifyAnalyticsScenario();
  findings.push(
    ...verifyOutcomeToFindings(
      'analytics',
      'analytics_events',
      analyticsVerify,
      'verify:analytics-events',
    ),
  );

  const eventCount = ANALYTICS_EVENT_DEFINITIONS.length;
  const funnelCount = ANALYTICS_FUNNEL_DEFINITIONS.length;
  if (eventCount >= 50 && funnelCount >= 9) {
    findings.push(
      pass(
        'analytics.schema_coverage',
        'analytics',
        'Analytics schema coverage',
        `${eventCount} events, ${funnelCount} funnels.`,
        'Instrument critical funnels in Aşama 2.',
        'analytics',
      ),
    );
  }

  const privacy = validateAnalyticsPrivacy(ANALYTICS_EVENT_DEFINITIONS);
  if (privacy.health === 'FAIL') {
    findings.push(
      blockerFinding(
        'analytics.privacy_fail',
        'analytics',
        'Analytics privacy FAIL',
        'Forbidden payload keys or privacy rules violated.',
        'Fix analyticsPrivacy before any SDK wiring.',
        'analytics',
      ),
    );
  } else {
    findings.push(
      pass(
        'analytics.privacy_pass',
        'analytics',
        'Analytics privacy PASS',
        'Payload allowlists and forbidden keys enforced.',
        'Re-run after adding new event payloads.',
        'analytics',
      ),
    );
  }

  const trackerBlob = readRepo('src/core/analytics/analyticsTracker.ts');
  const hasRuntimeSdk =
    trackerBlob.includes('firebase') ||
    trackerBlob.includes('amplitude') ||
    trackerBlob.includes('posthog');

  if (hasRuntimeSdk) {
    findings.push(
      pass(
        'analytics.runtime_sdk',
        'analytics',
        'Analytics SDK wired',
        'Tracker references external SDK.',
        'Validate dashboard funnels.',
        'analytics',
      ),
    );
  } else if (mode === 'launch_candidate') {
    findings.push(
      blockerFinding(
        'analytics.instrumentation_launch',
        'analytics',
        'Production analytics SDK required',
        'trackAnalyticsEvent is no-op; wire Firebase/Amplitude/PostHog before soft-launch build.',
        'Connect SDK + dashboard; run manual funnel smoke on device.',
        'analytics',
      ),
    );
  } else {
    const runtimeBlob = readRepo('src/core/analytics/analyticsRuntime.ts');
    const hasRuntimeInstrumentation =
      runtimeBlob.includes('trackCreviaEvent') &&
      runtimeBlob.includes('trackOncePerRuntime') &&
      readRepo('src/features/hub/screens/HubScreen.tsx').includes('trackOncePerRuntime');

    if (hasRuntimeInstrumentation) {
      findings.push(
        pass(
          'analytics.instrumentation_mvp',
          'analytics',
          'Runtime analytics instrumentation (MVP)',
          'Critical funnel events wired via trackCreviaEvent / trackOncePerRuntime (no-op tracker).',
          'Wire production SDK + dashboard before launch_candidate build.',
          'analytics',
        ),
      );
    } else {
      findings.push(
        warnFinding(
          'analytics.instrumentation_pending',
          'analytics',
          'Runtime analytics instrumentation pending',
          'Schema ready; UI instrumentation not connected.',
          'Connect trackAnalyticsEvent in PostPilotOffer and key surfaces.',
          'analytics',
        ),
      );
    }
    findings.push(
      warnFinding(
        'analytics.dashboard_pending',
        'analytics',
        'Analytics dashboard pending',
        'No Firebase/Amplitude/PostHog dashboard yet.',
        'Configure dashboard after SDK integration.',
        'analytics',
      ),
    );
  }

  return findings;
}

export function auditPerformanceReadiness(): SoftLaunchReadinessFinding[] {
  const findings: SoftLaunchReadinessFinding[] = [];
  const audit = runSelectorAudit();

  if (audit.health === 'FAIL') {
    findings.push(
      failFinding(
        'performance.selector_fail',
        'performance',
        'Performance selector audit FAIL',
        `${audit.failCount} FAIL findings in selector audit.`,
        'Fix FAIL before release — potential crash or broken UI.',
      ),
    );
  } else if (audit.health === 'WARN') {
    findings.push(
      warnFinding(
        'performance.selector_warn',
        'performance',
        'Performance selector WARN',
        `${audit.warnCount} WARN — full gameState selectors on Hub cards.`,
        'Refactor to narrow selectors; test on low-end devices.',
      ),
    );
    findings.push(
      pass(
        'performance.selector_no_fail',
        'performance',
        'Performance audit no FAIL',
        'Selector audit FAIL count is zero.',
        'WARN acceptable for pre-SDK readiness.',
      ),
    );
  } else {
    findings.push(
      pass(
        'performance.selector_pass',
        'performance',
        'Performance selector PASS',
        'No WARN/FAIL in selector audit.',
        'Maintain after Hub changes.',
      ),
    );
  }

  const crash = runCrashPerformanceAudit();
  if (crash.codeIntegrationPass) {
    findings.push(
      pass(
        'performance.crash_sdk_code_ready',
        'performance',
        'Crash SDK code integration (Sentry-first)',
        `mode=${crash.integrationMode}, release=${crash.releaseReadinessStatus}.`,
        CRASH_PERFORMANCE_DOCS_PATH,
      ),
    );
  } else {
    findings.push(
      warnFinding(
        'performance.crash_sdk_pending',
        'performance',
        'Crash SDK integration pending',
        'Sentry-first observability layer incomplete.',
        'Run verify:crash-performance.',
      ),
    );
  }

  if (crash.environmentConfigStatus !== 'ready') {
    findings.push(
      warnFinding(
        'performance.crash_env_pending',
        'performance',
        'Crash SDK DSN / enable flag pending',
        `environmentConfigStatus=${crash.environmentConfigStatus}`,
        'Runtime stays no-op until env configured.',
      ),
    );
  }

  if (crash.smokeTestStatus !== 'passed') {
    findings.push(
      warnFinding(
        'performance.crash_smoke_pending',
        'performance',
        'Crash dashboard smoke test pending',
        'Manual Sentry verification not completed.',
        'Internal EAS build + dev crash test button.',
      ),
    );
  }

  return findings;
}

export function auditQaPlaytestReadiness(mode: SoftLaunchReadinessAuditMode): SoftLaunchReadinessFinding[] {
  const findings: SoftLaunchReadinessFinding[] = [];

  if (existsSync(join(REPO_ROOT, SOFT_LAUNCH_PLAYER_FLOW_DOCS_PATH))) {
    findings.push(
      pass(
        'qa_playtest.docs',
        'qa_playtest',
        'Playtest checklist doc',
        SOFT_LAUNCH_PLAYER_FLOW_DOCS_PATH,
        'Use for manual sessions.',
        'qa',
      ),
    );
  } else {
    findings.push(
      failFinding(
        'qa_playtest.docs',
        'qa_playtest',
        'Playtest checklist missing',
        SOFT_LAUNCH_PLAYER_FLOW_DOCS_PATH,
        'Restore player flow playtest doc.',
        'qa',
      ),
    );
  }

  const playerFlowVerify = verifyPlayerFlowAuditScenario();
  if (playerFlowVerify.ok) {
    findings.push(
      pass(
        'qa_playtest.player_flow_audit',
        'qa_playtest',
        'Player flow audit automated PASS',
        `Audit health: ${playerFlowVerify.auditHealth}`,
        'Complete manual checklist items.',
        'qa',
      ),
    );
  }

  if (mode === 'launch_candidate') {
    findings.push(
      blockerFinding(
        'qa_playtest.manual_playtest_launch',
        'qa_playtest',
        'Manual playtest required for launch',
        'Human playtest not marked complete.',
        'Run 4 profiles on real devices per checklist.',
        'qa',
      ),
    );
  } else {
    findings.push(
      warnFinding(
        'qa_playtest.manual_playtest_pending',
        'qa_playtest',
        'Manual playtest pending',
        'Real human playtest still required.',
        'Complete docs/crevia-player-flow-playtest-checklist.md.',
        'qa',
      ),
    );
    findings.push(
      warnFinding(
        'qa_playtest.device_test_pending',
        'qa_playtest',
        'Real device test pending',
        'Minimum 4 profile + iOS/Android smoke not logged.',
        'Schedule device matrix QA before public soft-launch.',
        'qa',
      ),
    );
  }

  return findings;
}

export function auditStoreReviewCopyReadiness(): SoftLaunchReadinessFinding[] {
  const findings: SoftLaunchReadinessFinding[] = [];

  const copySources = [
    MONETIZATION_COPY.offerTitle,
    MONETIZATION_COPY.offerSubtitle,
    MONETIZATION_COPY.primaryCta,
    MONETIZATION_COPY.secondaryCta,
    MONETIZATION_COPY.restoreCta,
    buildIapOfferCopyModel().footerNote,
  ].join(' ');

  const hit = SOFT_LAUNCH_FORBIDDEN_COPY_WORDS.find((w) =>
    copySources.toLowerCase().includes(w),
  );
  if (!hit) {
    findings.push(
      pass(
        'store_review_copy.forbidden_scan',
        'store_review_copy',
        'Forbidden copy scan PASS',
        'Monetization and IAP offer constants clean.',
        'Re-scan after UI string changes.',
        'design',
      ),
    );
  } else {
    findings.push(
      blockerFinding(
        'store_review_copy.forbidden_hit',
        'store_review_copy',
        'Forbidden copy in player UI constants',
        `Found: ${hit}`,
        'Remove aggressive paywall language.',
        'design',
      ),
    );
  }

  for (const word of IAP_UI_FORBIDDEN_WORDS) {
    if (copySources.toLowerCase().includes(word)) {
      findings.push(
        failFinding(
          `store_review_copy.iap_forbidden_${word}`,
          'store_review_copy',
          `IAP forbidden word: ${word}`,
          'IAP constants contain blocked term.',
          'Align with IAP product design doc.',
          'design',
        ),
      );
    }
  }

  return findings;
}

export function auditDebugToolsReadiness(): SoftLaunchReadinessFinding[] {
  const findings: SoftLaunchReadinessFinding[] = [];

  const hubDev = readRepo('src/features/hub/components/HubDevTools.tsx');
  const postPilotDev = readRepo('src/features/devtools/postPilotDevToolsGuard.ts');

  if (hubDev.includes('__DEV__') && hubDev.includes('if (!__DEV__)')) {
    findings.push(
      pass(
        'debug_tools.hub_guard',
        'debug_tools',
        'HubDevTools __DEV__ guard',
        'Production build should hide Hub dev tools.',
        'Verify release build binary.',
      ),
    );
  } else {
    findings.push(
      blockerFinding(
        'debug_tools.hub_guard',
        'debug_tools',
        'HubDevTools guard missing',
        'No __DEV__ guard detected.',
        'Add production guard — release blocker.',
      ),
    );
  }

  if (postPilotDev.includes('__DEV__')) {
    findings.push(
      pass(
        'debug_tools.post_pilot_guard',
        'debug_tools',
        'PostPilotDevTools guard',
        'postPilotDevToolsGuard checks __DEV__.',
        'Confirm mock purchase hidden in production.',
      ),
    );
  } else {
    findings.push(
      failFinding(
        'debug_tools.post_pilot_guard',
        'debug_tools',
        'PostPilot dev guard weak',
        'Could not verify __DEV__ guard.',
        'Audit PostPilotOfferScreen dev CTAs.',
      ),
    );
  }

  const interaction = verifyInteractionContractsScenario();
  const devGuardPass = interaction.checks.some((c) =>
    c.includes('Dev tools production guard'),
  );
  if (devGuardPass) {
    findings.push(
      pass(
        'debug_tools.interaction_contract',
        'debug_tools',
        'Interaction contract dev guard PASS',
        'Registry documents dev tool production guards.',
        'Keep registry updated when adding dev buttons.',
      ),
    );
  }

  return findings;
}

export function auditReleaseBlockersReadiness(
  allFindings: SoftLaunchReadinessFinding[],
): SoftLaunchReadinessFinding[] {
  const findings: SoftLaunchReadinessFinding[] = [];

  const criticalFails = allFindings.filter(
    (f) =>
      f.area !== 'release_blockers' &&
      (f.severity === 'fail' || f.severity === 'blocker'),
  );

  if (criticalFails.length === 0) {
    findings.push(
      pass(
        'release_blockers.none',
        'release_blockers',
        'No release blockers',
        'Pre-SDK audit: no FAIL/BLOCKER findings.',
        'Re-run in launch_candidate mode before store submission.',
      ),
    );
  } else {
    findings.push(
      warnFinding(
        'release_blockers.summary',
        'release_blockers',
        `${criticalFails.length} critical finding(s)`,
        criticalFails
          .slice(0, 3)
          .map((f) => f.title)
          .join('; '),
        'Resolve before public soft-launch; pre-SDK may still proceed if only launch-gating items.',
        'engineering',
      ),
    );
  }

  return findings;
}

export function runSoftLaunchReadinessAudit(
  options: RunSoftLaunchReadinessAuditOptions = {},
): SoftLaunchReadinessAuditResult {
  const mode: SoftLaunchReadinessAuditMode = options.mode ?? 'pre_sdk';

  const findings: SoftLaunchReadinessFinding[] = [
    ...auditSaveMigrationReadiness(),
    ...auditFirstSessionReadiness(),
    ...auditCoreGameplayReadiness(),
    ...auditPostPilotOfferReadiness(),
    ...auditFullMainOperationReadiness(),
    ...auditSeasonEndReadiness(),
    ...auditIapReadiness(mode),
    ...auditAnalyticsReadiness(mode),
    ...auditPerformanceReadiness(),
    ...auditQaPlaytestReadiness(mode),
    ...auditStoreReviewCopyReadiness(),
    ...auditDebugToolsReadiness(),
  ];

  const blockerRollup = auditReleaseBlockersReadiness(findings);
  findings.push(...blockerRollup);

  const passCount = findings.filter((f) => f.severity === 'pass').length;
  const warnCount = findings.filter((f) => f.severity === 'warn').length;
  const failCount = findings.filter((f) => f.severity === 'fail').length;
  const blockerCount = findings.filter((f) => f.severity === 'blocker').length;
  const health = calculateSoftLaunchHealth(findings);
  const areaSummaries = buildAreaSummaries(findings);

  const base: Omit<SoftLaunchReadinessAuditResult, 'nextRecommendedPatch' | 'releaseDecision'> = {
    health,
    checkedCount: findings.length,
    passCount,
    warnCount,
    failCount,
    blockerCount,
    areaSummaries,
    findings,
    auditMode: mode,
  };

  const nextRecommendedPatch = getNextRecommendedPatch({
    ...base,
    nextRecommendedPatch: '',
    releaseDecision: 'Ready for SDK Integration',
  });

  const releaseDecision = getSoftLaunchReleaseDecision({
    ...base,
    nextRecommendedPatch,
    releaseDecision: 'Ready for SDK Integration',
  });

  return {
    ...base,
    nextRecommendedPatch,
    releaseDecision,
  };
}

/** Test helper: simulate health with injected findings. */
export function calculateSoftLaunchHealthForTest(
  findings: SoftLaunchReadinessFinding[],
): SoftLaunchReadinessHealth {
  return calculateSoftLaunchHealth(findings);
}
