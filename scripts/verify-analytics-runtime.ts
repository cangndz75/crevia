/**
 * Analytics runtime instrumentation verify.
 * Çalıştır: npm run verify:analytics-runtime
 */

import { verifyAnalyticsRuntimeScenario } from '../src/core/analytics/verifyAnalyticsRuntimeScenario';

const outcome = verifyAnalyticsRuntimeScenario();

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

const pass = outcome.checks.filter((c) => c.startsWith('PASS')).length;
const warn = outcome.checks.filter((c) => c.startsWith('WARN')).length;
const fail = outcome.checks.filter((c) => c.startsWith('FAIL')).length;

// eslint-disable-next-line no-console
console.log(`Summary: ${pass} PASS, ${warn} WARN, ${fail} FAIL`);

if (!outcome.ok) {
  process.exit(1);
}
