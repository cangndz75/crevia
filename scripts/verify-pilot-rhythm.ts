/**
 * Pilot rhythm controller smoke doğrulaması.
 * Çalıştır: npm run verify:pilot-rhythm
 */

import { verifyPilotRhythmScenario } from '../src/core/events/verifyPilotRhythmScenario';

const result = verifyPilotRhythmScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nPilot rhythm verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nPilot rhythm verify passed.');
