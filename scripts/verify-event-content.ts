/**
 * Event içerik kalitesi ve varyasyon smoke doğrulaması.
 * Çalıştır: npm run verify:event-content
 */

import { verifyEventContentScenario } from '../src/core/events/verifyEventContentScenario';

const result = verifyEventContentScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nEvent content verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nEvent content verify passed.');
