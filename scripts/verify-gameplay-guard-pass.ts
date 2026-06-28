/**
 * Genel 10/10 Gameplay Guard Pass verify.
 * Çalıştır: npm run verify:gameplay-guard-pass
 */

import { verifyGameplayGuardPassScenario } from '../src/core/quality/verifyGameplayGuardPassScenario';

const outcome = verifyGameplayGuardPassScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(`Next recommended pass: ${outcome.nextRecommendedPassId}`);
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((line) => line.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((line) => line.startsWith('FAIL')).length} FAIL`,
);

if (!outcome.ok) {
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nGameplay 10/10 guard pass checks passed.');
