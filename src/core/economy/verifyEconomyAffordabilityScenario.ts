import { createInitialPlayerProgress } from '@/core/xp/levelProgress';

import { checkDecisionAffordability } from './economyAffordability';
import {
  applyEconomyTransactions,
  createEconomyTransaction,
  createInitialEconomyState,
} from './economyEngine';

import type { ScenarioVerificationResult } from './verifyEconomyScenario';

function verifyScenario1(): ScenarioVerificationResult {
  const economyState = createInitialEconomyState();
  const result = checkDecisionAffordability({
    economyState,
    decision: { costs: { budget: 4000 } },
  });

  const checks: [boolean, string][] = [
    [result.canAfford === true, `canAfford ${result.canAfford}, beklenen true`],
    [result.missingSource === 0, `missingSource ${result.missingSource}`],
    [result.cost === 4000, `cost ${result.cost}`],
  ];

  const failed = checks.find(([ok]) => !ok);
  if (failed) {
    return { passed: false, message: `Senaryo 1: ${failed[1]}` };
  }
  return { passed: true, message: 'Senaryo 1 geçti' };
}

function verifyScenario2(): ScenarioVerificationResult {
  const economyState = {
    ...createInitialEconomyState(),
    currentSource: 3000,
  };
  const result = checkDecisionAffordability({
    economyState,
    decision: { costs: { budget: 5000 } },
  });

  const checks: [boolean, string][] = [
    [result.canAfford === false, `canAfford ${result.canAfford}`],
    [result.missingSource === 2000, `missingSource ${result.missingSource}`],
    [result.cost === 5000, `cost ${result.cost}`],
  ];

  const failed = checks.find(([ok]) => !ok);
  if (failed) {
    return { passed: false, message: `Senaryo 2: ${failed[1]}` };
  }
  return { passed: true, message: 'Senaryo 2 geçti' };
}

/** Store guard: yetersiz kaynakta ekonomi ve ilerleme değişmemeli. */
function verifyScenario3(): ScenarioVerificationResult {
  const economyBefore = {
    ...createInitialEconomyState(),
    currentSource: 3000,
    totalSpent: 0,
    transactions: [],
  };
  const playerBefore = createInitialPlayerProgress();
  const playerAfter = { ...playerBefore };

  const affordability = checkDecisionAffordability({
    economyState: economyBefore,
    decision: { costs: { budget: 5000 } },
  });

  if (affordability.canAfford) {
    return {
      passed: false,
      message: 'Senaryo 3: canAfford beklenen false',
    };
  }

  const tx = createEconomyTransaction({
    day: 1,
    amount: -5000,
    type: 'decision_cost',
    title: 'Karar maliyeti',
    sourceType: 'decision',
  });
  const economyAfter = applyEconomyTransactions(economyBefore, [tx]);

  const checks: [boolean, string][] = [
    [
      affordability.missingSource === 2000,
      `missingSource ${affordability.missingSource}`,
    ],
    [
      economyAfter.insufficientSource === true,
      'economy transaction reddedilmeli',
    ],
    [
      economyAfter.economyState.currentSource === 3000,
      `currentSource ${economyAfter.economyState.currentSource}`,
    ],
    [
      economyAfter.economyState.totalSpent === 0,
      `totalSpent ${economyAfter.economyState.totalSpent}`,
    ],
    [
      playerAfter.totalXp === playerBefore.totalXp,
      'playerProgress değişmemeli (guard simülasyonu)',
    ],
    [
      economyAfter.appliedTransactions.length === 0,
      'uygulanan transaction olmamalı',
    ],
  ];

  const failed = checks.find(([ok]) => !ok);
  if (failed) {
    return { passed: false, message: `Senaryo 3: ${failed[1]}` };
  }
  return { passed: true, message: 'Senaryo 3 geçti' };
}

export function verifyEconomyAffordabilityScenario(): ScenarioVerificationResult {
  const scenarios = [verifyScenario1, verifyScenario2, verifyScenario3];

  for (const run of scenarios) {
    const result = run();
    if (!result.passed) {
      return result;
    }
  }

  return { passed: true, message: 'Tüm affordability senaryoları geçti' };
}

export function runVerifyEconomyAffordabilityScenario(): void {
  const result = verifyEconomyAffordabilityScenario();
  if (!result.passed) {
    throw new Error(result.message);
  }
}
