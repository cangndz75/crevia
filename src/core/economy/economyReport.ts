import type {
  DailyEconomyReport,
  EconomyState,
  EconomyTransaction,
} from './types';

export function getEconomyTransactionsForDay(
  transactions: EconomyTransaction[],
  day: number,
): EconomyTransaction[] {
  return transactions.filter((tx) => tx.day === day);
}

export function getDailySourceSpent(
  transactions: EconomyTransaction[],
  day: number,
): number {
  return getEconomyTransactionsForDay(transactions, day)
    .filter((tx) => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
}

export function getDailySourceEarned(
  transactions: EconomyTransaction[],
  day: number,
): number {
  return getEconomyTransactionsForDay(transactions, day)
    .filter((tx) => tx.amount > 0 && tx.type !== 'initial_allocation')
    .reduce((sum, tx) => sum + tx.amount, 0);
}

export function buildDailyEconomyReport(
  economyState: EconomyState,
  day: number,
): DailyEconomyReport {
  const dayTransactions = getEconomyTransactionsForDay(
    economyState.transactions,
    day,
  );
  const spent = getDailySourceSpent(economyState.transactions, day);
  const earned = getDailySourceEarned(economyState.transactions, day);

  return {
    day,
    spent,
    earned,
    net: earned - spent,
    transactions: dayTransactions,
  };
}
