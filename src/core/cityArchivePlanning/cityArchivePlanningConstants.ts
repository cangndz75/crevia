import type {
  CityArchiveBackfillSource,
  CityArchiveEntryKind,
  CityArchiveEntrySourceKind,
  CityArchiveWriteTimingOption,
} from './cityArchivePlanningTypes';

export const CITY_ARCHIVE_PLANNING_DOCS_PATH = 'docs/crevia-city-archive-persistence-planning.md';
export const CITY_ARCHIVE_TARGET_SAVE_VERSION = 24;
export const CITY_ARCHIVE_CURRENT_SAVE_VERSION = 24;

export const CITY_ARCHIVE_ENTRY_KINDS: CityArchiveEntryKind[] = [
  'decision_record',
  'district_shift',
  'trust_recovery',
  'route_balanced',
  'container_relief',
  'resource_pressure',
  'resource_recovery',
  'social_response',
  'crisis_prevented',
  'main_operation_started',
  'comeback_available',
  'comeback_completed',
  'ece_prediction_confirmed',
  'story_chain_step',
  'report_milestone',
];

export const CITY_ARCHIVE_CREATED_FROM_SOURCES: CityArchiveEntrySourceKind[] = [
  'decisionImpact',
  'cityJournal',
  'rewardComeback',
  'districtReportCard',
  'advisorRelationship',
  'storyChain',
  'operationSignals',
  'contentPackMeta',
  'manualFallback',
];

export const CITY_ARCHIVE_STORED_DATA = [
  'day_number',
  'district_reference',
  'event_decision_reference',
  'short_deterministic_copy',
  'kind_domain_source',
  'duplicate_key',
  'trend_bands',
  'summary_pointers',
  'player_facing_short_lines',
] as const;

export const CITY_ARCHIVE_NOT_STORED_DATA = [
  'raw_event_body_dump',
  'full_raw_save_copy',
  'pii',
  'gps_or_location',
  'store_payment_raw_data',
  'analytics_raw_events',
  'debug_only_fields',
  'long_generated_text',
  'ai_raw_prompt_response',
] as const;

export const CITY_ARCHIVE_BACKFILL_SOURCE_PRIORITY: CityArchiveBackfillSource[] = [
  'city_day_last_daily_report',
  'decision_history',
  'city_journal_lite',
  'reward_comeback',
  'district_report_card',
  'main_operation_feel',
  'carry_over_memory',
  'fallback_archive_started',
];

export const CITY_ARCHIVE_MIGRATION_PLAN = [
  'existing_saves_without_archive_initialize_empty',
  'day_1_3_create_no_heavy_archive',
  'day_4_plus_backfill_minimal_recent_signals',
  'day_8_plus_main_operation_started_once_when_applicable',
  'corrupt_archive_fallback_empty_with_warning',
  'migration_idempotent_no_duplicate_entries',
  'no_crash_on_missing_district_memory_trust_or_content_pack_meta',
] as const;

export const CITY_ARCHIVE_BACKFILL_RULES = {
  maxEntries: 3,
  day1HeavyArchive: false,
  deterministicCopyOnly: true,
  duplicateKeyRequired: true,
} as const;

export const CITY_ARCHIVE_PRUNING_PLAN = {
  maxEntries: 120,
  maxEntriesRationale: '120 keeps roughly two weeks of meaningful moments while staying small for persisted saves.',
  maxEntriesPerDistrict: 20,
  keepLastNDaysDetailed: 10,
  preserveStoryChainUnresolved: true,
  preserveMainOperationMilestones: true,
  preservePositiveComebackImportantEntries: true,
  pruneLowPriorityFallbackFirst: true,
} as const;

export const CITY_ARCHIVE_INTEGRATION_PLAN = [
  'cityJournal_archive_backed_with_derived_fallback',
  'districtReportCard_full_reads_last_three_archive_events',
  'advisorRelationship_uses_previous_decision_archive_reference',
  'rewardComeback_uses_recent_positive_and_completed_comeback_entries',
  'storyChainPersistentRuntime_writes_chain_step_entries_later',
  'report_day_close_can_append_archive_entries',
  'map_journal_trace_can_read_recent_archive_entries',
] as const;

export const CITY_ARCHIVE_WRITE_TIMING_OPTIONS: CityArchiveWriteTimingOption[] = [
  'after_apply_decision',
  'after_end_current_day_report_close',
  'post_day_refresh',
];

export const CITY_ARCHIVE_RECOMMENDED_WRITE_TIMING: CityArchiveWriteTimingOption =
  'after_end_current_day_report_close';

export const CITY_ARCHIVE_IDEMPOTENCY_GUARDS = [
  'same_duplicate_key_once',
  'same_day_same_event_same_kind_once',
  'migration_rerun_no_duplicates',
  'report_reopen_no_duplicates',
  'app_resume_no_duplicates',
  'day_8_main_operation_started_once',
  'story_chain_step_once_per_chain_step',
  'reward_comeback_completed_once',
] as const;

export const CITY_ARCHIVE_PROTECTED_FILES = [
  'src/store/gamePersist.ts',
  'src/core/game/applyDecision.ts',
  'src/core/dayPipeline/dayPipelineOrchestrator.ts',
  'src/core/game/ensureDailyEventsForDay.ts',
  'src/core/game/generateDailyEventSet.ts',
] as const;
