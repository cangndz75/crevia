/**
 * Merkez header + resource strip verify.
 * Çalıştır: npm run verify:center-header
 */

import { verifyCenterHeaderScenario } from '../src/features/hub/verifyCenterHeaderScenario';

const outcome = verifyCenterHeaderScenario();

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
console.log('\nAll center header checks passed.');
