/**
 * Operasyon İncele fazı UI verify.
 * Çalıştır: npm run verify:operation-inspect-ui
 */

import { verifyOperationInspectUiScenario } from '../src/features/events/verifyOperationInspectUiScenario';

const outcome = verifyOperationInspectUiScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!outcome.ok) {
  // eslint-disable-next-line no-console
  console.error(`\n${outcome.failCount} check(s) failed.`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nAll operation inspect UI checks passed.');
