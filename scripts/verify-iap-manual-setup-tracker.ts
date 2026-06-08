/**
 * IAP manual setup tracker verify.
 * Çalıştır: npm run verify:iap-manual-setup-tracker
 */

import { buildIapDashboardEntryConsoleSummary } from '../src/core/iapQa/iapDashboardEntryChecklist';
import { buildIapManualSetupTracker } from '../src/core/iapQa/iapManualSetupTrackerAudit';
import { buildIapManualSetupConsoleSummary } from '../src/core/iapQa/iapManualSetupTrackerPresentation';
import { verifyIapManualSetupTrackerScenario } from '../src/core/iapQa/verifyIapManualSetupTrackerScenario';

const outcome = verifyIapManualSetupTrackerScenario();
const result = buildIapManualSetupTracker();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildIapManualSetupConsoleSummary(result));
// eslint-disable-next-line no-console
console.log('');
if (result.dashboardEntryChecklist) {
  // eslint-disable-next-line no-console
  console.log(
    buildIapDashboardEntryConsoleSummary({
      checklist: result.dashboardEntryChecklist,
      placeholderCount: result.placeholderCount ?? 0,
      verifiedEvidenceCount: result.verifiedEvidenceCount ?? 0,
      canStartSandboxTesting: result.canStartSandboxTesting ?? false,
      canSubmitForReview: result.canSubmitForReview ?? false,
      appStoreChecklistStatus: result.appStoreChecklistStatus ?? 'pending',
      playChecklistStatus: result.playChecklistStatus ?? 'pending',
      revenueCatChecklistStatus: result.revenueCatChecklistStatus ?? 'pending',
      sandboxMatrixStatus: result.sandboxMatrixStatus ?? 'pending',
      offerScreenTrustQaStatus: 'pending_manual',
      fakePassGuard: true,
    }),
  );
  // eslint-disable-next-line no-console
  console.log('');
}
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);
// eslint-disable-next-line no-console
console.log(`Tracker health: ${outcome.trackerHealth}`);
// eslint-disable-next-line no-console
console.log('NOTE: Real dashboard setup NOT performed — manual steps required.');

if (!outcome.ok) {
  process.exit(1);
}
