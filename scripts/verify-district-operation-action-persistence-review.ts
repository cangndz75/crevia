/**
 * District operation action persistence review verify.
 * Çalıştır: npm run verify:district-operation-action-persistence-review
 */

import { runDistrictOperationActionPersistenceReviewAudit } from '../src/core/districtOperationActions/districtOperationActionPersistenceReviewAudit';
import { buildDistrictOperationActionPersistenceConsoleSummary } from '../src/core/districtOperationActions/districtOperationActionPersistenceReviewPresentation';
import { verifyDistrictOperationActionPersistenceReviewScenario } from '../src/core/districtOperationActions/verifyDistrictOperationActionPersistenceReviewScenario';

const outcome = verifyDistrictOperationActionPersistenceReviewScenario();
const result = runDistrictOperationActionPersistenceReviewAudit({ mode: 'review_only' });

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildDistrictOperationActionPersistenceConsoleSummary(result));
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
