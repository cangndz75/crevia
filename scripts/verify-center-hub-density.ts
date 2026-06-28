/**
 * Merkez hub density / progressive disclosure verify.
 * Çalıştır: npm run verify:center-hub-density
 */

import { verifyCenterHubDensityScenario } from '../src/features/hub/verifyCenterHubDensityScenario';

const outcome = verifyCenterHubDensityScenario();

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
console.log('\nAll center hub density checks passed.');
