/**
 * City Rhythm Director verify.
 * Calistir: npm run verify:city-rhythm-director
 */

import { verifyCityRhythmDirectorScenario } from '../src/core/cityRhythmDirector/verifyCityRhythmDirectorScenario';

const outcome = verifyCityRhythmDirectorScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((line) => line.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((line) => line.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((line) => line.startsWith('FAIL')).length} FAIL`,
);

if (!outcome.ok) {
  process.exit(1);
}
