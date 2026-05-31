/**
 * IAP Sandbox QA & native setup verify.
 * Çalıştır: npm run verify:iap-sandbox-qa
 */

import { verifyIapSandboxQaScenario } from '../src/core/iapQa/verifyIapSandboxQaScenario';

const outcome = verifyIapSandboxQaScenario();

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
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);
// eslint-disable-next-line no-console
console.log(`Audit health: ${outcome.auditHealth}`);

if (!outcome.ok) {
  process.exit(1);
}
