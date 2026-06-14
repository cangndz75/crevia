import type { DailyCapacityPortfolioResult } from '@/core/dailyCapacityPortfolio';
import type { PortfolioDeferRiskResult } from '@/core/portfolioDeferRisk';

export type OneMoreDayRetentionSourceKind =
  | 'portfolio_defer_risk'
  | 'daily_capacity_portfolio'
  | 'decision_consequence'
  | 'tomorrow_risk'
  | 'carry_over'
  | 'butterfly_effect'
  | 'district_personality'
  | 'district_memory'
  | 'city_archive'
  | 'story_chain'
  | 'map_gameplay_binding'
  | 'report_summary'
  | 'fallback';

export type OneMoreDayRetentionHookKind =
  | 'deferred_signal'
  | 'tomorrow_priority'
  | 'recovery_opportunity'
  | 'memory_trace'
  | 'district_follow_up'
  | 'resource_pressure'
  | 'route_pressure'
  | 'social_watch'
  | 'safe_continue'
  | 'achievement_momentum'
  | 'fallback';

export type OneMoreDayRetentionTone =
  | 'calm'
  | 'strategic'
  | 'warning'
  | 'positive'
  | 'locked';

export type OneMoreDayRetentionHook = {
  id: string;
  kind: OneMoreDayRetentionHookKind;
  title: string;
  line: string;
  tomorrowLine?: string;
  ctaLabel: string;
  ctaRoute?: string;
  districtId?: string;
  districtName?: string;
  tone: OneMoreDayRetentionTone;
  priority: number;
  confidence: 'low' | 'medium' | 'high';
  sourceIds: string[];
  sourceKinds: OneMoreDayRetentionSourceKind[];
  isActionable: boolean;
  isFallback: boolean;
};

export type OneMoreDayRetentionResult = {
  day: number;
  isVisible: boolean;
  title: string;
  summaryLine: string;
  primaryHook?: OneMoreDayRetentionHook;
  secondaryHook?: OneMoreDayRetentionHook;
  ctaLabel: string;
  ctaRoute?: string;
  footerLine?: string;
  sourceIds: string[];
  sourceKinds: OneMoreDayRetentionSourceKind[];
};

export type OneMoreDayRetentionInput = {
  day: number;
  portfolioDeferRiskResult?: PortfolioDeferRiskResult | null;
  dailyCapacityPortfolioResult?: DailyCapacityPortfolioResult | null;
  decisionConsequenceThreads?: unknown[];
  tomorrowRiskSignals?: unknown;
  carryOverSignals?: unknown;
  butterflySignals?: unknown;
  districtPersonalityProfiles?: unknown[];
  districtMemorySignals?: unknown;
  cityArchiveSignals?: unknown;
  storyChainSignals?: unknown;
  mapGameplayBindings?: unknown[];
  reportSummary?: unknown;
  currentRouteHints?: {
    reportRoute?: string;
    hubRoute?: string;
    mapRoute?: string;
    eventsRoute?: string;
  };
};

export type ReportOneMoreDayCardModel = {
  id: string;
  title: string;
  line: string;
  tomorrowLine?: string;
  ctaLabel: string;
  ctaRoute?: string;
  tone: OneMoreDayRetentionTone;
  accessibilityLabel: string;
};
