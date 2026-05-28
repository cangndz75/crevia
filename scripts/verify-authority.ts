/**
 * Yetki sistemi smoke doğrulaması.
 * Çalıştır: npm run verify:authority
 */

import { verifyAuthorityScenario } from '../src/core/authority/verifyAuthorityScenario';

const result = verifyAuthorityScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nAuthority verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nAuthority verify passed.');
