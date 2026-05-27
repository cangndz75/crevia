/**
 * Leaderboard skor motoru smoke doğrulaması.
 * Çalıştır: npx tsx scripts/verify-leaderboard-scenario.ts
 */

import { verifyLeaderboardScenario } from '../src/core/leaderboard/verifyLeaderboardScenario';

const result = verifyLeaderboardScenario();

for (const check of result.checks) {
  const prefix = check.passed ? 'OK' : 'FAIL';
  console.log(`${prefix}  ${check.name} — ${check.detail}`);
}

if (!result.ok) {
  console.error('\nLeaderboard verify failed.');
  process.exit(1);
}

console.log('\nLeaderboard verify passed.');
