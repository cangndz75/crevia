/**
 * Olay sonuç ekranı UI verify.
 * Çalıştır: npm run verify:event-result-ui
 */

import { verifyEventResultUiScenario } from '../src/features/events/verifyEventResultUiScenario';

const result = verifyEventResultUiScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error(`\nEvent result UI verify failed (${result.failCount} checks).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nEvent result UI verify passed.');
