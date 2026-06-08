import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

import type {
  VehicleMaintenanceArchiveEntryRecommendation,
  VehicleMaintenanceDaySafetyPlan,
  VehicleMaintenanceFleetGroupPlan,
  VehicleMaintenanceImplementationScope,
  VehicleMaintenanceMigrationPlan,
  VehicleMaintenanceScoreContribution,
  VehicleMaintenanceSurfacePlan,
} from './vehicleMaintenancePlanningTypes';

export const VEHICLE_MAINTENANCE_PLANNING_DOCS_PATH =
  'docs/crevia-vehicle-maintenance-runtime-planning.md';

export const VEHICLE_MAINTENANCE_CURRENT_SAVE_VERSION = 25;

export const VEHICLE_MAINTENANCE_TARGET_SAVE_VERSION = 25;

export const VEHICLE_MAINTENANCE_FLEET_GROUP_IDS = [
  'light_service',
  'route_support',
  'container_support',
  'field_response',
  'backup_fleet',
] as const;

export const VEHICLE_MAINTENANCE_PLANNING_CONDITION_BANDS = [
  'stable',
  'watch',
  'strained',
  'maintenance_due',
  'critical',
] as const;

export const VEHICLE_MAINTENANCE_PLANNING_FATIGUE_BANDS = [
  'low',
  'moderate',
  'high',
  'severe',
] as const;

export const VEHICLE_MAINTENANCE_PLANNING_AVAILABILITY_BANDS = [
  'ready',
  'limited',
  'reduced',
  'unavailable',
] as const;

export const VEHICLE_MAINTENANCE_PLANNING_WINDOW_STATUSES = [
  'suggested',
  'planned',
  'skipped',
  'completed',
  'expired',
] as const;

export const VEHICLE_MAINTENANCE_PLANNING_WINDOW_KINDS = [
  'light_check',
  'route_reset',
  'container_vehicle_service',
  'field_recovery',
  'emergency_repair_watch',
] as const;

export const VEHICLE_MAINTENANCE_FORBIDDEN_PLAYER_TERMS = [
  'gps',
  'plaka',
  'canlı takip',
  'live tracking',
  'fleet id',
  'maintenance runtime',
  'vehicleMaintenance',
  'premium',
  'kilitli',
  'panik',
  'felaket',
  'metadata',
  'raw vehicle',
] as const;

export const VEHICLE_MAINTENANCE_ARCHIVE_NOT_STORED = [
  'raw_vehicle_metadata',
  'plate_number',
  'gps_trace',
  'vehicle_internal_id',
  'fleet_group_id_player_facing',
] as const;

export const VEHICLE_MAINTENANCE_FLEET_GROUP_PLANS: VehicleMaintenanceFleetGroupPlan[] = [
  {
    groupId: 'light_service',
    label: 'Light Service',
    playerLabel: 'Hafif saha desteği',
    linkedDomains: ['social_trust', 'district_balance', 'visible_service'],
    linkedDistricts: ['merkez', 'cumhuriyet', 'yesilvadi'],
    linkedArchiveKinds: ['district_trust_shift', 'social_recovery'],
    linkedStoryChainKinds: ['operation_followup_chain'],
    maxConsecutiveUseDays: 3,
    maintenanceWindowKinds: ['light_check'],
  },
  {
    groupId: 'route_support',
    label: 'Route Support',
    playerLabel: 'Rota destek ekibi',
    linkedDomains: ['vehicle_route', 'resource_pressure', 'route_balanced'],
    linkedDistricts: ['sanayi', 'istasyon', 'merkez'],
    linkedArchiveKinds: ['route_balanced', 'resource_pressure'],
    linkedStoryChainKinds: ['route_pressure_chain', 'resource_fatigue_chain'],
    maxConsecutiveUseDays: 2,
    maintenanceWindowKinds: ['route_reset', 'emergency_repair_watch'],
  },
  {
    groupId: 'container_support',
    label: 'Container Support',
    playerLabel: 'Konteyner saha ekibi',
    linkedDomains: ['container_environment', 'container_relief', 'environment_care'],
    linkedDistricts: ['cumhuriyet', 'yesilvadi'],
    linkedArchiveKinds: ['container_pressure', 'resource_recovery'],
    linkedStoryChainKinds: ['operation_followup_chain'],
    maxConsecutiveUseDays: 2,
    maintenanceWindowKinds: ['container_vehicle_service', 'light_check'],
  },
  {
    groupId: 'field_response',
    label: 'Field Response',
    playerLabel: 'Acil saha müdahale',
    linkedDomains: ['crisis_adjacent', 'field_response', 'rapid_response'],
    linkedDistricts: ['sanayi', 'istasyon', 'merkez'],
    linkedArchiveKinds: ['resource_pressure', 'crisis_watch'],
    linkedStoryChainKinds: ['route_pressure_chain'],
    maxConsecutiveUseDays: 1,
    maintenanceWindowKinds: ['field_recovery', 'emergency_repair_watch'],
  },
  {
    groupId: 'backup_fleet',
    label: 'Backup Fleet',
    playerLabel: 'Yedek destek hattı',
    linkedDomains: ['resource_pressure', 'resource_recovery', 'backup_support'],
    linkedDistricts: ['merkez', 'sanayi', 'istasyon', 'cumhuriyet', 'yesilvadi'],
    linkedArchiveKinds: ['resource_recovery', 'route_balanced'],
    linkedStoryChainKinds: ['resource_fatigue_chain'],
    maxConsecutiveUseDays: 1,
    maintenanceWindowKinds: ['route_reset', 'light_check'],
  },
];

export const VEHICLE_MAINTENANCE_SCORE_CONTRIBUTIONS: VehicleMaintenanceScoreContribution[] = [
  { sourceId: 'consecutive_use_streak', weight: 10, description: '+10 per day after day 1 consecutive use' },
  { sourceId: 'vehicle_route_domain_event', weight: 15, description: 'vehicle_route pressure +15' },
  { sourceId: 'resource_pressure_archive', weight: 12, description: 'resource_pressure +12' },
  { sourceId: 'assignment_vehicle_group', weight: 10, description: 'poor assignment fit +10' },
  { sourceId: 'route_balanced_archive', weight: -8, description: 'route_balanced positive -8' },
  { sourceId: 'operation_signals_vehicle', weight: 12, description: 'operationSignals.vehicle strained/critical +12' },
  { sourceId: 'resource_fatigue', weight: 12, description: 'operational resource fatigue +12' },
  { sourceId: 'backup_fleet_overuse', weight: 10, description: 'backup used too often +10' },
  { sourceId: 'crisis_adjacent_field_response', weight: 8, description: 'crisis adjacent field response +8' },
  { sourceId: 'content_pack_vehicle_route', weight: 10, description: 'pack-origin vehicle_route event +10' },
  { sourceId: 'content_pack_resource_pressure', weight: 8, description: 'pack-origin resource_pressure +8' },
  { sourceId: 'story_chain_route_pressure', weight: 10, description: 'active route_pressure_chain +10' },
  { sourceId: 'story_chain_resource_fatigue', weight: 10, description: 'active resource_fatigue_chain +10' },
];

export const VEHICLE_MAINTENANCE_WINDOW_RULES = [
  'day_1_3_hidden_or_tutorial_safe',
  'day_4_7_passive_hint_only_no_decision',
  'day_8_plus_suggestion_visible',
  'condition_watch_or_strained_suggests_window',
  'maintenance_due_hub_report_line',
  'critical_increases_risk_no_panic_copy',
  'max_2_maintenance_windows_suggested_per_day',
  'no_consecutive_spam_same_fleet_group',
  'maintenance_suggestion_does_not_break_event_caps',
  'skipped_maintenance_increases_fatigue_risk',
  'completed_maintenance_reduces_need_score_by_20',
] as const;

export const VEHICLE_MAINTENANCE_ASSIGNMENT_INTEGRATION_RULES = [
  'assignment_vehicle_group_selection_feeds_fatigue',
  'poor_fit_plus_heavy_route_increases_need_score',
  'good_fit_plus_balanced_route_reduces_fatigue',
  'field_response_consecutive_use_increases_fatigue',
  'backup_fleet_overuse_reduces_availability',
  'assignment_ui_unchanged_in_v1_planning',
  'assignment_scoring_unchanged_in_v1_planning',
] as const;

export const VEHICLE_MAINTENANCE_ARCHIVE_INTEGRATION_RULES = [
  'recommend_vehicle_maintenance_suggested_kind',
  'recommend_vehicle_maintenance_completed_kind',
  'recommend_vehicle_fatigue_warning_kind',
  'recommend_fleet_recovered_kind',
  'no_archive_kind_added_in_planning_pass',
  'no_raw_vehicle_metadata_stored',
  'duplicate_key_required',
  'player_facing_short_deterministic_copy',
] as const;

export const VEHICLE_MAINTENANCE_STORY_CHAIN_RULES = [
  'high_vehicle_fatigue_can_start_or_advance_route_pressure_chain',
  'maintenance_completed_softens_or_closes_chain',
  'resource_fatigue_chain_active_strengthens_window_suggestion',
  'story_chain_spam_guard_preserved',
  'no_same_day_double_chain_advance_from_maintenance',
] as const;

export const VEHICLE_MAINTENANCE_CONTENT_PACK_RULES = [
  'vehicle_route_pack_events_feed_maintenance_need_score',
  'resource_pressure_events_feed_fatigue',
  'reward_comeback_route_balance_reduces_fatigue',
  'content_pack_stage2_max3_requires_maintenance_guard_first',
  'no_runtime_injection_change_in_planning_pass',
] as const;

export const VEHICLE_MAINTENANCE_SURFACE_DENSITY_RULES = [
  'hub_max_1_maintenance_line_day8_plus',
  'report_max_1_maintenance_trace_line',
  'map_resource_marker_breathe_compatible',
  'map_motion_v1_unchanged',
  'no_duplicate_with_main_operation_feel',
  'no_duplicate_with_story_chain_line',
  'no_duplicate_with_city_journal',
  'assignment_preview_future_only_no_ui_change',
] as const;

export const VEHICLE_MAINTENANCE_DAY_SAFETY_PLANS: VehicleMaintenanceDaySafetyPlan[] = [
  { dayRange: '1', maintenanceUiVisibility: 'hidden', windowSuggestionAllowed: false, hubLineMax: 0, reportLineMax: 0, mapHintAllowed: false },
  { dayRange: '2-3', maintenanceUiVisibility: 'hidden', windowSuggestionAllowed: false, hubLineMax: 0, reportLineMax: 0, mapHintAllowed: false },
  { dayRange: '4-7', maintenanceUiVisibility: 'passive_hint', windowSuggestionAllowed: false, hubLineMax: 0, reportLineMax: 0, mapHintAllowed: false },
  { dayRange: '8-9', maintenanceUiVisibility: 'suggested', windowSuggestionAllowed: true, hubLineMax: 1, reportLineMax: 1, mapHintAllowed: true },
  { dayRange: '10+', maintenanceUiVisibility: 'visible', windowSuggestionAllowed: true, hubLineMax: 1, reportLineMax: 1, mapHintAllowed: true },
];

export const VEHICLE_MAINTENANCE_SURFACE_PLANS: VehicleMaintenanceSurfacePlan[] = [
  {
    surface: 'hub',
    maxLinesPerDay: 1,
    priorityBelow: ['story_chain', 'main_operation_feel', 'city_journal'],
    exampleLine: 'Araç hattı: Rota destek ekibi yarın hafif bakım penceresi istiyor.',
    forbiddenTerms: ['fleet id', 'maintenance runtime', 'premium'],
  },
  {
    surface: 'report',
    maxLinesPerDay: 1,
    priorityBelow: ['story_chain', 'report_continuity', 'reward_comeback'],
    exampleLine: 'Araç bakım izi: Sanayi rota desteğinde yorgunluk izleniyor.',
    forbiddenTerms: ['plaka', 'gps', 'metadata'],
  },
  {
    surface: 'map',
    maxLinesPerDay: 1,
    priorityBelow: ['story_chain_step', 'comeback_completed', 'journal_trace'],
    exampleLine: 'Sanayi hattında rota desteği yorgunluk sinyali veriyor.',
    forbiddenTerms: ['canlı takip', 'live tracking'],
  },
  {
    surface: 'assignment_preview',
    maxLinesPerDay: 0,
    priorityBelow: [],
    exampleLine: 'Bu araç grubu üst üste kullanıldı, yarın bakım baskısı artabilir.',
    forbiddenTerms: ['kilitli', 'premium'],
  },
  {
    surface: 'city_journal',
    maxLinesPerDay: 1,
    priorityBelow: ['story_chain_step', 'main_operation_started'],
    exampleLine: 'Rota destek ekibi bakım penceresi tamamlandı.',
    forbiddenTerms: ['vehicleMaintenance', 'runtime'],
  },
];

export const VEHICLE_MAINTENANCE_ARCHIVE_ENTRY_RECOMMENDATIONS: VehicleMaintenanceArchiveEntryRecommendation[] =
  [
    {
      kind: 'vehicle_maintenance_suggested',
      purpose: 'Suggested maintenance window recorded for continuity',
      duplicateKeyPattern: 'vehicle_maintenance_suggested:{groupId}:{day}',
      playerFacing: true,
      storeRawMetadata: false,
    },
    {
      kind: 'vehicle_maintenance_completed',
      purpose: 'Completed maintenance softens fatigue and may close story chain',
      duplicateKeyPattern: 'vehicle_maintenance_completed:{groupId}:{day}',
      playerFacing: true,
      storeRawMetadata: false,
    },
    {
      kind: 'vehicle_fatigue_warning',
      purpose: 'High fatigue band without panic copy',
      duplicateKeyPattern: 'vehicle_fatigue_warning:{groupId}:{day}',
      playerFacing: true,
      storeRawMetadata: false,
    },
    {
      kind: 'fleet_recovered',
      purpose: 'Post-maintenance recovery signal',
      duplicateKeyPattern: 'fleet_recovered:{groupId}:{day}',
      playerFacing: true,
      storeRawMetadata: false,
    },
  ];

export const VEHICLE_MAINTENANCE_MIGRATION_PLAN: VehicleMaintenanceMigrationPlan = {
  targetSaveVersion: 25,
  currentSaveVersion: 24,
  steps: [
    'v24 save without vehicleMaintenance -> create initial VehicleMaintenanceStateV1',
    'day <= 7 -> hidden/passive default bands (stable/low/ready)',
    'day >= 8 -> derive fleet condition from operationSignals, resource fatigue, cityArchive route_balanced/resource_pressure',
    'missing/corrupt cityArchive -> safe default stable bands',
    'no duplicate maintenance windows on re-migrate',
    'missing assignment/resource signals -> skip derivation, use safe default',
  ],
  day7Default: 'All fleet groups stable/low/ready; no visible windows',
  day8Derivation: [
    'operationSignals.vehicles strained -> route_support watch',
    'resource fatigue tired/strained -> fatigueBand moderate/high',
    'archive route_balanced last 3 days -> route_support maintenanceNeedScore -8',
    'archive resource_pressure -> route_support/backup_fleet +12',
    'active story_chain route_pressure -> route_support watch',
  ],
  safeFallback: 'Empty fleetGroups with stable defaults; maintenanceWindows=[]',
  idempotent: true,
};

export const VEHICLE_MAINTENANCE_IMPLEMENTATION_SCOPE: VehicleMaintenanceImplementationScope = {
  stage: 'Vehicle Maintenance Runtime V1 Implementation',
  included: [
    'SAVE_VERSION 25',
    'persisted vehicleMaintenance state',
    'v24 -> v25 migration',
    'day-close fatigue update',
    'maintenance window suggestion engine',
    'Hub/Report compact line (max 1 each)',
    'Map resource marker hint integration',
    'City Archive maintenance entry kinds (future)',
    'fleet group model only — no individual vehicle list',
  ],
  notIncluded: [
    'individual personnel/vehicle system',
    'garage management screen',
    'upgrade economy',
    'paid maintenance boost',
    'AI suggestions',
    'live ops / remote config',
    'new route or detail screen',
    'real-time GPS tracking',
  ],
};

export const VEHICLE_MAINTENANCE_RUNTIME_UNCHANGED_FILES = [
  'src/core/game/applyDecision.ts',
  'src/core/dayPipeline/dayPipelineOrchestrator.ts',
  'src/core/game/generateDailyEventSet.ts',
  'src/core/postPilot/postPilotEventEngine.ts',
  'src/core/contentRuntimeActivation/contentRuntimeActivationIntegration.ts',
] as const;

export const VEHICLE_MAINTENANCE_PLANNING_DISTRICTS: readonly MapDistrictId[] = [
  'merkez',
  'cumhuriyet',
  'sanayi',
  'istasyon',
  'yesilvadi',
] as const;

export const VEHICLE_MAINTENANCE_MAINTENANCE_NEED_SCORE_MAX = 100;

export const VEHICLE_MAINTENANCE_COMPLETED_WINDOW_SCORE_REDUCTION = 20;
