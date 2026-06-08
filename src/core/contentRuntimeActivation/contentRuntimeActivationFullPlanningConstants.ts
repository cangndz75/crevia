import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

import type {
  ContentPackFullDayCapPlan,
  ContentPackFullDomainPlan,
  ContentPackFullGroupPlan,
  ContentPackFullImplementationScope,
} from './contentRuntimeActivationFullPlanningTypes';

export const CONTENT_PACK_FULL_PLANNING_DOCS_PATH =
  'docs/crevia-content-pack-activation-full-planning.md';

export const CONTENT_PACK_FULL_TARGET_SAVE_VERSION = 24;

export const CONTENT_PACK_FULL_DISTRICTS: readonly MapDistrictId[] = [
  'merkez',
  'cumhuriyet',
  'sanayi',
  'istasyon',
  'yesilvadi',
] as const;

export const CONTENT_PACK_FULL_SEMANTIC_CLUSTERS = [
  'toparlanma',
  'rota',
  'konteyner',
  'güven',
  'risk',
  'ana operasyon',
  'personel morali',
  'araç yorgunluğu',
  'sosyal teşekkür',
  'çevre baskısı',
] as const;

export const CONTENT_PACK_FULL_FORBIDDEN_PLAYER_TERMS = [
  'pack',
  'metadata',
  'runtime',
  'premium',
  'kilitli',
  'gps',
  'quest',
  'mission',
  'openai',
  ' ai ',
  'remote config',
  'live-ops',
  'live ops',
] as const;

export const CONTENT_PACK_FULL_ARCHIVE_NOT_STORED = [
  'raw_pack_metadata',
  'pack_name_player_facing',
  'contentPackMeta_raw',
  'variant_body_dump',
  'family_template_dump',
] as const;

export const CONTENT_PACK_FULL_ACTIVATION_PHASES = [
  {
    id: 'phase_0_lite',
    label: 'Current Lite',
    day8LightMax: 1,
    day8FullMax: 2,
    pilotProtected: true,
    runtimeOpen: true,
  },
  {
    id: 'phase_1_expanded_safe',
    label: 'Expanded post-pilot safe',
    day8LightMax: 1,
    day8FullMax: 2,
    day10LightMax: 1,
    storyArchiveCap: true,
    safeDomainsOnly: true,
    runtimeOpen: false,
  },
  {
    id: 'phase_2_full_main_operation',
    label: 'Full main operation',
    minDay: 10,
    accessMode: 'main_operation_full',
    maxPackOriginPerDay: 3,
    crisisAdjacentLimited: true,
    runtimeOpen: false,
  },
  {
    id: 'phase_3_future',
    label: 'Future V1.1/V2',
    seasonal: true,
    remoteConfig: true,
    runtimeOpen: false,
  },
] as const;

export const CONTENT_PACK_FULL_GROUP_PLANS: ContentPackFullGroupPlan[] = [
  {
    groupId: 'district_pack',
    activationPhase: 'phase_1_expanded_safe',
    allowedDays: '8+',
    allowedAccessMode: ['post_pilot_light', 'main_operation_full'],
    maxPerDay: 1,
    maxPerWeekWindow: 4,
    districtCoverage: ['merkez', 'cumhuriyet', 'sanayi', 'istasyon', 'yesilvadi'],
    storyChainTriggerRisk: 'medium',
    archiveEntryRisk: 'medium',
    reportDensityRisk: 'low',
    socialDensityRisk: 'low',
    readinessStatus: 'ready_for_limited_full',
  },
  {
    groupId: 'vehicle_route_pack',
    activationPhase: 'phase_1_expanded_safe',
    allowedDays: '8+',
    allowedAccessMode: ['post_pilot_light', 'main_operation_full'],
    maxPerDay: 1,
    maxPerWeekWindow: 4,
    districtCoverage: ['sanayi', 'istasyon', 'merkez'],
    storyChainTriggerRisk: 'medium',
    archiveEntryRisk: 'medium',
    reportDensityRisk: 'medium',
    socialDensityRisk: 'low',
    readinessStatus: 'ready_for_limited_full',
  },
  {
    groupId: 'container_environment_pack',
    activationPhase: 'phase_1_expanded_safe',
    allowedDays: '8+',
    allowedAccessMode: ['post_pilot_light', 'main_operation_full'],
    maxPerDay: 1,
    maxPerWeekWindow: 4,
    districtCoverage: ['cumhuriyet', 'yesilvadi', 'merkez'],
    storyChainTriggerRisk: 'medium',
    archiveEntryRisk: 'medium',
    reportDensityRisk: 'low',
    socialDensityRisk: 'low',
    readinessStatus: 'ready_for_limited_full',
  },
  {
    groupId: 'personnel_morale_pack',
    activationPhase: 'phase_2_full_main_operation',
    allowedDays: '10+',
    allowedAccessMode: ['main_operation_full'],
    maxPerDay: 1,
    maxPerWeekWindow: 3,
    districtCoverage: ['merkez', 'sanayi', 'istasyon'],
    storyChainTriggerRisk: 'high',
    archiveEntryRisk: 'medium',
    reportDensityRisk: 'medium',
    socialDensityRisk: 'low',
    readinessStatus: 'risky',
    blockerReason: 'Requires resource_pressure rate limit + Day 10+',
  },
  {
    groupId: 'social_trust_pack',
    activationPhase: 'phase_1_expanded_safe',
    allowedDays: '8+',
    allowedAccessMode: ['post_pilot_light', 'main_operation_full'],
    maxPerDay: 1,
    maxPerWeekWindow: 5,
    districtCoverage: ['cumhuriyet', 'merkez', 'yesilvadi'],
    storyChainTriggerRisk: 'low',
    archiveEntryRisk: 'low',
    reportDensityRisk: 'low',
    socialDensityRisk: 'medium',
    readinessStatus: 'ready_for_limited_full',
  },
  {
    groupId: 'crisis_adjacent_pack',
    activationPhase: 'phase_2_full_main_operation',
    allowedDays: '10+',
    allowedAccessMode: ['main_operation_full'],
    maxPerDay: 1,
    maxPerWeekWindow: 1,
    districtCoverage: ['sanayi', 'istasyon'],
    storyChainTriggerRisk: 'high',
    archiveEntryRisk: 'high',
    reportDensityRisk: 'high',
    socialDensityRisk: 'medium',
    readinessStatus: 'blocked',
    blockerReason: 'Max 1 per 3 days; no panic chain spam',
  },
  {
    groupId: 'reward_comeback_pack',
    activationPhase: 'phase_1_expanded_safe',
    allowedDays: '8+',
    allowedAccessMode: ['post_pilot_light', 'main_operation_full'],
    maxPerDay: 1,
    maxPerWeekWindow: 3,
    districtCoverage: ['merkez', 'cumhuriyet', 'sanayi', 'istasyon', 'yesilvadi'],
    storyChainTriggerRisk: 'low',
    archiveEntryRisk: 'medium',
    reportDensityRisk: 'medium',
    socialDensityRisk: 'low',
    readinessStatus: 'ready_for_limited_full',
  },
  {
    groupId: 'operation_followup_pack',
    activationPhase: 'phase_2_full_main_operation',
    allowedDays: '10+',
    allowedAccessMode: ['main_operation_full'],
    maxPerDay: 1,
    maxPerWeekWindow: 4,
    districtCoverage: ['sanayi', 'istasyon', 'merkez'],
    storyChainTriggerRisk: 'medium',
    archiveEntryRisk: 'medium',
    reportDensityRisk: 'medium',
    socialDensityRisk: 'low',
    readinessStatus: 'risky',
    blockerReason: 'Prefer advance existing story chain over new start',
  },
];

export const CONTENT_PACK_FULL_DOMAIN_PLANS: ContentPackFullDomainPlan[] = [
  { domainId: 'district_balance', activationPhase: 'phase_1_expanded_safe', maxPerDay: 1, maxPerWindowDays: 2, maxPerWindowCount: 2, semanticCluster: 'güven', freshnessCooldownDays: 2 },
  { domainId: 'vehicle_route', activationPhase: 'phase_1_expanded_safe', maxPerDay: 1, maxPerWindowDays: 3, maxPerWindowCount: 2, semanticCluster: 'rota', freshnessCooldownDays: 3 },
  { domainId: 'container_environment', activationPhase: 'phase_1_expanded_safe', maxPerDay: 1, maxPerWindowDays: 3, maxPerWindowCount: 2, semanticCluster: 'konteyner', freshnessCooldownDays: 3 },
  { domainId: 'personnel_morale', activationPhase: 'phase_2_full_main_operation', maxPerDay: 1, maxPerWindowDays: 2, maxPerWindowCount: 1, semanticCluster: 'personel morali', freshnessCooldownDays: 2 },
  { domainId: 'social_trust', activationPhase: 'phase_1_expanded_safe', maxPerDay: 1, maxPerWindowDays: 1, maxPerWindowCount: 1, semanticCluster: 'sosyal teşekkür', freshnessCooldownDays: 2 },
  { domainId: 'crisis_adjacent', activationPhase: 'phase_2_full_main_operation', maxPerDay: 1, maxPerWindowDays: 3, maxPerWindowCount: 1, semanticCluster: 'risk', freshnessCooldownDays: 3 },
  { domainId: 'reward_positive', activationPhase: 'phase_1_expanded_safe', maxPerDay: 1, maxPerWindowDays: 1, maxPerWindowCount: 1, semanticCluster: 'toparlanma', freshnessCooldownDays: 2 },
  { domainId: 'comeback_recovery', activationPhase: 'phase_1_expanded_safe', maxPerDay: 1, maxPerWindowDays: 2, maxPerWindowCount: 1, semanticCluster: 'toparlanma', freshnessCooldownDays: 2 },
  { domainId: 'operation_followup', activationPhase: 'phase_2_full_main_operation', maxPerDay: 1, maxPerWindowDays: 2, maxPerWindowCount: 2, semanticCluster: 'ana operasyon', freshnessCooldownDays: 2 },
  { domainId: 'resource_pressure', activationPhase: 'phase_2_full_main_operation', maxPerDay: 1, maxPerWindowDays: 2, maxPerWindowCount: 1, semanticCluster: 'araç yorgunluğu', freshnessCooldownDays: 2 },
];

export const CONTENT_PACK_FULL_DAY_CAP_PLANS: ContentPackFullDayCapPlan[] = [
  { dayRange: '1', accessMode: 'pilot_day1', packOriginEventsMax: 0, archiveEntriesFromPackMax: 0, storyChainTriggersMax: 0, reportPackEchoMax: 0, socialEnrichmentExtraCount: 0 },
  { dayRange: '2-7', accessMode: 'pilot_day2_7', packOriginEventsMax: 0, archiveEntriesFromPackMax: 0, storyChainTriggersMax: 0, reportPackEchoMax: 0, socialEnrichmentExtraCount: 0 },
  { dayRange: '8-9', accessMode: 'post_pilot_light', packOriginEventsMax: 1, archiveEntriesFromPackMax: 1, storyChainTriggersMax: 1, reportPackEchoMax: 1, socialEnrichmentExtraCount: 0 },
  { dayRange: '10+', accessMode: 'post_pilot_light', packOriginEventsMax: 1, archiveEntriesFromPackMax: 1, storyChainTriggersMax: 1, reportPackEchoMax: 1, socialEnrichmentExtraCount: 0 },
  { dayRange: '8+', accessMode: 'main_operation_full', packOriginEventsMax: 2, archiveEntriesFromPackMax: 2, storyChainTriggersMax: 1, reportPackEchoMax: 1, socialEnrichmentExtraCount: 0 },
];

export const CONTENT_PACK_FULL_DISTRICT_BALANCE_RULES = [
  'same_district_max_2_pack_events_per_2_day_window',
  'same_domain_not_same_district_same_day',
  'active_story_chain_prefers_closure_over_new_pressure',
  'underrepresented_district_mild_priority_not_forced',
  'day8_main_operation_no_sanayi_istasyon_only_focus',
  'yesilvadi_environmental_not_repetitive',
] as const;

export const CONTENT_PACK_FULL_FRESHNESS_RULES = [
  'same_event_family_not_within_3_days',
  'same_district_domain_not_same_day',
  'same_copy_cluster_not_within_2_days',
  'same_story_chain_kind_not_repeated_start',
  'same_archive_semantic_cluster_no_duplicate_lines',
] as const;

export const CONTENT_PACK_FULL_ARCHIVE_SPAM_RULES = [
  'pack_origin_archive_max_2_per_day',
  'day8_light_max_1_per_day',
  'story_chain_step_today_lowers_pack_archive_priority',
  'district_report_same_cluster_compact_or_suppress',
  'reward_not_duplicate_story_closure',
  'low_priority_pack_entries_prune_first',
  'no_raw_pack_metadata_stored',
  'cityArchive_maxEntries_120_unchanged',
] as const;

export const CONTENT_PACK_FULL_STORY_CHAIN_TRIGGER_RULES = [
  'pack_start_min_day_4_pilot_derived_or_8_full',
  'no_same_district_kind_active_chain',
  'max_1_pack_origin_story_start_per_day',
  'active_chain_count_below_cap',
  'prefer_advance_existing_over_new_start',
  'reward_comeback_closes_not_starts_pressure',
  'crisis_adjacent_no_panic_chain_spam',
] as const;

export const CONTENT_PACK_FULL_SURFACE_DENSITY_RULES = [
  'report_pack_continuity_max_1',
  'report_story_visible_pack_suppress_duplicate',
  'report_day8_max_2_continuity',
  'hub_pack_supporting_max_1',
  'hub_active_story_suppress_pack_unless_closure',
  'map_journal_trace_max_1_pack_lower_than_story',
  'social_pack_enriches_slot_no_extra_mention_count',
  'social_max_1_pack_enrichment_per_day',
] as const;

export const CONTENT_PACK_FULL_IMPLEMENTATION_SCOPE: ContentPackFullImplementationScope = {
  stage: 'Content Pack Activation Full Implementation Aşama 1',
  included: [
    'Day 8+ full access max 2 pack-origin events',
    'Light mode cap preserved',
    'crisis_adjacent still limited',
    'pack-origin archive max 1-2',
    'story chain trigger max 1/day',
    'social enrichment slot reuse',
    'no pilot Day 1-7 full injection',
  ],
  notIncluded: [
    'Remote config',
    'Live ops',
    'Seasonal pack',
    'AI event generation',
    'New event screen',
    'Content editor/admin dashboard',
  ],
};

export const CONTENT_PACK_FULL_RUNTIME_UNCHANGED_FILES = [
  'src/core/contentRuntimeActivation/contentRuntimeActivationIntegration.ts',
  'src/core/postPilot/postPilotEventEngine.ts',
  'src/core/game/applyDecision.ts',
  'src/store/gamePersist.ts',
] as const;
