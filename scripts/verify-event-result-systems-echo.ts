/**
 * Operasyon sonucu yeni sistem echo verify.
 * Çalıştır: npm run verify:event-result-systems-echo
 */

import { verifyEventResultSystemsEchoScenario } from '../src/core/events/verifyEventResultSystemsEchoScenario';

const result = verifyEventResultSystemsEchoScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nEvent result systems echo verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nEvent result systems echo verify passed.');
