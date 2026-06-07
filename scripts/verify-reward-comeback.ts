import { verifyRewardComebackScenario } from '../src/core/rewardComeback/verifyRewardComebackScenario';

const result = verifyRewardComebackScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nReward comeback verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nReward comeback verify passed.');
