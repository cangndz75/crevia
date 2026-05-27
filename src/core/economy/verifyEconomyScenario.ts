import {
  applyEconomyTransactions,
  createEconomyTransaction,
  createInitialEconomyState,
  extractDecisionCost,
} from './economyEngine';
import {
  formatSourceAmount,
  formatSourceDelta,
} from './economyFormatter';
import { INITIAL_SOURCE_AMOUNT } from './constants';

export type ScenarioVerificationResult = {
  passed: boolean;
  message: string;
};

function verifyScenario1(): ScenarioVerificationResult {
  const initial = createInitialEconomyState();
  if (initial.currentSource !== INITIAL_SOURCE_AMOUNT) {
    return {
      passed: false,
      message: `Senaryo 1: başlangıç ${initial.currentSource} !== ${INITIAL_SOURCE_AMOUNT}`,
    };
  }

  const cost = extractDecisionCost({
    decisionResult: { budgetSpent: 4000 },
  });
  const tx = createEconomyTransaction({
    day: 1,
    amount: -cost,
    type: 'decision_cost',
    title: 'Karar maliyeti',
    sourceType: 'decision',
  });
  const result = applyEconomyTransactions(initial, [tx]);

  const checks: [boolean, string][] = [
    [
      result.economyState.currentSource === 61_000,
      `currentSource ${result.economyState.currentSource} !== 61000`,
    ],
    [
      result.economyState.totalSpent === 4000,
      `totalSpent ${result.economyState.totalSpent} !== 4000`,
    ],
    [
      result.appliedTransactions[0]?.type === 'decision_cost' &&
        result.appliedTransactions[0]?.amount === -4000,
      'decision_cost transaction uyuşmuyor',
    ],
    [result.insufficientSource === false, 'insufficientSource beklenen false'],
  ];

  const failed = checks.find(([ok]) => !ok);
  if (failed) {
    return { passed: false, message: `Senaryo 1: ${failed[1]}` };
  }
  return { passed: true, message: 'Senaryo 1 geçti' };
}

function verifyScenario2(): ScenarioVerificationResult {
  const base = createInitialEconomyState();
  const lowSource = {
    ...base,
    currentSource: 3000,
    startingSource: 3000,
    totalSpent: 0,
  };

  const tx = createEconomyTransaction({
    day: 1,
    amount: -5000,
    type: 'decision_cost',
    title: 'Karar maliyeti',
    sourceType: 'decision',
  });
  const result = applyEconomyTransactions(lowSource, [tx]);

  const checks: [boolean, string][] = [
    [result.insufficientSource === true, 'insufficientSource beklenen true'],
    [
      result.economyState.currentSource === 3000,
      `currentSource korunmadı: ${result.economyState.currentSource}`,
    ],
    [
      result.rejectedTransactions.length === 1,
      `rejected count ${result.rejectedTransactions.length}`,
    ],
    [
      result.economyState.totalSpent === 0,
      `totalSpent değişti: ${result.economyState.totalSpent}`,
    ],
  ];

  const failed = checks.find(([ok]) => !ok);
  if (failed) {
    return { passed: false, message: `Senaryo 2: ${failed[1]}` };
  }
  return { passed: true, message: 'Senaryo 2 geçti' };
}

function verifyScenario3(): ScenarioVerificationResult {
  const cases: [number, string][] = [
    [0, '0'],
    [500, '500'],
    [1000, '1K'],
    [4500, '4.5K'],
    [63000, '63K'],
  ];

  for (const [amount, expected] of cases) {
    const actual = formatSourceAmount(amount);
    if (actual !== expected) {
      return {
        passed: false,
        message: `Senaryo 3: formatSourceAmount(${amount}) = "${actual}", beklenen "${expected}"`,
      };
    }
  }
  return { passed: true, message: 'Senaryo 3 geçti' };
}

function verifyScenario4(): ScenarioVerificationResult {
  const actual = formatSourceDelta(-4000);
  if (actual !== '-4K Kaynak') {
    return {
      passed: false,
      message: `Senaryo 4: formatSourceDelta(-4000) = "${actual}", beklenen "-4K Kaynak"`,
    };
  }
  return { passed: true, message: 'Senaryo 4 geçti' };
}

export function verifyEconomyScenario(): ScenarioVerificationResult {
  const scenarios = [
    verifyScenario1,
    verifyScenario2,
    verifyScenario3,
    verifyScenario4,
  ];

  for (const run of scenarios) {
    const result = run();
    if (!result.passed) {
      return result;
    }
  }

  return { passed: true, message: 'Tüm ekonomi senaryoları geçti' };
}

export function runVerifyEconomyScenario(): void {
  const result = verifyEconomyScenario();
  if (!result.passed) {
    throw new Error(result.message);
  }
}
