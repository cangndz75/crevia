/**
 * Liderlik UI smoke doğrulaması.
 * Çalıştır: npm run verify:leaderboard-ui
 */

import { verifyLeaderboardUiScenario } from '../src/features/leaderboard/verifyLeaderboardUiScenario';

const result = verifyLeaderboardUiScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error(`\nLeaderboard UI verify failed (${result.failCount} check(s)).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nLeaderboard UI verify passed.');
