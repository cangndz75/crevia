/**
 * Soft launch readiness audit.
 * Çalıştır: npm run verify:soft-launch-readiness
 */

import { verifySoftLaunchReadinessScenario } from '../src/core/releaseReadiness/verifySoftLaunchReadinessScenario';

const outcome = verifySoftLaunchReadinessScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(outcome.consoleReport);
// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL | Audit health: ${outcome.auditHealth}`,
);

if (!outcome.ok) {
  process.exit(1);
}
