import type {
  AuthorityPermissionDefinition,
  AuthorityPermissionId,
  AuthorityRankDefinition,
  AuthorityRankId,
} from './authorityTypes';

export const AUTHORITY_RANKS: AuthorityRankDefinition[] = [
  {
    id: 'field_coordinator',
    label: 'Saha Koordinatörü',
    trustThreshold: 0,
  },
  {
    id: 'operations_responsible',
    label: 'Operasyon Sorumlusu',
    trustThreshold: 450,
  },
  {
    id: 'unit_chief',
    label: 'Birim Şefi',
    trustThreshold: 1200,
  },
  {
    id: 'district_coordinator',
    label: 'Bölge Koordinatörü',
    trustThreshold: 2500,
  },
  {
    id: 'deputy_director',
    label: 'Daire Başkan Yardımcısı',
    trustThreshold: 4500,
  },
  {
    id: 'department_director',
    label: 'Daire Başkanı',
    trustThreshold: 7500,
  },
];

export const AUTHORITY_RANK_BY_ID: Record<
  AuthorityRankId,
  AuthorityRankDefinition
> = Object.fromEntries(
  AUTHORITY_RANKS.map((rank) => [rank.id, rank]),
) as Record<AuthorityRankId, AuthorityRankDefinition>;

export const AUTHORITY_PERMISSIONS: AuthorityPermissionDefinition[] = [
  {
    id: 'basic_operations',
    label: 'Temel Operasyon Yetkisi',
    trustThreshold: 0,
  },
  {
    id: 'daily_preparation_authority',
    label: 'Günlük Hazırlık Yetkisi',
    trustThreshold: 150,
  },
  {
    id: 'field_priority_note',
    label: 'Saha Öncelik Notu',
    trustThreshold: 250,
  },
  {
    id: 'promotion_review_eligible',
    label: 'Terfi Değerlendirme Uygunluğu',
    trustThreshold: 350,
  },
  {
    id: 'operations_responsible_scope',
    label: 'Operasyon Sorumlusu Kapsamı',
    trustThreshold: 450,
  },
  {
    id: 'district_expansion_preview',
    label: 'Bölge Genişleme Önizlemesi',
    trustThreshold: 900,
  },
  {
    id: 'unit_chief_scope',
    label: 'Birim Şefi Kapsamı',
    trustThreshold: 1200,
  },
];

export const AUTHORITY_PERMISSION_BY_ID: Record<
  AuthorityPermissionId,
  AuthorityPermissionDefinition
> = Object.fromEntries(
  AUTHORITY_PERMISSIONS.map((permission) => [permission.id, permission]),
) as Record<AuthorityPermissionId, AuthorityPermissionDefinition>;

export const AUTHORITY_DAILY_GAIN_VALUES = {
  mainEventResolved: 24,
  sideEventResolvedEach: 8,
  sideEventResolvedDailyMax: 16,
  dailyGoalCompletedEach: 10,
  dailyGoalCompletedDailyMax: 20,
  criticalRiskClosed: 16,
  budgetStable: 6,
  personnelMoraleMaintained: 6,
  socialPulseBalanced: 6,
  butterflyFollowUpManaged: 14,
  criticalEventUnresolved: -12,
  budgetSevereDrop: -8,
  personnelMoraleSevereDrop: -8,
  socialCrisisGrew: -8,
} as const;

export const AUTHORITY_DOMAIN_SCORE_DELTAS: Record<
  string,
  Partial<Record<'operations' | 'publicTrust' | 'resources' | 'personnel' | 'crisis', number>>
> = {
  main_event_resolved: { operations: 4, crisis: 2 },
  side_event_resolved: { operations: 2 },
  daily_goal_completed: { operations: 2 },
  critical_risk_closed: { crisis: 4 },
  budget_stable: { resources: 3 },
  personnel_morale_maintained: { personnel: 3 },
  social_pulse_balanced: { publicTrust: 3 },
  butterfly_followup_managed: { crisis: 4 },
  critical_event_unresolved: { crisis: -3 },
  budget_severe_drop: { resources: -3 },
  personnel_morale_severe_drop: { personnel: -3 },
  social_crisis_grew: { publicTrust: -3 },
};

export const AUTHORITY_DEFAULT_FORMAL_RANK_ID: AuthorityRankId = 'field_coordinator';

export const AUTHORITY_INITIAL_UNLOCKED_PERMISSIONS: AuthorityPermissionId[] = [
  'basic_operations',
];
