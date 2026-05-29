import type { PostPilotPhase, PostPilotScopeId, ScopeActivationStatus } from './postPilotOperationTypes';

export const POST_PILOT_SCOPE_IDS: readonly PostPilotScopeId[] = [
  'istasyon',
  'yesilvadi',
  'main_operation',
] as const;

export const POST_PILOT_PHASES: readonly PostPilotPhase[] = [
  'pilot_only',
  'pilot_complete_idle',
  'preview_seen',
  'main_operation_light',
  'main_operation_full',
] as const;

export const SCOPE_ACTIVATION_STATUSES: readonly ScopeActivationStatus[] = [
  'dormant',
  'preview',
  'agenda',
  'active',
  'stable',
] as const;

export const POST_PILOT_FORBIDDEN_WORDS = [
  'kilitli',
  'premium',
  'satın al',
  'paywall',
  'yetkin yetersiz',
] as const;

export const POST_PILOT_PREVIEW_CTA_LABEL = 'Operasyon Gündemini Başlat';
export const POST_PILOT_PREVIEW_CTA_FALLBACK_LABEL = 'Pilot raporunu tamamla';

export const POST_PILOT_AUTHORITY_TRUST_ISTASYON_AGENDA = 350;
export const POST_PILOT_AUTHORITY_TRUST_YESILVADI_AGENDA = 900;

export const DEFAULT_PREVIEW_SCOPES: Record<PostPilotScopeId, ScopeActivationStatus> = {
  istasyon: 'preview',
  yesilvadi: 'preview',
  main_operation: 'preview',
};
