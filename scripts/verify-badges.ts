/**
 * Rozet sistemi smoke doğrulaması.
 * Çalıştır: npm run verify:badges
 */

import { verifyBadgeScenario } from '../src/core/badges/verifyBadgeScenario';

const result = verifyBadgeScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nBadge verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nBadge verify passed.');
