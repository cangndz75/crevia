/**
 * Content Safety Pack Aşama 2 verify.
 * Çalıştır: npm run verify:content-safety-pack-stage-2
 */

import {
  buildCombinedPackSummary,
  buildContentSafetyPackStage2Summary,
  buildNextContentPackStep,
  buildOperationDiversityCoverageSummary,
  buildStage2ThemeFitSummary,
} from '../src/core/contentPacks/contentPackStage2Presentation';
import { countStage2EventsByDistrict } from '../src/core/contentPacks/contentPackStage2Validation';
import { OPERATION_DIVERSITY_CONTENT_PACK } from '../src/core/contentPacks/operationDiversityContentPack';
import { verifyContentSafetyPackStage2Scenario } from '../src/core/contentPacks/verifyContentSafetyPackStage2Scenario';

const outcome = verifyContentSafetyPackStage2Scenario();
const byDistrict = countStage2EventsByDistrict(OPERATION_DIVERSITY_CONTENT_PACK);

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log('--- Audit summary ---');
// eslint-disable-next-line no-console
console.log(`Stage 2 events: ${outcome.auditSummary.results.length}`);
// eslint-disable-next-line no-console
console.log(`average score: ${outcome.auditSummary.averageScore}`);
// eslint-disable-next-line no-console
console.log(
  `min score: ${outcome.auditSummary.minScore} (lowest: ${outcome.auditSummary.lowestEventId})`,
);
// eslint-disable-next-line no-console
console.log(`combined pack count: ${outcome.combinedCount}`);
// eslint-disable-next-line no-console
console.log(buildOperationDiversityCoverageSummary());
// eslint-disable-next-line no-console
console.log(
  Object.entries(byDistrict)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', '),
);
// eslint-disable-next-line no-console
console.log(buildStage2ThemeFitSummary());
// eslint-disable-next-line no-console
console.log(buildCombinedPackSummary());
// eslint-disable-next-line no-console
console.log('integration: mergePilotCatalogWithContentSafetyPacks → ensureDailyEventsForDay');
// eslint-disable-next-line no-console
console.log(buildNextContentPackStep());

const passCount = outcome.checks.filter((c) => c.startsWith('PASS')).length;
const warnCount = outcome.checks.filter((c) => c.startsWith('WARN')).length;
const failCount = outcome.checks.filter((c) => c.startsWith('FAIL')).length;

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(`Summary: ${passCount} PASS, ${warnCount} WARN, ${failCount} FAIL`);

if (!outcome.ok) {
  // eslint-disable-next-line no-console
  console.error('\nContent Safety Pack Stage 2 verify FAILED.');
  process.exit(1);
}

if (outcome.warn) {
  // eslint-disable-next-line no-console
  console.warn('\nContent Safety Pack Stage 2 verify passed with WARN.');
} else {
  // eslint-disable-next-line no-console
  console.log('\nContent Safety Pack Stage 2 verify PASS.');
}
