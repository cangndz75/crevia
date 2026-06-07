import type { CityEchoBindingKind } from './cityEchoBindingTypes';

export const CITY_ECHO_BINDING_KINDS: readonly CityEchoBindingKind[] = [
  'decision_tradeoff_echo',
  'tomorrow_risk_echo',
  'route_balance_echo',
  'container_pressure_echo',
  'personnel_fatigue_echo',
  'vehicle_fatigue_echo',
  'social_trust_echo',
  'district_trust_echo',
  'crisis_prevention_echo',
  'recovery_momentum_echo',
  'carry_over_echo',
  'operation_era_echo',
  'post_pilot_scope_echo',
  'generic_city_echo',
  'fallback',
] as const;

export const CITY_ECHO_FORBIDDEN_TERMS: readonly string[] = [
  'panik',
  'felaket',
  'kaybettin',
  'başarısız oldun',
  'ceza',
  'ödül kazan',
  'kaçırma',
  'hemen geri dön',
  'streak',
  'fomo',
  'premium',
  'satın al',
  'kilitli',
  'parametre optimizasyonu',
] as const;

export const CITY_ECHO_COPY_LIMITS = {
  ece: 138,
  social: 112,
  report: 142,
  tomorrow: 88,
  hub: 118,
} as const;
