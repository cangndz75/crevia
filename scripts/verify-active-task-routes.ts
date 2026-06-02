/**
 * Active task route foundation verify.
 * Çalıştır: npm run verify:active-task-routes
 */

import { verifyActiveTaskRouteScenario } from '../src/core/activeTaskRoutes/verifyActiveTaskRouteScenario';

const outcome = verifyActiveTaskRouteScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);

if (!outcome.ok) {
  process.exit(1);
}
