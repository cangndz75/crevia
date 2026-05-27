import { createId } from '@/core/game/createId';

import {
  ALLOW_NEGATIVE_SOURCE,
  INITIAL_SOURCE_AMOUNT,
  MIN_SOURCE_AMOUNT,
} from './constants';
import type {
  ApplyEconomyTransactionsResult,
  CreateEconomyTransactionInput,
  EconomyState,
  EconomyTransaction,
} from './types';

export type ExtractDecisionCostInput = {
  decisionResult?: {
    budgetSpent?: number;
    cost?: number;
    effects?: {
      budgetCost?: number;
      budget?: number;
    };
  };
  decision?: {
    budgetSpent?: number;
    cost?: number;
    resourceCost?: number;
    effects?: {
      budgetCost?: number;
      budget?: number;
    };
    costs?: {
      budget?: number;
    };
  };
  appliedCosts?: {
    budget?: number;
  };
  appliedEffects?: {
    budget?: number;
  };
};

function readPositiveCost(value: number | undefined): number | undefined {
  if (value == null || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return value;
}

function readBudgetEffectAsCost(value: number | undefined): number | undefined {
  if (value == null || !Number.isFinite(value) || value >= 0) {
    return undefined;
  }
  return Math.abs(value);
}

/** Karar maliyetini pozitif cost number olarak döndürür. */
export function extractDecisionCost(input: ExtractDecisionCostInput): number {
  const candidates: (number | undefined)[] = [
    readPositiveCost(input.decisionResult?.budgetSpent),
    readPositiveCost(input.decisionResult?.cost),
    readPositiveCost(input.appliedCosts?.budget),
    readPositiveCost(input.decision?.budgetSpent),
    readPositiveCost(input.decision?.cost),
    readPositiveCost(input.decisionResult?.effects?.budgetCost),
    readBudgetEffectAsCost(input.decisionResult?.effects?.budget),
    readPositiveCost(input.decision?.effects?.budgetCost),
    readBudgetEffectAsCost(input.decision?.effects?.budget),
    readPositiveCost(input.decision?.costs?.budget),
    readPositiveCost(input.decision?.resourceCost),
    readBudgetEffectAsCost(input.appliedEffects?.budget),
  ];

  for (const candidate of candidates) {
    if (candidate != null && candidate > 0) {
      return candidate;
    }
  }

  return 0;
}

/** applyDecision kaydından toplam Kaynak harcaması — çift düşümü önlemek için. */
export function extractDecisionCostFromApplied(
  appliedCosts?: { budget?: number },
  appliedEffects?: { budget?: number },
  fallbackInput?: ExtractDecisionCostInput,
): number {
  const fromCosts = appliedCosts?.budget ?? 0;
  const fromEffects =
    appliedEffects?.budget != null && appliedEffects.budget < 0
      ? Math.abs(appliedEffects.budget)
      : 0;
  const total = fromCosts + fromEffects;
  if (total > 0) {
    return total;
  }
  if (fallbackInput) {
    return extractDecisionCost(fallbackInput);
  }
  return 0;
}

export function createEconomyTransaction(
  input: CreateEconomyTransactionInput,
): EconomyTransaction {
  return {
    ...input,
    id: createId('econ'),
    createdAt: new Date().toISOString(),
  };
}

export function createInitialEconomyState(): EconomyState {
  const initialTx = createEconomyTransaction({
    day: 1,
    amount: INITIAL_SOURCE_AMOUNT,
    type: 'initial_allocation',
    title: 'Başlangıç Kaynağı',
    description: 'Pilot operasyon için ayrılan başlangıç kaynağı',
    sourceType: 'system',
  });

  return {
    currentSource: INITIAL_SOURCE_AMOUNT,
    startingSource: INITIAL_SOURCE_AMOUNT,
    totalEarned: 0,
    totalSpent: 0,
    transactions: [initialTx],
  };
}

/** Eski kayıtlar — city.budget değerinden ekonomi durumu türetir. */
export function createEconomyStateFromLegacyBudget(budget: number): EconomyState {
  const safeBudget = Math.max(MIN_SOURCE_AMOUNT, Math.round(budget));
  return {
    currentSource: safeBudget,
    startingSource: safeBudget,
    totalEarned: 0,
    totalSpent: 0,
    transactions: [],
  };
}

function clampSource(amount: number): number {
  if (ALLOW_NEGATIVE_SOURCE) {
    return amount;
  }
  return Math.max(MIN_SOURCE_AMOUNT, amount);
}

function countsAsEarned(type: EconomyTransaction['type']): boolean {
  return type !== 'initial_allocation';
}

export function canAfford(economyState: EconomyState, amount: number): boolean {
  const cost = Math.abs(amount);
  if (cost <= 0) {
    return true;
  }
  return economyState.currentSource >= cost;
}

export function applyEconomyTransactions(
  economyState: EconomyState,
  transactions: EconomyTransaction[],
): ApplyEconomyTransactionsResult {
  let nextState: EconomyState = {
    ...economyState,
    transactions: [...economyState.transactions],
  };
  const appliedTransactions: EconomyTransaction[] = [];
  const rejectedTransactions: EconomyTransaction[] = [];
  let insufficientSource = false;

  for (const tx of transactions) {
    const spend = tx.amount < 0 ? Math.abs(tx.amount) : 0;
    const earn = tx.amount > 0 ? tx.amount : 0;

    if (spend > 0 && !canAfford(nextState, spend)) {
      rejectedTransactions.push(tx);
      insufficientSource = true;
      continue;
    }

    const nextSource = clampSource(nextState.currentSource + tx.amount);
    nextState = {
      ...nextState,
      currentSource: nextSource,
      totalEarned:
        earn > 0 && countsAsEarned(tx.type)
          ? nextState.totalEarned + earn
          : nextState.totalEarned,
      totalSpent: spend > 0 ? nextState.totalSpent + spend : nextState.totalSpent,
      transactions: [...nextState.transactions, tx],
    };
    appliedTransactions.push(tx);
  }

  return {
    economyState: nextState,
    appliedTransactions,
    rejectedTransactions,
    insufficientSource,
  };
}
