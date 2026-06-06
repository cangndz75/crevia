/**
 * IAP Conversion Readiness verify.
 * Çalıştır: npm run verify:iap-conversion-readiness
 */

import { runIapConversionReadinessAudit } from '../src/core/monetization/iapConversionReadinessAudit';
import { buildIapConversionReadinessConsoleSummary } from '../src/core/monetization/iapConversionReadinessPresentation';
import { verifyIapConversionReadinessScenario } from '../src/core/monetization/verifyIapConversionReadinessScenario';

const outcome = verifyIapConversionReadinessScenario();
const result = runIapConversionReadinessAudit();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildIapConversionReadinessConsoleSummary(result));
// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);
// eslint-disable-next-line no-console
console.log(`Readiness health: ${outcome.readinessHealth}`);

if (!outcome.ok) {
  process.exit(1);
}
