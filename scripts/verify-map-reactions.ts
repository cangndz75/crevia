/**
 * Dynamic map reaction lite verify.
 * Çalıştır: npm run verify:map-reactions
 */

import { buildMapReactionLiteModel } from '../src/core/mapReactions/mapReactionModel';
import { verifyMapReactionScenario } from '../src/core/mapReactions/verifyMapReactionScenario';

const outcome = verifyMapReactionScenario();
const sample = buildMapReactionLiteModel({ day: 8, isPostPilot: true, selectedDistrictId: 'sanayi' });

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(`Sample Day 8 reactions: ${sample.reactions.map((r) => r.shortLine).join(' | ')}`);
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);

if (!outcome.ok) {
  process.exit(1);
}
