import type { EventDecisionIntent } from './eventContentTypes';
import type { ButterflyHookKind } from './butterflyHookTypes';

/** Pilot günü üst sınırı — bu günden sonra yeni hook üretilmez. */
export const BUTTERFLY_HOOK_MAX_PILOT_DAY = 7;

export const BUTTERFLY_HOOK_MAX_ACTIVE = 3;
export const BUTTERFLY_HOOK_MAX_NEW_PER_DAY = 1;
export const BUTTERFLY_HOOK_MAX_FOLLOW_UP_EVENTS_PER_DAY = 1;
export const BUTTERFLY_HOOK_REPORT_LINE_CAP = 2;

export const BUTTERFLY_HOOK_EXPIRE_AFTER_DUE_DAYS = 2;

/** Hook üretmeye yatkın karar niyetleri. */
export const BUTTERFLY_FAVORABLE_INTENTS: ReadonlySet<EventDecisionIntent> =
  new Set([
    'dispatch_team',
    'monitor',
    'delay',
    'save_resources',
    'communicate',
    'reroute',
    'inspect',
  ]);

/** Genelde hook üretmeyen niyetler. */
export const BUTTERFLY_UNLIKELY_INTENTS: ReadonlySet<EventDecisionIntent> =
  new Set(['permanent_fix', 'coordinate', 'invest']);

export const BUTTERFLY_STRATEGY_HOOK_KIND: Record<string, ButterflyHookKind> = {
  'Hızlı çözüm': 'follow_up_event',
  'Kaynak korur': 'report_echo',
  'Sosyal rahatlama': 'risk_signal',
  'Dengeli plan': 'follow_up_event',
  'Kalıcı çözüm': 'permanent_solution_prompt',
};

export const BUTTERFLY_DECISION_STYLE_INTENT: Record<
  string,
  EventDecisionIntent
> = {
  fast: 'dispatch_team',
  planned: 'delay',
  partial: 'monitor',
  communication: 'communicate',
  permanent: 'permanent_fix',
  resource_saving: 'save_resources',
  risk: 'inspect',
};

export const BUTTERFLY_FOLLOW_UP_PROFILE_BY_TAG: Record<string, string> = {
  container_pressure: 'waste_sanayi_line',
  capacity_plan: 'perm_container_cap',
  social_follow: 'social_cumhuriyet_parents',
  route_delay: 'vehicle_merkez_access',
  quick_fix_echo: 'waste_sanayi_line',
  resource_echo: 'social_merkez_viral',
  stability_echo: 'vehicle_sanayi_route',
};
