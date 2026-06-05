/**
 * Secret rotation closure verify.
 * Çalıştır: npm run verify:secret-rotation-closure
 */

import { buildSecretRotationClosureResult } from '../src/core/security/secretRotationClosureAudit';
import { buildSecretRotationClosureConsoleSummary } from '../src/core/security/secretRotationClosurePresentation';
import { verifySecretRotationClosureScenario } from '../src/core/security/verifySecretRotationClosureScenario';

const outcome = verifySecretRotationClosureScenario();
const result = buildSecretRotationClosureResult();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildSecretRotationClosureConsoleSummary(result));
// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);
// eslint-disable-next-line no-console
console.log(`Closure health: ${outcome.closureHealth}`);

if (!outcome.ok) {
  process.exit(1);
}
