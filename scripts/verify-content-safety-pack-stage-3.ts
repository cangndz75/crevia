/**
 * Content Safety Pack Aşama 3 verify.
 */

import { buildEventEchoSummaryForDocs, buildNextContentPackStage3Step } from '../src/core/contentPacks/eventEchoPresentation';
import {
  countEchoTemplatesByDomain,
  countEchoTemplatesBySurface,
} from '../src/core/contentPacks/eventEchoValidation';
import { ALL_EVENT_ECHO_TEMPLATES } from '../src/core/contentPacks/eventEchoCopy';
import { verifyContentSafetyPackStage3Scenario } from '../src/core/contentPacks/verifyContentSafetyPackStage3Scenario';

const outcome = verifyContentSafetyPackStage3Scenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log('--- Echo summary ---');
// eslint-disable-next-line no-console
console.log(`total templates: ${ALL_EVENT_ECHO_TEMPLATES.length}`);
// eslint-disable-next-line no-console
console.log(JSON.stringify(countEchoTemplatesBySurface()));
// eslint-disable-next-line no-console
console.log(JSON.stringify(countEchoTemplatesByDomain()));
// eslint-disable-next-line no-console
console.log(buildEventEchoSummaryForDocs().split('\n').slice(0, 8).join('\n'));
// eslint-disable-next-line no-console
console.log(buildNextContentPackStage3Step());

const passCount = outcome.checks.filter((c) => c.startsWith('PASS')).length;
const warnCount = outcome.checks.filter((c) => c.startsWith('WARN')).length;
const failCount = outcome.checks.filter((c) => c.startsWith('FAIL')).length;

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(`Summary: ${passCount} PASS, ${warnCount} WARN, ${failCount} FAIL`);

if (!outcome.ok) {
  // eslint-disable-next-line no-console
  console.error('\nContent Safety Pack Stage 3 verify FAILED.');
  process.exit(1);
}

if (outcome.warn) {
  // eslint-disable-next-line no-console
  console.warn('\nContent Safety Pack Stage 3 verify passed with WARN.');
} else {
  // eslint-disable-next-line no-console
  console.log('\nContent Safety Pack Stage 3 verify PASS.');
}
