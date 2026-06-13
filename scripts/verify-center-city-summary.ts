/**
 * Merkez Özeti runtime binding verify.
 * Çalıştır: npm run verify:center-city-summary
 */

import { verifyCenterCitySummaryScenario } from '../src/features/hub/verifyCenterCitySummaryScenario';

const outcome = verifyCenterCitySummaryScenario();

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
console.log('\nAll center city summary checks passed.');
