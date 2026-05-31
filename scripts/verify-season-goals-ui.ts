/**
 * Sezon hedefleri UI polish doğrulaması.
 * Çalıştır: npm run verify:season-goals-ui
 */

import { verifySeasonGoalsUiScenario } from '../src/core/mainOperation/verifySeasonGoalsUiScenario';

const result = verifySeasonGoalsUiScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nSeason goals UI verify FAILED.');
  process.exit(1);
}

if (result.warn) {
  // eslint-disable-next-line no-console
  console.warn('\nSeason goals UI verify passed with WARN.');
} else {
  // eslint-disable-next-line no-console
  console.log('\nSeason goals UI verify PASS.');
}
