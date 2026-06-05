import { verifyStoryChainRuntimeHintScenario } from '../src/core/storyChains/verifyStoryChainRuntimeHintScenario';

const outcome = verifyStoryChainRuntimeHintScenario();
const failCount = outcome.checks.filter((line) => line.startsWith('FAIL')).length;
const passCount = outcome.checks.filter((line) => line.startsWith('PASS')).length;

for (const line of outcome.checks) {
  console.log(line);
}

console.log('');
console.log(
  `Story Chain Runtime Hint Verify: ${outcome.ok ? 'PASS' : 'FAIL'} (${passCount} pass, ${failCount} fail)`,
);

if (!outcome.ok) {
  process.exit(1);
}
