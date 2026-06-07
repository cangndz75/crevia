/**
 * Operational resource presence lite verify.
 * Çalıştır: npm run verify:operational-resource-presence
 */

import { buildOperationalResourcePresenceLiteModel } from '../src/core/operationalResourcePresence/operationalResourcePresenceModel';
import { verifyOperationalResourcePresenceScenario } from '../src/core/operationalResourcePresence/verifyOperationalResourcePresenceScenario';

const outcome = verifyOperationalResourcePresenceScenario();
const sample = buildOperationalResourcePresenceLiteModel({ day: 8, isPostPilot: true, focusDistrictId: 'sanayi' });

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(`Sample Day 8 hub: ${sample.hubLine ?? sample.primaryPressureLine}`);
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);

if (!outcome.ok) {
  process.exit(1);
}
