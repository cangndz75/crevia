/**
 * SAVE_VERSION 28 verify policy cleanup.
 * Calistir: npm run verify:save-version-policy
 */

import { verifySaveVersionPolicyScenario } from '../src/core/quality/verifySaveVersionPolicyScenario';

const outcome = verifySaveVersionPolicyScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Policy report: current=${outcome.report.currentSaveVersion} ` +
    `legacyChecks=${outcome.report.legacyVersionChecksFound} ` +
    `blocking=${outcome.report.blockingFailures.length}`,
);

if (!outcome.ok) {
  process.exit(1);
}
