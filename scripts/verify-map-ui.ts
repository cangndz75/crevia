/**
 * Harita ekranı UI verify.
 * Çalıştır: npm run verify:map-ui
 */

import { verifyMapUiScenario } from '../src/features/map/verifyMapUiScenario';

const result = verifyMapUiScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error(`\nMap UI verify failed (${result.failCount} FAIL).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nMap UI verify passed.');
