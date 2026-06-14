/**
 * Gameplay loop QA analyzer.
 * Calistir: npm run analyze:gameplay-loop-qa
 */

import { analyzeGameplayLoopQaScenario } from '../src/core/quality/gameplayLoopQaScenario';

const result = analyzeGameplayLoopQaScenario();

for (const line of result.lines) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log(`\nSummary: ${result.failCount} FAIL, ${result.warnCount} WARN`);

if (!result.ok) {
  process.exit(1);
}
