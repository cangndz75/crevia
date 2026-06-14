/**
 * Event gameplay variety verify.
 * Çalıştır: npm run verify:event-gameplay-variety
 */

import { verifyEventGameplayVarietyScenario } from '../src/features/events/verifyEventGameplayVarietyScenario';

const outcome = verifyEventGameplayVarietyScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (outcome.day8PlusSamples.length > 0) {
  // eslint-disable-next-line no-console
  console.log('\nDay 8+ gameplay variety samples:');
  for (const sample of outcome.day8PlusSamples) {
    // eslint-disable-next-line no-console
    console.log(
      `  ${sample.scenario} | ${sample.event1Pressure} | ${sample.event2Pressure} | risk=${sample.sameShapeRisk} | ${sample.note}`,
    );
  }
}

if (!outcome.ok) {
  // eslint-disable-next-line no-console
  console.error(`\n${outcome.failCount} check(s) failed.`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nAll event gameplay variety checks passed.');
