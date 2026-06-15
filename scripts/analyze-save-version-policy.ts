/**
 * SAVE_VERSION policy analyzer.
 * Calistir: npm run analyze:save-version-policy
 */

import { analyzeSaveVersionPolicyScenario } from '../src/core/quality/verifySaveVersionPolicyScenario';

const result = analyzeSaveVersionPolicyScenario();

for (const line of result.lines) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log(`\nblockingFailures: ${result.report.blockingFailures.length}`);

if (!result.ok) {
  process.exit(1);
}
