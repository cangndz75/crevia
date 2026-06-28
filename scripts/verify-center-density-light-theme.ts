/**
 * Merkez density reduction + light premium theme verify.
 * Çalıştır: npm run verify:center-density-light-theme
 */

import { verifyCenterDensityLightThemeScenario } from '../src/features/hub/verifyCenterDensityLightThemeScenario';

const outcome = verifyCenterDensityLightThemeScenario();

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
console.log('\nAll center density + light theme checks passed.');
