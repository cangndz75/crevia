import { verifyDailyCapacityRuntimeBindingScenario } from '../src/core/dailyCapacityPortfolio/verifyDailyCapacityRuntimeBindingScenario';

const outcome = verifyDailyCapacityRuntimeBindingScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!outcome.ok) {
  process.exit(1);
}
