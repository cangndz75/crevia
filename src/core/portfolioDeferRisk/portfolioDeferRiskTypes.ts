import type { DailyCapacityPortfolioResult } from '@/core/dailyCapacityPortfolio';

export type PortfolioDeferBindingKind =
  | 'deferred_risk'
  | 'watch_signal'
  | 'follow_up'
  | 'recovery_window'
  | 'opportunity_window'
  | 'memory_trace'
  | 'safe_watch'
  | 'none';

export type PortfolioDeferBindingTimeScope = 'same_day_report' | 'next_day' | 'multi_day';

export type PortfolioDeferBindingTone = 'neutral' | 'positive' | 'warning';

export type PortfolioDeferBindingConfidence = 'low' | 'medium' | 'high';

export type PortfolioDeferBinding = {
  id: string;
  portfolioItemId?: string;
  kind: PortfolioDeferBindingKind;
  title: string;
  line: string;
  nextActionLine?: string;
  reportLine?: string;
  tomorrowLine?: string;
  districtId?: string;
  districtName?: string;
  deferRisk: string;
  timeScope: PortfolioDeferBindingTimeScope;
  priority: number;
  tone: PortfolioDeferBindingTone;
  confidence: PortfolioDeferBindingConfidence;
  sourceIds: string[];
  sourceKinds: string[];
  isActionable: boolean;
  isFallback: boolean;
};

export type PortfolioDeferRiskInput = {
  day: number;
  portfolioResult?: DailyCapacityPortfolioResult;
  decisionConsequenceThreads?: unknown[];
  tomorrowRiskSignals?: unknown;
  carryOverSignals?: unknown;
  cityArchiveSignals?: unknown;
  storyChainSignals?: unknown;
  districtPersonalityProfiles?: unknown[];
  authorityPermissionIds?: string[];
};

export type PortfolioDeferRiskResult = {
  bindings: PortfolioDeferBinding[];
  primaryBinding?: PortfolioDeferBinding;
  reportSummaryLine?: string;
  tomorrowActionLine?: string;
  hasActionableDeferredRisk: boolean;
  sourceIds: string[];
};
