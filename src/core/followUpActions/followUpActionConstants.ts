import type {
  FollowUpActionCostBand,
  FollowUpActionImpactBand,
  FollowUpActionKind,
  FollowUpActionSourceKind,
} from './followUpActionTypes';

export const FOLLOW_UP_MAX_ACTIONS = 3;
export const FOLLOW_UP_LINE_MAX = 90;
export const FOLLOW_UP_BENEFIT_LINE_MAX = 100;
export const FOLLOW_UP_RISK_LINE_MAX = 90;
export const FOLLOW_UP_TITLE_MAX = 48;
export const FOLLOW_UP_ACCESSIBILITY_MAX = 160;

export const FOLLOW_UP_ALLOWED_SOURCE_KINDS: FollowUpActionSourceKind[] = [
  'portfolio_defer_risk',
  'one_more_day_retention',
  'daily_capacity_portfolio',
  'city_memory_visibility',
  'decision_consequence',
  'tomorrow_risk',
  'district_personality',
  'district_memory',
  'city_archive',
  'story_chain',
  'carry_over',
  'butterfly_effect',
  'reward_comeback',
  'ece_strategy_line',
  'authority_gameplay_expansion',
  'fallback',
];

export const FOLLOW_UP_KIND_PRIORITY_BASE: Record<FollowUpActionKind, number> = {
  review_route: 88,
  support_recovery: 86,
  recheck_district: 82,
  calm_social_pulse: 78,
  reinforce_trust: 76,
  rebalance_resource: 74,
  check_container_line: 72,
  capture_memory_trace: 68,
  prepare_tomorrow: 66,
  monitor_signal: 58,
  send_small_team: 56,
  safe_watch: 40,
};

export const FOLLOW_UP_COST_BANDS: Record<FollowUpActionKind, FollowUpActionCostBand> = {
  safe_watch: 'none',
  monitor_signal: 'low',
  capture_memory_trace: 'low',
  recheck_district: 'low',
  review_route: 'low',
  check_container_line: 'low',
  calm_social_pulse: 'low',
  reinforce_trust: 'low',
  support_recovery: 'low',
  prepare_tomorrow: 'low',
  rebalance_resource: 'medium',
  send_small_team: 'medium',
};

export const FOLLOW_UP_COST_LABELS: Record<FollowUpActionCostBand, string> = {
  none: 'Maliyet yok',
  low: 'Dusuk maliyet',
  medium: 'Orta maliyet',
};

export const FOLLOW_UP_IMPACT_LABELS: Record<FollowUpActionImpactBand, string> = {
  low: 'Dusuk etki',
  medium: 'Orta etki',
  high: 'Yuksek etki',
};

export const FOLLOW_UP_BADGE_LABELS: Record<FollowUpActionKind, string> = {
  recheck_district: 'Mahalle takibi',
  monitor_signal: 'Sinyal izleme',
  send_small_team: 'Kucuk ekip',
  rebalance_resource: 'Kaynak denge',
  review_route: 'Rota gozden gecirme',
  check_container_line: 'Konteyner hatti',
  calm_social_pulse: 'Sosyal nabiz',
  reinforce_trust: 'Guven pekistirme',
  capture_memory_trace: 'Hafiza izi',
  support_recovery: 'Toparlanma',
  prepare_tomorrow: 'Yarin hazirligi',
  safe_watch: 'Guvenli izleme',
};

export const DETAILED_FOLLOW_UP_PERMISSION_IDS = [
  'portfolio_defer_reason',
  'tomorrow_risk_preview',
  'district_memory_trace_preview',
  'district_trust_preview',
  'resource_pressure_summary',
] as const;

export function resolveFollowUpDayPolicy(day: number): 'day_1' | 'day_2_7' | 'day_8_plus' | 'day_10_plus' {
  if (day <= 1) return 'day_1';
  if (day <= 7) return 'day_2_7';
  if (day <= 9) return 'day_8_plus';
  return 'day_10_plus';
}

export function resolveFollowUpImpactBand(
  kind: FollowUpActionKind,
  confidence: 'low' | 'medium' | 'high',
  sourceKinds: FollowUpActionSourceKind[],
): FollowUpActionImpactBand {
  if (kind === 'safe_watch' || kind === 'monitor_signal') return 'low';
  const hasHighOpportunity =
    confidence === 'high' &&
    sourceKinds.some((kind) =>
      ['reward_comeback', 'one_more_day_retention', 'daily_capacity_portfolio', 'tomorrow_risk'].includes(kind),
    );
  if (hasHighOpportunity && (kind === 'support_recovery' || kind === 'prepare_tomorrow')) return 'high';
  return 'medium';
}

export function resolveFollowUpCostBand(
  kind: FollowUpActionKind,
  sourceKinds: FollowUpActionSourceKind[],
): FollowUpActionCostBand {
  if (kind === 'support_recovery' || sourceKinds.includes('reward_comeback')) {
    return 'low';
  }
  if (kind === 'monitor_signal' && sourceKinds.includes('portfolio_defer_risk')) {
    return 'none';
  }
  return FOLLOW_UP_COST_BANDS[kind];
}
