import type { DailyCapacityPortfolioResult } from './dailyCapacityPortfolioTypes';
import type { PortfolioDeferRiskResult } from '@/core/portfolioDeferRisk/portfolioDeferRiskTypes';

export type DailyCapacityRuntimeBindingMode = 'legacy' | 'portfolio_runtime';

export type DailyOperationsPlanPortfolioView = {
  day: number;
  todayFocusEventIds: string[];
  recommendedEventIds: string[];
  deferredEventIds: string[];
  primaryDeferRiskLine?: string;
  capacityLabel: string;
  primaryTradeoffLine?: string;
  authorityLine?: string;
};

export type DailyCapacityRuntimeSnapshot = {
  day: number;
  mode: DailyCapacityRuntimeBindingMode;
  portfolio: DailyCapacityPortfolioResult;
  portfolioDeferRisk: PortfolioDeferRiskResult;
  deferredOperationEventIds: string[];
  activeOperationEventIds: string[];
  planPortfolioView: DailyOperationsPlanPortfolioView;
  authorityEffectSnapshot?: import('@/core/authorityGameplayExpansion/authorityGameplayEffectTypes').AuthorityGameplayEffectSnapshot;
  sourceIds: string[];
};
