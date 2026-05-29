/**
 * Tam oyuncu UX akışı verify.
 * Çalıştır: npm run verify:full-ux-flow
 */

import { verifyFullUxFlowScenario } from '../src/core/ux/verifyFullUxFlowScenario';

const result = verifyFullUxFlowScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

const { audit } = result;
// eslint-disable-next-line no-console
console.log('\n--- UX flow audit ---');
// eslint-disable-next-line no-console
console.log(`checkedScreens: ${audit.checkedScreens.join(', ')}`);
// eslint-disable-next-line no-console
console.log(`warningCount: ${audit.warningCount}`);
// eslint-disable-next-line no-console
console.log(`day1CompactStatus: ${audit.day1CompactStatus}`);
// eslint-disable-next-line no-console
console.log(`day7FinalStatus: ${audit.day7FinalStatus}`);
// eslint-disable-next-line no-console
console.log(`forbiddenWordCount: ${audit.forbiddenWordCount}`);
// eslint-disable-next-line no-console
console.log(`flowHealth: ${audit.flowHealth}`);

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nFull UX flow verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nFull UX flow verify passed.');
