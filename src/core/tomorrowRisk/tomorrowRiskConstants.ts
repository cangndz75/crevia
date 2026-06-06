import type { TomorrowRiskKind } from './tomorrowRiskTypes';

export const TOMORROW_RISK_KINDS: TomorrowRiskKind[] = [
  'route_pressure_tomorrow',
  'container_pressure_tomorrow',
  'social_trust_recovery',
  'personnel_fatigue_watch',
  'vehicle_fatigue_watch',
  'district_trust_watch',
  'crisis_prevention_watch',
  'resource_balance_watch',
  'recovery_momentum',
  'operation_era_hint',
  'post_pilot_next_scope',
  'generic_city_preparation',
  'fallback',
];

export const TOMORROW_RISK_FORBIDDEN_CTA_WORDS = [
  'odul kazan',
  'kacirma',
  'hemen geri don',
  'serini bozma',
  'buyuk firsat',
  'basarisiz oldun',
  'daily reward',
  'streak',
] as const;

export const TOMORROW_RISK_TITLE = 'Yarın İçin İzleme Notu';
export const TOMORROW_RISK_CITY_CTA = 'Şehir yarına hazırlanıyor.';
export const TOMORROW_RISK_MAX_VISIBLE_LINES = 3;
