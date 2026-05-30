/**
 * Mikro animasyon presentation doğrulaması.
 * Çalıştır: npm run verify:animation-presentation
 */

import { verifyAnimationPresentationScenario } from '../src/core/animations/verifyAnimationPresentationScenario';

const result = verifyAnimationPresentationScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error(`\nAnimation presentation verify failed (${result.failCount} FAIL).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nAnimation presentation verify passed.');
