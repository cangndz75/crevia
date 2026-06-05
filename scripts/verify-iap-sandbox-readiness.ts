/**
 * IAP sandbox readiness audit — RevenueCat / store manual setup & smoke test prep.
 * Çalıştır: npm run verify:iap-sandbox-readiness
 */

import { verifyIapSandboxReadinessScenario } from '../src/core/iapQa/verifyIapSandboxReadinessScenario';

const outcome = verifyIapSandboxReadinessScenario();

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
// eslint-disable-next-line no-console
console.log(`Pre-SDK readiness health: ${outcome.readinessHealth}`);
// eslint-disable-next-line no-console
console.log(`Launch candidate readiness health: ${outcome.launchCandidateHealth}`);

if (!outcome.ok) {
  process.exit(1);
}
