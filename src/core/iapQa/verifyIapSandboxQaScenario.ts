import { existsSync, readFileSync } from 'node:fs';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { verifyAnalyticsScenario } from '@/core/analytics/verifyAnalyticsScenario';
import { verifyIapIntegrationScenario } from '@/core/iap/verifyIapIntegrationScenario';
import { verifyIapProductDesignScenario } from '@/core/iap/verifyIapProductDesignScenario';
import { verifyMonetizationScenario } from '@/core/monetization/verifyMonetizationScenario';
import { runSoftLaunchReadinessAudit } from '@/core/releaseReadiness/softLaunchReadinessAudit';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  IAP_SANDBOX_QA_AREAS,
  IAP_SANDBOX_QA_DOCS_PATH,
  IAP_INTEGRATION_DOCS_PATH,
  buildIapSandboxQaChecklist,
} from './iapSandboxQaConstants';
import {
  runIapSandboxQaAudit,
  runIapSandboxQaAuditWithSimulatedSecretKey,
} from './iapSandboxQaAudit';
import {
  buildIapSandboxQaConsoleReport,
  buildIapSandboxQaMarkdownChecklist,
} from './iapSandboxQaPresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyIapSandboxQaOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  auditHealth: string;
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

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

export function verifyIapSandboxQaScenario(): VerifyIapSandboxQaOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const audit = runIapSandboxQaAudit();
  const consoleReport = buildIapSandboxQaConsoleReport(audit);
  const markdown = buildIapSandboxQaMarkdownChecklist(audit);

  ok = assert(checks, audit.findings.length > 0, 'Audit result non-empty', 'Empty audit') && ok;

  for (const area of IAP_SANDBOX_QA_AREAS) {
    ok =
      assert(
        checks,
        audit.findings.some((f) => f.area === area) || audit.checklist.some((c) => c.area === area),
        `Area represented: ${area}`,
        `Missing area ${area}`,
      ) && ok;
  }

  const checklist = buildIapSandboxQaChecklist();
  ok = assert(checks, checklist.length >= 40, 'Checklist 40+ items', `Only ${checklist.length} items`) && ok;

  ok =
    assert(
      checks,
      checklist.some((c) => c.id === 'env.ios_public_key'),
      'iOS public key check exists',
      'Missing ios key checklist',
    ) && ok;
  ok =
    assert(
      checks,
      checklist.some((c) => c.id === 'env.android_public_key'),
      'Android public key check exists',
      'Missing android key checklist',
    ) && ok;
  ok =
    assert(
      checks,
      checklist.some((c) => c.id === 'env.no_secret_key'),
      'Secret key detection exists',
      'Missing secret check',
    ) && ok;
  ok =
    assert(
      checks,
      checklist.some((c) => c.id === 'rc.entitlement'),
      'RevenueCat entitlement checklist',
      'Missing entitlement item',
    ) && ok;
  ok =
    assert(
      checks,
      checklist.some((c) => c.id === 'rc.offering_package'),
      'Offering/package checklist',
      'Missing offering item',
    ) && ok;
  ok =
    assert(
      checks,
      checklist.some((c) => c.id === 'asc.product_id'),
      'iOS product id checklist',
      'Missing asc product',
    ) && ok;
  ok =
    assert(
      checks,
      checklist.some((c) => c.id === 'play.product_id'),
      'Android product id checklist',
      'Missing play product',
    ) && ok;
  ok =
    assert(
      checks,
      checklist.some((c) => c.id === 'native.ios_iap_capability'),
      'iOS IAP capability checklist',
      'Missing ios capability',
    ) && ok;
  ok =
    assert(
      checks,
      checklist.some((c) => c.id === 'native.android_billing_permission'),
      'Android BILLING checklist',
      'Missing billing',
    ) && ok;
  ok =
    assert(
      checks,
      checklist.some((c) => c.id === 'native.ios_deployment_13_4'),
      'iOS 13.4 checklist',
      'Missing ios 13.4',
    ) && ok;
  ok =
    assert(
      checks,
      checklist.some((c) => c.id === 'native.android_api_23'),
      'Android API 23 checklist',
      'Missing api 23',
    ) && ok;
  ok =
    assert(
      checks,
      checklist.some((c) => c.id === 'native.expo_go_unsupported'),
      'Expo Go unsupported checklist',
      'Missing expo go item',
    ) && ok;
  ok =
    assert(
      checks,
      checklist.some((c) => c.id === 'devbuild.eas_created'),
      'EAS dev build checklist',
      'Missing eas item',
    ) && ok;
  ok =
    assert(
      checks,
      checklist.some((c) => c.id === 'purchase.sandbox_manual'),
      'Purchase sandbox manual checklist',
      'Missing purchase manual',
    ) && ok;
  ok =
    assert(
      checks,
      checklist.some((c) => c.id === 'purchase.cancellation_friendly'),
      'Purchase cancellation checklist',
      'Missing cancel item',
    ) && ok;
  ok =
    assert(
      checks,
      checklist.some((c) => c.id === 'restore.sandbox_manual'),
      'Restore restored manual',
      'Missing restore manual',
    ) && ok;
  ok =
    assert(
      checks,
      checklist.some((c) => c.id === 'restore.not_found_copy'),
      'Restore not_found checklist',
      'Missing not_found',
    ) && ok;
  ok =
    assert(
      checks,
      audit.findings.some((f) => f.id === 'restore.user_action_only' || f.id === 'restore.no_auto_restore_mount'),
      'restore user action / no auto restore',
      'Missing restore guard finding',
    ) && ok;
  ok =
    assert(
      checks,
      audit.findings.some((f) => f.id === 'restore.no_auto_restore_mount' && f.severity === 'pass') ||
        audit.findings.some((f) => f.id === 'restore.no_auto_restore_mount'),
      'No automatic restore check',
      'Auto restore check missing',
    ) && ok;
  ok =
    assert(
      checks,
      checklist.some((c) => c.id === 'mock.dev_without_keys'),
      'Mock dev flow checklist',
      'Missing mock dev',
    ) && ok;
  ok =
    assert(
      checks,
      checklist.some((c) => c.id === 'mock.limited_flow'),
      'Limited flow checklist',
      'Missing limited',
    ) && ok;
  ok =
    assert(
      checks,
      checklist.some((c) => c.id === 'analytics.purchase_events'),
      'IAP purchase analytics checklist',
      'Missing purchase analytics',
    ) && ok;
  ok =
    assert(
      checks,
      checklist.some((c) => c.id === 'analytics.no_raw_error'),
      'No raw error analytics',
      'Missing raw error check',
    ) && ok;

  const doc = readRepo(IAP_SANDBOX_QA_DOCS_PATH);
  ok = assert(checks, doc.length > 0, 'Docs file exists', 'Missing sandbox qa doc') && ok;
  ok = assert(checks, doc.includes('RevenueCat'), 'Docs RevenueCat setup', 'Missing RC section') && ok;
  ok = assert(checks, doc.includes('App Store'), 'Docs App Store setup', 'Missing ASC section') && ok;
  ok = assert(checks, doc.includes('Play Console'), 'Docs Play Console setup', 'Missing Play section') && ok;
  ok = assert(checks, doc.includes('EAS') || doc.includes('development build'), 'Docs dev build', 'Missing dev build') && ok;
  ok = assert(checks, doc.includes('Troubleshooting'), 'Docs troubleshooting', 'Missing troubleshooting') && ok;
  ok = assert(checks, doc.includes('Rollback'), 'Docs rollback', 'Missing rollback') && ok;

  ok = assert(checks, consoleReport.length > 100, 'Console report non-empty', 'Empty report') && ok;
  ok = assert(checks, markdown.length > 50, 'Markdown checklist non-empty', 'Empty markdown') && ok;

  ok =
    assert(
      checks,
      audit.health === 'WARN',
      'Health WARN in current state',
      `Expected WARN got ${audit.health}`,
    ) && ok;
  ok =
    assert(
      checks,
      audit.health !== 'FAIL' && audit.health !== 'BLOCKED',
      'Health not FAIL/BLOCKED baseline',
      `Unexpected ${audit.health}`,
    ) && ok;

  const secretSim = runIapSandboxQaAuditWithSimulatedSecretKey();
  ok =
    assert(
      checks,
      secretSim.health === 'BLOCKED' && secretSim.blockerCount > 0,
      'Secret key simulated BLOCKED',
      `Secret sim health ${secretSim.health}`,
    ) && ok;

  ok =
    assert(
      checks,
      audit.findings.some((f) => f.id === 'env.ios_public_key' && f.severity === 'warn') ||
        audit.runtimeMode === 'revenuecat',
      'Missing keys WARN not crash',
      'Env handling wrong',
    ) && ok;

  const softLaunch = runSoftLaunchReadinessAudit({ mode: 'pre_sdk' });
  ok =
    assert(
      checks,
      softLaunch.findings.some(
        (f) =>
          f.id === 'monetization_iap.sandbox_qa_pending' ||
          f.id === 'monetization_iap.real_sdk',
      ),
      'softLaunch IAP sandbox integration',
      'Missing soft launch IAP sandbox finding',
    ) && ok;

  ok = assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION 23', 'SAVE_VERSION changed') && ok;

  const persist = readRepo('src/store/gamePersist.ts');
  ok =
    assert(
      checks,
      !persist.includes('iapSandboxQa') && !persist.includes('sandboxQaState'),
      'No new persist key',
      'Persist changed',
    ) && ok;

  ok =
    assert(
      checks,
      !readRepo('src/core/iapQa/iapSandboxQaAudit.ts').includes('applyDecision'),
      'No gameplay import in iapQa',
      'Gameplay coupling',
    ) && ok;

  ok =
    assert(
      checks,
      verifyIapIntegrationScenario().ok,
      'verify:iap-integration compatible',
      'iap integration failed',
    ) && ok;
  ok =
    assert(
      checks,
      verifyIapProductDesignScenario().ok,
      'verify:iap-product-design compatible',
      'iap product design failed',
    ) && ok;
  ok =
    assert(
      checks,
      verifyAnalyticsScenario().ok,
      'verify:analytics-events compatible',
      'analytics failed',
    ) && ok;
  ok =
    assert(
      checks,
      verifyMonetizationScenario().ok,
      'verify:monetization-gate compatible',
      'monetization failed',
    ) && ok;

  hasWarn =
    !warn(checks, false, 'Public keys configured', 'Public RevenueCat keys pending') || hasWarn;
  hasWarn =
    !warn(checks, false, 'Store products created', 'Store product creation pending') || hasWarn;
  hasWarn =
    !warn(checks, false, 'Pricing finalized', 'Pricing pending') || hasWarn;
  hasWarn =
    !warn(checks, false, 'Sandbox purchase tested', 'Sandbox purchase pending') || hasWarn;
  hasWarn =
    !warn(checks, false, 'Native capability manual complete', 'Native capability manual pending') ||
    hasWarn;

  if (audit.warnCount > 0) {
    hasWarn = true;
  }

  return {
    ok,
    warn: hasWarn,
    checks,
    auditHealth: audit.health,
    consoleReport,
  };
}
