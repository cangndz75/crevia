/**
 * Sosyal Nabız UI smoke doğrulaması.
 * Çalıştır: npm run verify:social-pulse-ui
 */

import { verifySocialPulseUiScenario } from '../src/features/social/verifySocialPulseUiScenario';

const result = verifySocialPulseUiScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error(`\nSocial pulse UI verify failed (${result.failCount} check(s)).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nSocial pulse UI verify passed.');
