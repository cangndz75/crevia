/**
 * Content Safety Pack Aşama 1 verify.
 * Çalıştır: npm run verify:content-safety-pack-stage-1
 */

import {
  buildContainerContentCoverageSummary,
  buildContentSafetyPackStage1Summary,
  buildDistrictContentCoverageSummary,
  buildNextContentPackStep,
} from '../src/core/contentPacks/contentPackPresentation';
import { verifyContentSafetyPackStage1Scenario } from '../src/core/contentPacks/verifyContentSafetyPackStage1Scenario';

const outcome = verifyContentSafetyPackStage1Scenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log('--- Audit summary ---');
// eslint-disable-next-line no-console
console.log(`total events: ${outcome.auditSummary.results.length}`);
// eslint-disable-next-line no-console
console.log(`average score: ${outcome.auditSummary.averageScore}`);
// eslint-disable-next-line no-console
console.log(`min score: ${outcome.auditSummary.minScore} (lowest: ${outcome.auditSummary.lowestEventId})`);
// eslint-disable-next-line no-console
console.log(buildDistrictContentCoverageSummary());
// eslint-disable-next-line no-console
console.log(buildContainerContentCoverageSummary());
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
  console.error('\nContent Safety Pack Stage 1 verify FAILED.');
  process.exit(1);
}

if (outcome.warn) {
  // eslint-disable-next-line no-console
  console.warn('\nContent Safety Pack Stage 1 verify passed with WARN.');
} else {
  // eslint-disable-next-line no-console
  console.log('\nContent Safety Pack Stage 1 verify PASS.');
}
