/**
 * Rozet vitrini presentation doğrulaması.
 * Çalıştır: npm run verify:badge-showcase
 */

import { verifyBadgeShowcaseScenario } from '../src/core/badges/verifyBadgeShowcaseScenario';

const result = verifyBadgeShowcaseScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nBadge showcase verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nBadge showcase verify passed.');
