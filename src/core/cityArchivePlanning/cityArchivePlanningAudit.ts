import {
  CITY_ARCHIVE_BACKFILL_RULES,
  CITY_ARCHIVE_BACKFILL_SOURCE_PRIORITY,
  CITY_ARCHIVE_CREATED_FROM_SOURCES,
  CITY_ARCHIVE_ENTRY_KINDS,
  CITY_ARCHIVE_IDEMPOTENCY_GUARDS,
  CITY_ARCHIVE_INTEGRATION_PLAN,
  CITY_ARCHIVE_MIGRATION_PLAN,
  CITY_ARCHIVE_NOT_STORED_DATA,
  CITY_ARCHIVE_PRUNING_PLAN,
  CITY_ARCHIVE_RECOMMENDED_WRITE_TIMING,
  CITY_ARCHIVE_STORED_DATA,
  CITY_ARCHIVE_TARGET_SAVE_VERSION,
} from './cityArchivePlanningConstants';
import type { CityArchivePlanningAuditCheck, CityArchivePlanningAuditResult } from './cityArchivePlanningTypes';

function check(condition: boolean, id: string, message: string): CityArchivePlanningAuditCheck {
  return {
    id,
    status: condition ? 'PASS' : 'FAIL',
    message,
  };
}

export function runCityArchivePlanningAudit(): CityArchivePlanningAuditResult {
  const checks: CityArchivePlanningAuditCheck[] = [
    check(CITY_ARCHIVE_TARGET_SAVE_VERSION === 24, 'migration.target_v24', 'City Archive implementation target is SAVE_VERSION 24.'),
    check(CITY_ARCHIVE_ENTRY_KINDS.length >= 12, 'model.entry_kinds', 'Entry kind set covers at least 12 archive moments.'),
    check(
      CITY_ARCHIVE_CREATED_FROM_SOURCES.includes('decisionImpact') &&
        CITY_ARCHIVE_CREATED_FROM_SOURCES.includes('storyChain'),
      'model.created_from_sources',
      'Archive sources include current derived systems and future story chain usage.',
    ),
    check(CITY_ARCHIVE_STORED_DATA.includes('duplicate_key'), 'data.stored_duplicate_key', 'Duplicate key is stored.'),
    check(CITY_ARCHIVE_NOT_STORED_DATA.includes('pii'), 'data.no_pii', 'PII is explicitly excluded.'),
    check(CITY_ARCHIVE_NOT_STORED_DATA.includes('gps_or_location'), 'data.no_gps', 'GPS/location is explicitly excluded.'),
    check(
      CITY_ARCHIVE_NOT_STORED_DATA.includes('raw_event_body_dump') &&
        CITY_ARCHIVE_NOT_STORED_DATA.includes('full_raw_save_copy'),
      'data.no_raw_dump',
      'Raw event body and full save dumps are explicitly excluded.',
    ),
    check(CITY_ARCHIVE_MIGRATION_PLAN.length >= 7, 'migration.plan_complete', 'V24 migration plan is enumerated.'),
    check(
      CITY_ARCHIVE_MIGRATION_PLAN.includes('migration_idempotent_no_duplicate_entries'),
      'migration.idempotent',
      'Migration idempotency is required.',
    ),
    check(CITY_ARCHIVE_BACKFILL_SOURCE_PRIORITY.length >= 8, 'backfill.priority_sources', 'Backfill source priority is defined.'),
    check(CITY_ARCHIVE_BACKFILL_RULES.maxEntries === 3, 'backfill.max_three', 'Backfill is capped at 3 entries.'),
    check(!CITY_ARCHIVE_BACKFILL_RULES.day1HeavyArchive, 'backfill.day1_light', 'Day 1 does not create heavy archive.'),
    check(CITY_ARCHIVE_PRUNING_PLAN.maxEntries === 120, 'pruning.max_entries', 'Archive maxEntries default is 120.'),
    check(CITY_ARCHIVE_PRUNING_PLAN.maxEntriesPerDistrict === 20, 'pruning.max_per_district', 'Per-district cap is 20.'),
    check(CITY_ARCHIVE_PRUNING_PLAN.keepLastNDaysDetailed === 10, 'pruning.keep_days', 'Detailed window keeps 10 days.'),
    check(
      CITY_ARCHIVE_PRUNING_PLAN.preserveStoryChainUnresolved &&
        CITY_ARCHIVE_PRUNING_PLAN.preserveMainOperationMilestones &&
        CITY_ARCHIVE_PRUNING_PLAN.preservePositiveComebackImportantEntries,
      'pruning.preserve_important',
      'Important archive entries are protected from first-pass pruning.',
    ),
    check(CITY_ARCHIVE_INTEGRATION_PLAN.length >= 7, 'integration.plan_complete', 'Integration readiness plan covers main consumers.'),
    check(
      CITY_ARCHIVE_INTEGRATION_PLAN.includes('cityJournal_archive_backed_with_derived_fallback'),
      'integration.city_journal',
      'City Journal fallback plan is present.',
    ),
    check(
      CITY_ARCHIVE_INTEGRATION_PLAN.includes('map_journal_trace_can_read_recent_archive_entries'),
      'integration.map_trace',
      'Map journal trace plan is present.',
    ),
    check(
      CITY_ARCHIVE_RECOMMENDED_WRITE_TIMING === 'after_end_current_day_report_close',
      'write_timing.report_close',
      'Recommended persistent write timing is after end-current-day report close.',
    ),
    check(CITY_ARCHIVE_IDEMPOTENCY_GUARDS.length >= 8, 'idempotency.guards_complete', 'Idempotency guard set is complete.'),
    check(
      CITY_ARCHIVE_IDEMPOTENCY_GUARDS.includes('day_8_main_operation_started_once'),
      'idempotency.day8_once',
      'Day 8 main operation archive marker is once-only.',
    ),
  ];

  const targetModelReady = checks
    .filter((item) => item.id.startsWith('model.') || item.id.startsWith('data.'))
    .every((item) => item.status === 'PASS');
  const migrationPlanReady = checks
    .filter((item) => item.id.startsWith('migration.') || item.id.startsWith('backfill.') || item.id.startsWith('pruning.'))
    .every((item) => item.status === 'PASS');
  const integrationPlanReady = checks
    .filter((item) => item.id.startsWith('integration.') || item.id.startsWith('write_timing.') || item.id.startsWith('idempotency.'))
    .every((item) => item.status === 'PASS');
  const safetyReady = checks
    .filter((item) => item.id.startsWith('data.') || item.id.startsWith('idempotency.'))
    .every((item) => item.status === 'PASS');

  return {
    ok: checks.every((item) => item.status !== 'FAIL'),
    targetModelReady,
    migrationPlanReady,
    integrationPlanReady,
    safetyReady,
    checks,
  };
}
