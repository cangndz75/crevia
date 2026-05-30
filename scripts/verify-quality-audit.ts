/**
 * Performans + mimari kalite denetimi.
 * Çalıştır: npm run verify:quality-audit
 */

import { verifyQualityAuditScenario } from '../src/core/quality/verifyQualityAuditScenario';
import { runQualityAudit } from '../src/core/quality/qualityAuditPresentation';

const result = verifyQualityAuditScenario();
const audit = runQualityAudit();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log(`\n--- Quality audit health: ${audit.health} ---`);
// eslint-disable-next-line no-console
console.log(
  `high=${audit.summary.highRiskCount} medium=${audit.summary.mediumRiskCount} low=${audit.summary.lowRiskCount}`,
);

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error(`\nQuality audit verify failed (${result.failCount} FAIL).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nQuality audit verify passed.');
