/**
 * Mahalle kimlik katmanı smoke doğrulaması.
 * Çalıştır: npm run verify:district-identity
 */

import { verifyDistrictIdentityScenario } from '../src/core/districts/verifyDistrictIdentityScenario';

const result = verifyDistrictIdentityScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error(`\nDistrict identity verify failed (${result.failCount} check(s)).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nDistrict identity verify passed.');
