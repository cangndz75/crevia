/**
 * Event writing standard + content schema audit verify.
 * Çalıştır: npm run verify:event-writing-standard
 */

import { collectKnownEventWritingAuditInputs } from '../src/core/contentQuality/collectEventWritingAuditInputs';
import { formatEventWritingSummary } from '../src/core/contentQuality/eventContentPresentation';
import { verifyEventWritingStandardScenario } from '../src/core/contentQuality/verifyEventWritingStandardScenario';

const batchInputs = collectKnownEventWritingAuditInputs();
const outcome = verifyEventWritingStandardScenario({ batchInputs });

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (outcome.batchSummary) {
  // eslint-disable-next-line no-console
  console.log('');
  // eslint-disable-next-line no-console
  console.log(formatEventWritingSummary(outcome.batchSummary));
  // eslint-disable-next-line no-console
  console.log(
    'Not: Mevcut pilot katalog içeriği content pack öncesi olabilir; düşük skorlar beklenen WARN’dır, standard testleri FAIL olmamalı.',
  );
}

const passCount = outcome.checks.filter((c) => c.startsWith('PASS')).length;
const warnCount = outcome.checks.filter((c) => c.startsWith('WARN')).length;
const failCount = outcome.checks.filter((c) => c.startsWith('FAIL')).length;

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(`Summary: ${passCount} PASS, ${warnCount} WARN, ${failCount} FAIL`);

if (!outcome.ok) {
  // eslint-disable-next-line no-console
  console.error('\nEvent writing standard verify FAILED.');
  process.exit(1);
}

if (outcome.warn) {
  // eslint-disable-next-line no-console
  console.warn('\nEvent writing standard verify passed with WARN.');
} else {
  // eslint-disable-next-line no-console
  console.log('\nEvent writing standard verify PASS.');
}
