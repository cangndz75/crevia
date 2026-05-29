/**
 * Post-pilot light operation UX polish verify.
 * Çalıştır: npm run verify:post-pilot-ux
 */

import { verifyPostPilotUxScenario } from '../src/core/postPilot/verifyPostPilotUxScenario';
import { verifyFullUxFlowScenario } from '../src/core/ux/verifyFullUxFlowScenario';

const result = verifyPostPilotUxScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

const uxFlow = verifyFullUxFlowScenario();
const uxFlowOk = uxFlow.ok;
// eslint-disable-next-line no-console
console.log(
  uxFlowOk
    ? '✓ full UX flow verify bozulmaz'
    : `✗ full UX flow verify bozulmaz — ${uxFlow.checks.filter((c) => c.startsWith('✗')).join('; ')}`,
);

if (!result.ok || !uxFlowOk) {
  // eslint-disable-next-line no-console
  console.error('\nPost-pilot UX verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nPost-pilot UX verify passed.');
