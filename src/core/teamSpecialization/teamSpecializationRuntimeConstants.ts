import type { TeamGroupId } from './teamSpecializationRuntimeTypes';

export const TEAM_SPECIALIZATION_V1_VERSION = 1 as const;

export const TEAM_SPECIALIZATION_MIGRATION_FROM_SAVE_VERSION = 25;

export const TEAM_SPECIALIZATION_TARGET_SAVE_VERSION = 26;

export const TEAM_SPECIALIZATION_GROUP_IDS: readonly TeamGroupId[] = [
  'field_coordination',
  'route_cleanup',
  'container_service',
  'social_response',
  'rapid_support',
  'backup_team',
] as const;

export const TEAM_SPECIALIZATION_PLAYER_LABELS: Record<TeamGroupId, string> = {
  field_coordination: 'Saha koordinasyon ekibi',
  route_cleanup: 'Rota temizlik grubu',
  container_service: 'Konteyner saha grubu',
  social_response: 'Sosyal müdahale grubu',
  rapid_support: 'Hızlı destek ekibi',
  backup_team: 'Yedek destek ekibi',
};

export const TEAM_SPECIALIZATION_SCORE_MAX = 100;

export const TEAM_SPECIALIZATION_EXPERIENCE_EMERGING_MIN = 20;

export const TEAM_SPECIALIZATION_EXPERIENCE_RELIABLE_MIN = 40;

export const TEAM_SPECIALIZATION_EXPERIENCE_SPECIALIZED_MIN = 60;

export const TEAM_SPECIALIZATION_EXPERIENCE_EXPERT_PREVIEW_MIN = 80;

export const TEAM_SPECIALIZATION_FATIGUE_WATCHED_MIN = 25;

export const TEAM_SPECIALIZATION_FATIGUE_ELEVATED_MIN = 45;

export const TEAM_SPECIALIZATION_FATIGUE_STRAINED_MIN = 65;

export const TEAM_SPECIALIZATION_MORALE_PRESSURED_MAX = 35;

export const TEAM_SPECIALIZATION_MORALE_STEADY_MAX = 55;

export const TEAM_SPECIALIZATION_MORALE_MOTIVATED_MIN = 70;

export const TEAM_SPECIALIZATION_HIGH_COMPATIBILITY_MIN = 75;

export const TEAM_SPECIALIZATION_POOR_COMPATIBILITY_MAX = 49;

export const TEAM_SPECIALIZATION_FATIGUE_GAIN_REDUCTION_THRESHOLD = 45;

export const TEAM_SPECIALIZATION_VISIBLE_DAY_MIN = 8;

export const TEAM_SPECIALIZATION_PASSIVE_DAY_MAX = 7;

export const TEAM_SPECIALIZATION_MAX_ARCHIVE_ENTRIES_PER_DAY = 1;

export const TEAM_SPECIALIZATION_EXPERIENCE_WEIGHTS = {
  sameDomainSuccess: 10,
  highCompatibility: 6,
  repeatedDistrictDomain: 5,
  rewardComebackPositive: 8,
  storyChainClosure: 8,
  poorFitPenalty: -4,
} as const;

export const TEAM_SPECIALIZATION_FATIGUE_WEIGHTS = {
  consecutiveUsePerDay: 10,
  rapidSupportFieldResponse: 12,
  crisisAdjacent: 10,
  poorFitAssignment: 8,
  recoveryRestWindow: -15,
  balancedAssignmentRelief: -5,
} as const;

export const TEAM_SPECIALIZATION_MORALE_WEIGHTS = {
  positiveOutcome: 8,
  socialTrust: 6,
  repeatedStrain: -8,
  backupOveruse: -6,
  teamCapacityStable: 4,
} as const;

export const TEAM_SPECIALIZATION_FORBIDDEN_SURFACE_TERMS = [
  'gps',
  'plaka',
  'canlı takip',
  'live tracking',
  'team id',
  'teamSpecialization',
  'premium',
  'kilitli',
  'uzman ekip satın al',
  'maaş',
  'sendika',
  'işçi yönetimi',
  'personel listesi',
  'metadata',
  'raw personnel',
  'employee_id',
  'payroll',
] as const;

export const TEAM_SPECIALIZATION_ARCHIVE_KINDS = [
  'team_specialization_gained',
  'team_fatigue_warning',
  'team_morale_recovered',
  'team_domain_mastery',
  'backup_team_overused',
] as const;

export const TEAM_SPECIALIZATION_STORY_SIGNAL_TYPES = [
  'field_coordination_followup_hint',
  'route_cleanup_chain_hint',
  'container_service_chain_hint',
  'social_response_trust_hint',
  'rapid_support_fatigue_hint',
  'backup_team_strain_hint',
] as const;
