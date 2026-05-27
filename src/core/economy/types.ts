export type EconomyTransactionType =
  | 'initial_allocation'
  | 'decision_cost'
  | 'maintenance_cost'
  | 'daily_adjustment'
  | 'reward'
  | 'refund'
  | 'system';

export type EconomyTransactionSourceType =
  | 'decision'
  | 'event'
  | 'daily_report'
  | 'system'
  | 'maintenance';

export type EconomyTransaction = {
  id: string;
  day: number;
  amount: number;
  type: EconomyTransactionType;
  title: string;
  description?: string;
  sourceId?: string;
  sourceType?: EconomyTransactionSourceType;
  createdAt: string;
};

export type CreateEconomyTransactionInput = Omit<
  EconomyTransaction,
  'id' | 'createdAt'
>;

export type EconomyState = {
  currentSource: number;
  startingSource: number;
  totalEarned: number;
  totalSpent: number;
  transactions: EconomyTransaction[];
};

export type ApplyEconomyTransactionsResult = {
  economyState: EconomyState;
  appliedTransactions: EconomyTransaction[];
  rejectedTransactions: EconomyTransaction[];
  insufficientSource: boolean;
};

export type ApplyDecisionEconomyResult = {
  cost: number;
  transaction?: EconomyTransaction;
  currentSource: number;
  insufficientSource: boolean;
  missingSource?: number;
};

export type DailyEconomyReport = {
  day: number;
  spent: number;
  earned: number;
  net: number;
  transactions: EconomyTransaction[];
};
