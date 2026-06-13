/**
 * Önerilen Plan / Şehir Günlüğü Preview verify.
 * Çalıştır: npm run verify:center-recommended-plan
 */

import { verifyCenterRecommendedPlanScenario } from '../src/features/hub/verifyCenterRecommendedPlanScenario';

const outcome = verifyCenterRecommendedPlanScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!outcome.ok) {
  // eslint-disable-next-line no-console
  console.error(`\n${outcome.failCount} check(s) failed.`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nAll center recommended plan checks passed.');
