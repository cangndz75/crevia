/**
 * Merkez (Hub) UI görsel denge verify.
 * Çalıştır: npm run verify:hub-ui
 */

import { verifyHubUiScenario } from '../src/features/hub/verifyHubUiScenario';

const result = verifyHubUiScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error(`\nHub UI verify failed (${result.failCount} checks).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nHub UI verify passed.');
