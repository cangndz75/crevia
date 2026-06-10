/**
 * Mahalle / ana operasyon açılım bağları doğrulaması.
 * Çalıştır: npm run verify:district-operation-unlock-binding
 */

import { verifyDistrictOperationUnlockBindingScenario } from '../src/core/progression/verifyDistrictOperationUnlockBindingScenario';

const result = verifyDistrictOperationUnlockBindingScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nDistrict operation unlock binding verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nDistrict operation unlock binding verify passed.');
