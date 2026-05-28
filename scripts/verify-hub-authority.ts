/**
 * Hub yetki chip smoke doğrulaması.
 * Çalıştır: npm run verify:hub-authority
 */

import { verifyHubAuthorityScenario } from '../src/features/hub/utils/verifyHubAuthorityScenario';

const result = verifyHubAuthorityScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nHub authority verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nHub authority verify passed.');
