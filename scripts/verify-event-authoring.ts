/**
 * Event authoring plan & guide doğrulaması.
 * Çalıştır: npm run verify:event-authoring
 */

import { verifyEventAuthoringScenario } from '../src/core/content/verifyEventAuthoringScenario';

const result = verifyEventAuthoringScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error(`\nEvent authoring verify failed (${result.failCount} FAIL).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nEvent authoring verify passed.');
