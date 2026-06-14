import type {
  DailyCapacityMode,
  OperationPortfolioCapacityCost,
  OperationPortfolioDeferRisk,
  OperationPortfolioItemKind,
} from './dailyCapacityPortfolioTypes';

import {
  MAX_POST_PILOT_ACTIVE_EVENTS,
  POST_PILOT_FIRST_OPERATION_DAY,
} from '@/core/postPilot/postPilotEventConstants';

export const PORTFOLIO_MAX_VISIBLE_ITEMS = 4;
export const PORTFOLIO_MAX_SELECTED_ITEMS_DAY8 = MAX_POST_PILOT_ACTIVE_EVENTS;
export const PORTFOLIO_MAX_MAP_RECOMMENDED = 2;
export const PORTFOLIO_MAX_CARD_MODELS = 4;
export const PORTFOLIO_COST_MAX = 3;

export const DETAILED_PORTFOLIO_PERMISSION_IDS = new Set([
  'resource_pressure_summary',
  'assignment_fit_preview',
  'district_trust_preview',
  'tomorrow_risk_preview',
  'map_resource_layer',
  'district_memory_trace_preview',
  'map_trust_layer',
  'active_task_route',
]);

export const PORTFOLIO_KIND_PRIORITY_BASE: Record<OperationPortfolioItemKind, number> = {
  active_operation: 70,
  risk_signal: 65,
  district_pressure: 58,
  resource_pressure: 60,
  route_pressure: 62,
  social_pressure: 60,
  container_pressure: 60,
  maintenance_warning: 55,
  memory_trace: 48,
  recovery_opportunity: 52,
  positive_opportunity: 45,
  follow_up_candidate: 50,
};

export const PORTFOLIO_BASE_COSTS: Record<
  OperationPortfolioItemKind,
  OperationPortfolioCapacityCost
> = {
  active_operation: {
    operationSlots: 1,
    team: 1,
    vehicle: 1,
    resource: 1,
    social: 0,
    districtFocus: 1,
    followUp: 0,
  },
  risk_signal: {
    operationSlots: 0,
    team: 0,
    vehicle: 0,
    resource: 0,
    social: 0,
    districtFocus: 0,
    followUp: 0,
  },
  route_pressure: {
    operationSlots: 1,
    team: 1,
    vehicle: 2,
    resource: 1,
    social: 0,
    districtFocus: 1,
    followUp: 0,
  },
  social_pressure: {
    operationSlots: 1,
    team: 1,
    vehicle: 0,
    resource: 1,
    social: 2,
    districtFocus: 1,
    followUp: 0,
  },
  container_pressure: {
    operationSlots: 1,
    team: 1,
    vehicle: 1,
    resource: 2,
    social: 0,
    districtFocus: 1,
    followUp: 0,
  },
  resource_pressure: {
    operationSlots: 1,
    team: 1,
    vehicle: 1,
    resource: 2,
    social: 0,
    districtFocus: 1,
    followUp: 0,
  },
  district_pressure: {
    operationSlots: 1,
    team: 1,
    vehicle: 0,
    resource: 1,
    social: 1,
    districtFocus: 1,
    followUp: 0,
  },
  maintenance_warning: {
    operationSlots: 1,
    team: 0,
    vehicle: 2,
    resource: 1,
    social: 0,
    districtFocus: 0,
    followUp: 1,
  },
  memory_trace: {
    operationSlots: 0,
    team: 0,
    vehicle: 0,
    resource: 1,
    social: 1,
    districtFocus: 1,
    followUp: 1,
  },
  recovery_opportunity: {
    operationSlots: 1,
    team: 1,
    vehicle: 0,
    resource: 1,
    social: 1,
    districtFocus: 1,
    followUp: 1,
  },
  positive_opportunity: {
    operationSlots: 1,
    team: 1,
    vehicle: 0,
    resource: 1,
    social: 1,
    districtFocus: 1,
    followUp: 0,
  },
  follow_up_candidate: {
    operationSlots: 0,
    team: 0,
    vehicle: 0,
    resource: 1,
    social: 0,
    districtFocus: 1,
    followUp: 1,
  },
};

export const DEFER_RISK_COPY: Record<Exclude<OperationPortfolioDeferRisk, 'none'>, string> = {
  safe_to_watch: 'Bugun izlenebilir; yarin tekrar kontrol et.',
  pressure_may_grow: 'Erteleme baskiyi yarina tasiyabilir.',
  trust_may_drop: 'Guven etkisi beklerse zayiflayabilir.',
  resource_cost_may_rise: 'Kaynak maliyeti yarin artabilir.',
  route_may_strain: 'Rota baskisi yarina daha sert donebilir.',
  social_reaction_may_grow: 'Sosyal tepki beklerse buyuyebilir.',
  opportunity_may_expire: 'Bu firsat bugun daha degerli.',
  memory_trace_may_harden: 'Bu iz takip edilmezse kalicilasabilir.',
};

export function resolveDailyCapacityMode(day: number): DailyCapacityMode {
  if (day <= 1) return 'tutorial';
  if (day < POST_PILOT_FIRST_OPERATION_DAY) return 'pilot';
  if (day < 10) return 'post_pilot_light';
  return 'post_pilot_strategic';
}

export function resolveOperationSlotLimit(day: number): number {
  if (day <= 1) return 1;
  if (day < POST_PILOT_FIRST_OPERATION_DAY) return 1;
  return MAX_POST_PILOT_ACTIVE_EVENTS;
}

export function resolvePortfolioItemLimit(day: number): number {
  if (day <= 1) return 2;
  if (day < POST_PILOT_FIRST_OPERATION_DAY) return 3;
  return PORTFOLIO_MAX_VISIBLE_ITEMS;
}
