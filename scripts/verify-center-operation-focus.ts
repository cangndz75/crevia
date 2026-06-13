/**
 * Operasyon Odağı section verify.
 * Çalıştır: npm run verify:center-operation-focus
 */

import { verifyCenterOperationFocusScenario } from '../src/features/hub/verifyCenterOperationFocusScenario';

const outcome = verifyCenterOperationFocusScenario();

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
console.log('\nAll center operation focus checks passed.');
