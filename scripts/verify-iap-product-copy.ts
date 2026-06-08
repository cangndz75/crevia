/**
 * IAP Product Copy + Offer Screen Trust verify.
 * Çalıştır: npm run verify:iap-product-copy
 */

import { runIapProductCopyAudit } from '../src/core/iapProductCopy/iapProductCopyAudit';
import { buildIapProductCopyConsoleSummary } from '../src/core/iapProductCopy/iapProductCopyPresentation';
import { verifyIapProductCopyScenario } from '../src/core/iapProductCopy/verifyIapProductCopyScenario';

const outcome = verifyIapProductCopyScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);

if (!outcome.ok) {
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildIapProductCopyConsoleSummary(runIapProductCopyAudit()));
