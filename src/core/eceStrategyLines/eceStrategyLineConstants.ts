import type { EceStrategyLineKind, EceStrategyLineSourceKind } from './eceStrategyLineTypes';
import { EXPECTED_SAVE_VERSION_FOR_VERIFY } from '@/core/quality/saveVersionPolicy';

export const ECE_STRATEGY_LINE_MAX = 120;
export const ECE_STRATEGY_LINE_SHORT_MAX = 72;
export const ECE_STRATEGY_LINE_ACCESSIBILITY_MAX = 160;

export const ECE_STRATEGY_LINE_EXPECTED_SAVE_VERSION = EXPECTED_SAVE_VERSION_FOR_VERIFY;

export const ECE_STRATEGY_LINE_SOURCE_PRIORITY: EceStrategyLineSourceKind[] = [
  'one_more_day_retention',
  'portfolio_defer_risk',
  'daily_capacity_portfolio',
  'authority_gameplay_expansion',
  'decision_consequence',
  'tomorrow_risk',
  'carry_over',
  'butterfly_effect',
  'district_memory',
  'city_archive',
  'story_chain',
  'map_gameplay_binding',
  'active_operation_map_binding',
  'resource_pressure',
  'player_style',
  'advisor_seniority',
  'advisor_relationship',
  'district_personality',
  'event_gameplay_variety',
  'fallback',
];

export const ECE_STRATEGY_LINE_KIND_LABELS: Record<EceStrategyLineKind, string> = {
  day_start_briefing: 'Gun Baslangici',
  hub_strategy_hint: 'Strateji',
  portfolio_tradeoff: 'Portfoy',
  defer_follow_up: 'Takip',
  one_more_day_hook: 'Yarin',
  authority_benefit: 'Yetki',
  district_memory: 'Hafiza',
  decision_consequence: 'Etki',
  map_priority: 'Harita',
  resource_pressure: 'Kaynak',
  player_style_reflection: 'Tarz',
  recovery_opportunity: 'Toparlanma',
  warning_caution: 'Dikkat',
  positive_reinforcement: 'Guc',
  fallback: 'Ece',
};

export const ECE_TECHNICAL_TOKEN_PATTERN = /\b[a-z]+_[a-z_]+\b/;
