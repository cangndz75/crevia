/**
 * Secret hygiene scan verify.
 * Çalıştır: npm run verify:secret-hygiene
 */

import { runSecretHygieneScan } from '../src/core/security/secretHygieneAudit';
import { buildSecretHygieneConsoleSummary } from '../src/core/security/secretHygienePresentation';
import { verifySecretHygieneScenario } from '../src/core/security/verifySecretHygieneScenario';

const outcome = verifySecretHygieneScenario();
const result = runSecretHygieneScan();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildSecretHygieneConsoleSummary(result));
// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);
// eslint-disable-next-line no-console
console.log(`Hygiene health: ${outcome.hygieneHealth}`);

if (!outcome.ok) {
  process.exit(1);
}
