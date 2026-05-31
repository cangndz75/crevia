/**
 * IAP ürün tasarımı verify.
 * Çalıştır: npm run verify:iap-product-design
 */

import { verifyIapProductDesignScenario } from '../src/core/iap/verifyIapProductDesignScenario';

const outcome = verifyIapProductDesignScenario();

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
