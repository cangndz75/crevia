/**
 * City journal lite verify.
 * Çalıştır: npm run verify:city-journal
 */

import { buildCityJournalLiteModel } from '../src/core/cityJournal/cityJournalModel';
import { verifyCityJournalScenario } from '../src/core/cityJournal/verifyCityJournalScenario';

const outcome = verifyCityJournalScenario();
const sample = buildCityJournalLiteModel({ currentDay: 8, isPostPilot: true });

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(`Sample Day 8 entries: ${sample.entries.map((e) => e.line).join(' | ')}`);
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);

if (!outcome.ok) {
  process.exit(1);
}
