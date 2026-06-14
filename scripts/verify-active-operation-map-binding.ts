import { verifyActiveOperationMapBindingScenario } from '@/core/activeOperationMapBinding/verifyActiveOperationMapBindingScenario';

const result = verifyActiveOperationMapBindingScenario();

for (const line of result.checks) {
  console.log(line);
}

if (!result.ok) {
  process.exitCode = 1;
} else if (result.warn) {
  process.exitCode = 2;
} else {
  console.log('PASS active operation map binding verification complete');
}
