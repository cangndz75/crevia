/**
 * Pilot final yetki değerlendirmesi smoke doğrulaması.
 * Çalıştır: npm run verify:authority-pilot
 */

import { verifyAuthorityPilotCompletionScenario } from '../src/core/authority/verifyAuthorityPilotCompletionScenario';

const result = verifyAuthorityPilotCompletionScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nAuthority pilot completion verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nAuthority pilot completion verify passed.');
