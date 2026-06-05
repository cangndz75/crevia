/**
 * IAP sandbox smoke test execution plan & result model verify.
 * Çalıştır: npm run verify:iap-sandbox-smoke-execution
 */

import { buildIapSandboxSmokeExecutionResult } from '../src/core/iapQa/iapSandboxSmokeExecutionAudit';
import { buildIapSandboxSmokeExecutionConsoleSummary } from '../src/core/iapQa/iapSandboxSmokeExecutionPresentation';
import { verifyIapSandboxSmokeExecutionScenario } from '../src/core/iapQa/verifyIapSandboxSmokeExecutionScenario';

const outcome = verifyIapSandboxSmokeExecutionScenario();
const result = buildIapSandboxSmokeExecutionResult();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildIapSandboxSmokeExecutionConsoleSummary(result));
// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);
// eslint-disable-next-line no-console
console.log(`Execution health: ${outcome.executionHealth}`);
// eslint-disable-next-line no-console
console.log(`Execution decision: ${outcome.executionDecision}`);
// eslint-disable-next-line no-console
console.log('NOTE: Real sandbox smoke NOT executed — manual EAS dev build required.');

if (!outcome.ok) {
  process.exit(1);
}
