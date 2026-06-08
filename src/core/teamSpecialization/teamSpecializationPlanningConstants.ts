import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

import type {
  TeamArchiveEntryRecommendation,
  TeamGroupPlan,
  TeamScoreContribution,
  TeamSpecializationDaySafetyPlan,
  TeamSpecializationImplementationScope,
  TeamSpecializationMigrationPlan,
  TeamSpecializationSurfacePlan,
} from './teamSpecializationPlanningTypes';

export const TEAM_SPECIALIZATION_PLANNING_DOCS_PATH =
  'docs/crevia-team-specialization-runtime-planning.md';

export const TEAM_SPECIALIZATION_CURRENT_SAVE_VERSION = 25;

export const TEAM_SPECIALIZATION_TARGET_SAVE_VERSION = 25;

export const TEAM_SPECIALIZATION_IMPLEMENTATION_SAVE_VERSION = 26;

export const TEAM_SPECIALIZATION_GROUP_IDS = [
  'field_coordination',
  'route_cleanup',
  'container_service',
  'social_response',
  'rapid_support',
  'backup_team',
] as const;

export const TEAM_SPECIALIZATION_PLANNING_SPECIALIZATION_BANDS = [
  'none',
  'emerging',
  'trained',
  'reliable',
  'expert_preview',
] as const;

export const TEAM_SPECIALIZATION_PLANNING_FATIGUE_BANDS = [
  'low',
  'moderate',
  'high',
  'strained',
] as const;

export const TEAM_SPECIALIZATION_PLANNING_MORALE_BANDS = [
  'steady',
  'watch',
  'motivated',
  'tired',
] as const;

export const TEAM_SPECIALIZATION_FORBIDDEN_PLAYER_TERMS = [
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
] as const;

export const TEAM_SPECIALIZATION_ARCHIVE_NOT_STORED = [
  'raw_personnel_data',
  'individual_name',
  'employee_id',
  'payroll_record',
  'union_reference',
  'team_group_id_player_facing',
] as const;

export const TEAM_SPECIALIZATION_GROUP_PLANS: TeamGroupPlan[] = [
  {
    groupId: 'field_coordination',
    label: 'Field Coordination',
    playerLabel: 'Saha koordinasyon ekibi',
    linkedDomains: ['district_balance', 'operation_followup', 'crisis_adjacent'],
    linkedDistricts: ['merkez', 'cumhuriyet', 'sanayi'],
    linkedArchiveKinds: ['district_trust_shift', 'operation_followup'],
    linkedStoryChainKinds: ['operation_followup_chain', 'crisis_watch_chain'],
    linkedVehicleFleetGroups: ['light_service', 'field_response'],
    maxConsecutiveUseDays: 3,
  },
  {
    groupId: 'route_cleanup',
    label: 'Route Cleanup',
    playerLabel: 'Rota temizlik grubu',
    linkedDomains: ['vehicle_route', 'route_pressure_chain', 'resource_pressure'],
    linkedDistricts: ['sanayi', 'istasyon', 'merkez'],
    linkedArchiveKinds: ['route_balanced', 'resource_pressure'],
    linkedStoryChainKinds: ['route_pressure_chain', 'resource_fatigue_chain'],
    linkedVehicleFleetGroups: ['route_support'],
    maxConsecutiveUseDays: 2,
  },
  {
    groupId: 'container_service',
    label: 'Container Service',
    playerLabel: 'Konteyner saha grubu',
    linkedDomains: ['container_environment', 'container_recovery_chain', 'environment_care'],
    linkedDistricts: ['cumhuriyet', 'yesilvadi'],
    linkedArchiveKinds: ['container_pressure', 'resource_recovery'],
    linkedStoryChainKinds: ['container_recovery_chain', 'operation_followup_chain'],
    linkedVehicleFleetGroups: ['container_support'],
    maxConsecutiveUseDays: 2,
  },
  {
    groupId: 'social_response',
    label: 'Social Response',
    playerLabel: 'Sosyal müdahale grubu',
    linkedDomains: ['social_trust', 'publicTone', 'reward_positive', 'comeback_recovery'],
    linkedDistricts: ['merkez', 'cumhuriyet', 'yesilvadi'],
    linkedArchiveKinds: ['social_recovery', 'district_trust_shift'],
    linkedStoryChainKinds: ['social_trust_chain'],
    linkedVehicleFleetGroups: ['light_service'],
    maxConsecutiveUseDays: 3,
  },
  {
    groupId: 'rapid_support',
    label: 'Rapid Support',
    playerLabel: 'Hızlı destek ekibi',
    linkedDomains: ['crisis_adjacent', 'field_response', 'rapid_response'],
    linkedDistricts: ['sanayi', 'istasyon', 'merkez'],
    linkedArchiveKinds: ['resource_pressure', 'crisis_watch'],
    linkedStoryChainKinds: ['crisis_watch_chain', 'resource_fatigue_chain'],
    linkedVehicleFleetGroups: ['field_response'],
    maxConsecutiveUseDays: 1,
  },
  {
    groupId: 'backup_team',
    label: 'Backup Team',
    playerLabel: 'Yedek destek ekibi',
    linkedDomains: ['resource_pressure', 'resource_recovery', 'backup_support'],
    linkedDistricts: ['merkez', 'sanayi', 'istasyon', 'cumhuriyet', 'yesilvadi'],
    linkedArchiveKinds: ['resource_recovery', 'route_balanced'],
    linkedStoryChainKinds: ['resource_fatigue_chain'],
    linkedVehicleFleetGroups: ['backup_fleet'],
    maxConsecutiveUseDays: 1,
  },
];

export const TEAM_SPECIALIZATION_SCORE_CONTRIBUTIONS: TeamScoreContribution[] = [
  { sourceId: 'same_domain_success', scoreKind: 'experience', weight: 10, description: 'Same domain successful assignment +10' },
  { sourceId: 'assignment_compatibility', scoreKind: 'experience', weight: 6, description: 'High compatibility +6' },
  { sourceId: 'repeated_district_domain_success', scoreKind: 'experience', weight: 5, description: 'Repeated same district/domain success +5' },
  { sourceId: 'reward_comeback_positive', scoreKind: 'experience', weight: 8, description: 'Reward/comeback positive +8' },
  { sourceId: 'story_chain_closure', scoreKind: 'experience', weight: 8, description: 'Story chain closure +8' },
  { sourceId: 'poor_fit_penalty', scoreKind: 'experience', weight: -4, description: 'Poor fit or failed outcome -4' },
  { sourceId: 'failed_outcome_penalty', scoreKind: 'experience', weight: -4, description: 'Failed outcome -4' },
  { sourceId: 'fatigue_gain_reduction', scoreKind: 'experience', weight: 0, description: 'Fatigue high reduces experience gain' },
  { sourceId: 'backup_overuse_morale', scoreKind: 'experience', weight: 0, description: 'Backup overuse reduces morale' },
  { sourceId: 'consecutive_use_streak', scoreKind: 'fatigue', weight: 10, description: 'Consecutive use +10/day after first' },
  { sourceId: 'rapid_support_field_response', scoreKind: 'fatigue', weight: 12, description: 'rapid_support + field_response heavy day +12' },
  { sourceId: 'crisis_adjacent_pressure', scoreKind: 'fatigue', weight: 10, description: 'crisis_adjacent +10' },
  { sourceId: 'poor_fit_assignment', scoreKind: 'fatigue', weight: 8, description: 'Poor fit +8' },
  { sourceId: 'recovery_rest_window', scoreKind: 'fatigue', weight: -15, description: 'Completed recovery/rest window -15' },
  { sourceId: 'balanced_assignment_relief', scoreKind: 'fatigue', weight: -5, description: 'Successful balanced assignment -5' },
  { sourceId: 'positive_outcome', scoreKind: 'morale', weight: 8, description: 'Positive outcome +8' },
  { sourceId: 'public_thanks_social_trust', scoreKind: 'morale', weight: 6, description: 'Public thanks/social_trust +6' },
  { sourceId: 'repeated_strain', scoreKind: 'morale', weight: -8, description: 'Repeated strain -8' },
  { sourceId: 'backup_overuse', scoreKind: 'morale', weight: -6, description: 'Backup overuse -6' },
  { sourceId: 'team_capacity_stable', scoreKind: 'morale', weight: 4, description: 'Team capacity stable +4' },
];

export const TEAM_SPECIALIZATION_ASSIGNMENT_INTEGRATION_RULES = [
  'assignment_personnel_group_feeds_specialization_input',
  'good_fit_plus_matching_domain_specialization_gain',
  'poor_fit_plus_repeated_use_fatigue_increase',
  'same_team_repeated_every_day_fatigue_increase',
  'backup_team_emergency_buffer_spam_reduces_morale',
  'vehicle_group_and_team_group_future_combined_fit',
  'assignment_ui_unchanged_in_v1_planning',
  'assignment_scoring_unchanged_in_v1_planning',
] as const;

export const TEAM_SPECIALIZATION_VEHICLE_MAINTENANCE_RULES = [
  'route_cleanup_plus_route_support_increases_route_fatigue',
  'rapid_support_plus_field_response_strain_both_sides',
  'container_service_plus_container_support_balanced_relief',
  'maintenance_due_vehicle_group_caution_line_for_team',
  'vehicleMaintenanceLinkSummary_reads_vehicle_state',
  'team_fatigue_and_vehicle_fatigue_separate_but_related',
  'no_duplicate_vehicle_maintenance_risk_in_team_copy',
] as const;

export const TEAM_SPECIALIZATION_ARCHIVE_INTEGRATION_RULES = [
  'recommend_team_specialization_gained_kind',
  'recommend_team_fatigue_warning_kind',
  'recommend_team_morale_recovered_kind',
  'recommend_team_domain_mastery_kind',
  'recommend_backup_team_overused_kind',
  'no_archive_kind_added_in_planning_pass',
  'no_raw_personnel_data_stored',
  'no_individual_names',
  'duplicate_key_required',
  'player_facing_short_deterministic_copy',
] as const;

export const TEAM_SPECIALIZATION_STORY_CHAIN_RULES = [
  'matching_team_success_can_advance_or_soften_chain',
  'team_fatigue_high_can_start_resource_fatigue_chain_under_guard',
  'story_closure_specialization_gain',
  'no_story_chain_spam',
  'team_signal_low_priority_input_to_story_chain_engine',
  'route_pressure_chain_route_cleanup',
  'container_recovery_chain_container_service',
  'social_trust_chain_social_response',
  'crisis_watch_chain_rapid_support',
] as const;

export const TEAM_SPECIALIZATION_CONTENT_PACK_RULES = [
  'personnel_morale_pack_safer_after_team_specialization_v1',
  'social_trust_pack_social_response_experience',
  'vehicle_route_pack_route_cleanup_experience_fatigue',
  'container_environment_pack_container_service_experience',
  'crisis_adjacent_pack_rapid_support_fatigue_risk',
  'reward_comeback_morale_recovery',
  'no_runtime_injection_change_in_planning_pass',
  'content_pack_stage2_max3_not_opened',
] as const;

export const TEAM_SPECIALIZATION_SURFACE_DENSITY_RULES = [
  'hub_max_1_team_line_day8_plus',
  'report_max_1_team_trace_line',
  'map_max_1_team_capacity_hint',
  'no_duplicate_with_main_operation_feel',
  'no_duplicate_with_story_chain_line',
  'no_duplicate_with_city_journal',
  'no_duplicate_with_vehicle_maintenance_line',
  'assignment_preview_future_only_no_ui_change',
  'no_team_detail_route',
  'no_profile_team_screen',
] as const;

export const TEAM_SPECIALIZATION_DAY_SAFETY_PLANS: TeamSpecializationDaySafetyPlan[] = [
  { dayRange: '1', specializationUiVisibility: 'hidden', hubLineMax: 0, reportLineMax: 0, mapHintAllowed: false },
  { dayRange: '2-3', specializationUiVisibility: 'hidden', hubLineMax: 0, reportLineMax: 0, mapHintAllowed: false },
  { dayRange: '4-7', specializationUiVisibility: 'passive_hint', hubLineMax: 0, reportLineMax: 0, mapHintAllowed: false },
  { dayRange: '8-9', specializationUiVisibility: 'visible', hubLineMax: 1, reportLineMax: 1, mapHintAllowed: true },
  { dayRange: '10+', specializationUiVisibility: 'visible', hubLineMax: 1, reportLineMax: 1, mapHintAllowed: true },
];

export const TEAM_SPECIALIZATION_SURFACE_PLANS: TeamSpecializationSurfacePlan[] = [
  {
    surface: 'hub',
    maxLinesPerDay: 1,
    priorityBelow: ['story_chain', 'main_operation_feel', 'vehicle_maintenance', 'city_journal'],
    exampleLine: 'Ekip izi: Rota temizlik grubu Sanayi hattında deneyim kazanıyor.',
    forbiddenTerms: ['team id', 'teamSpecialization', 'premium', 'uzman ekip satın al'],
  },
  {
    surface: 'report',
    maxLinesPerDay: 1,
    priorityBelow: ['story_chain', 'report_continuity', 'vehicle_maintenance'],
    exampleLine: 'Ekip yorgunluğu: Hızlı destek hattı yarın daha dikkatli kullanılmalı.',
    forbiddenTerms: ['maaş', 'sendika', 'personel listesi'],
  },
  {
    surface: 'map',
    maxLinesPerDay: 1,
    priorityBelow: ['story_chain_step', 'comeback_completed', 'journal_trace', 'vehicle_maintenance'],
    exampleLine: 'Ekip desteği: Cumhuriyet konteyner ekibi sahada daha net iz bırakıyor.',
    forbiddenTerms: ['gps', 'plaka', 'canlı takip'],
  },
  {
    surface: 'assignment_preview',
    maxLinesPerDay: 0,
    priorityBelow: [],
    exampleLine: 'Bu ekip bu tür olaylarda deneyim kazandı.',
    forbiddenTerms: ['kilitli', 'premium'],
  },
  {
    surface: 'city_journal',
    maxLinesPerDay: 1,
    priorityBelow: ['story_chain_step', 'main_operation_started'],
    exampleLine: 'Ekip toparlandı: Sosyal müdahale grubu bugünkü güven çizgisini güçlendirdi.',
    forbiddenTerms: ['teamSpecialization', 'runtime'],
  },
];

export const TEAM_SPECIALIZATION_ARCHIVE_ENTRY_RECOMMENDATIONS: TeamArchiveEntryRecommendation[] = [
  {
    kind: 'team_specialization_gained',
    purpose: 'Team gained domain experience',
    duplicateKeyPattern: 'team_specialization_gained:{groupId}:{day}',
    playerFacing: true,
    storeRawPersonnelData: false,
  },
  {
    kind: 'team_fatigue_warning',
    purpose: 'High team fatigue without panic copy',
    duplicateKeyPattern: 'team_fatigue_warning:{groupId}:{day}',
    playerFacing: true,
    storeRawPersonnelData: false,
  },
  {
    kind: 'team_morale_recovered',
    purpose: 'Team morale recovery after strain',
    duplicateKeyPattern: 'team_morale_recovered:{groupId}:{day}',
    playerFacing: true,
    storeRawPersonnelData: false,
  },
  {
    kind: 'team_domain_mastery',
    purpose: 'Domain mastery milestone for team group',
    duplicateKeyPattern: 'team_domain_mastery:{groupId}:{domain}:{day}',
    playerFacing: true,
    storeRawPersonnelData: false,
  },
  {
    kind: 'backup_team_overused',
    purpose: 'Backup team overuse warning',
    duplicateKeyPattern: 'backup_team_overused:{day}',
    playerFacing: true,
    storeRawPersonnelData: false,
  },
];

export const TEAM_SPECIALIZATION_MIGRATION_PLAN: TeamSpecializationMigrationPlan = {
  targetSaveVersion: 26,
  currentSaveVersion: 25,
  steps: [
    'v25 save without teamSpecialization -> create initial TeamSpecializationStateV1',
    'day <= 7 -> hidden/passive default bands (none/low/steady)',
    'day >= 8 -> derive initial team state from assignment/resource/archive if available',
    'missing/corrupt cityArchive -> safe default',
    'missing/corrupt vehicleMaintenance -> safe default, skip vehicle link derivation',
    'no duplicate entries/windows on re-migrate',
    'missing assignment/personnel group -> skip derivation, use safe default',
    'migration idempotent',
  ],
  day7Default: 'All team groups none/low/steady; no visible specialization lines',
  day8Derivation: [
    'assignment personnel group history -> dominantDomain hint',
    'assignment compatibility high -> emerging specializationBand',
    'cityArchive team-related or domain entries -> experienceScore boost',
    'vehicleMaintenance route_support strained -> route_cleanup cautionLine',
    'district report playerStyleInDistrict -> districtExperienceIds',
    'story chain active -> related group soft link',
  ],
  safeFallback: 'Empty teamGroups with none/low/steady defaults; summaries empty',
  idempotent: true,
};

export const TEAM_SPECIALIZATION_IMPLEMENTATION_SCOPE: TeamSpecializationImplementationScope = {
  stage: 'Team Specialization Runtime V1 Implementation',
  included: [
    'SAVE_VERSION 26',
    'persisted teamSpecialization state',
    'v25 -> v26 migration',
    'day-close team experience/fatigue update',
    'assignment read-only input',
    'Hub/Report compact team lines',
    'City Archive future team entries',
    'Story Chain low-priority team signal',
    'vehicle maintenance link summary read',
    'fleet group model only — no individual personnel list',
  ],
  notIncluded: [
    'individual personnel profiles',
    'hiring/firing',
    'economy upgrade',
    'paid team boost',
    'morale shop',
    'AI suggestions',
    'live ops / remote config',
    'new route or team detail screen',
    'payroll/worker management',
    'assignment scoring rewrite',
    'vehicle maintenance runtime rewrite',
  ],
};

export const TEAM_SPECIALIZATION_RUNTIME_UNCHANGED_FILES = [
  'src/core/game/applyDecision.ts',
  'src/core/dayPipeline/dayPipelineOrchestrator.ts',
  'src/core/game/generateDailyEventSet.ts',
  'src/core/postPilot/postPilotEventEngine.ts',
  'src/core/contentRuntimeActivation/contentRuntimeActivationIntegration.ts',
] as const;

export const TEAM_SPECIALIZATION_PLANNING_DISTRICTS: readonly MapDistrictId[] = [
  'merkez',
  'cumhuriyet',
  'sanayi',
  'istasyon',
  'yesilvadi',
] as const;

export const TEAM_SPECIALIZATION_EXPERIENCE_SCORE_MAX = 100;

export const TEAM_SPECIALIZATION_PLAYER_FEEL_GOAL =
  'Ekipleri sürekli aynı tarz olaylara yönlendirdikçe deneyim kazanıyorlar; ama aşırı kullanım yorgunluk ve denge riski yaratıyor.';
