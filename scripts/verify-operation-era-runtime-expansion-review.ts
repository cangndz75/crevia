/**
 * Operation era runtime expansion review verify.
 * Çalıştır: npm run verify:operation-era-runtime-expansion-review
 */

import { runOperationEraRuntimeExpansionReviewAudit } from '../src/core/operationEra/operationEraRuntimeExpansionReviewAudit';
import { buildOperationEraRuntimeExpansionConsoleSummary } from '../src/core/operationEra/operationEraRuntimeExpansionReviewPresentation';
import { verifyOperationEraRuntimeExpansionReviewScenario } from '../src/core/operationEra/verifyOperationEraRuntimeExpansionReviewScenario';

const outcome = verifyOperationEraRuntimeExpansionReviewScenario();
const result = runOperationEraRuntimeExpansionReviewAudit({ mode: 'review_only' });

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildOperationEraRuntimeExpansionConsoleSummary(result));
// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);
// eslint-disable-next-line no-console
console.log(`Review health: ${outcome.reviewHealth}`);

if (!outcome.ok) {
  process.exit(1);
}
