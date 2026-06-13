/**
 * Merkez home bilgi mimarisi verify.
 * Çalıştır: npm run verify:center-home-ia
 */

import { verifyCenterHomeIaScenario } from '../src/features/hub/verifyCenterHomeIaScenario';

const outcome = verifyCenterHomeIaScenario();

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
console.log('\nAll center home IA checks passed.');
