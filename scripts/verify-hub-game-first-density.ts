/**
 * Merkez hub game-first density verify.
 * Çalıştır: npm run verify:hub-game-first-density
 */

import { verifyCenterHubGameFirstDensityScenario } from '../src/features/hub/verifyCenterHubGameFirstDensityScenario';

const outcome = verifyCenterHubGameFirstDensityScenario();

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
console.log('\nAll hub game-first density checks passed.');
