/**
 * Crevia icon presentation smoke doğrulaması.
 * Çalıştır: npm run verify:icon-presentation
 */

import { verifyIconPresentationScenario } from '../src/core/presentation/verifyIconPresentationScenario';

const result = verifyIconPresentationScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error(`\nIcon presentation verify failed (${result.failCount} check(s)).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nIcon presentation verify passed.');
