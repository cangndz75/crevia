/**
 * Personel smoke doğrulaması.
 * Çalıştır: npm run verify:personnel
 */

import { verifyPersonnelScenario } from '../src/core/personnel/verifyPersonnelScenario';

const result = verifyPersonnelScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nPersonnel verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nPersonnel verify passed.');
