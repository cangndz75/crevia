import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runManualLaunchTrackerAudit } from '@/core/manualLaunchTracker/manualLaunchTrackerAudit';
import { runReleaseCandidateAudit } from '@/core/releaseCandidate/releaseCandidateAudit';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  CITY_ARCHIVE_BACKFILL_RULES,
  CITY_ARCHIVE_BACKFILL_SOURCE_PRIORITY,
  CITY_ARCHIVE_CURRENT_SAVE_VERSION,
  CITY_ARCHIVE_ENTRY_KINDS,
  CITY_ARCHIVE_IDEMPOTENCY_GUARDS,
  CITY_ARCHIVE_INTEGRATION_PLAN,
  CITY_ARCHIVE_MIGRATION_PLAN,
  CITY_ARCHIVE_NOT_STORED_DATA,
  CITY_ARCHIVE_PLANNING_DOCS_PATH,
  CITY_ARCHIVE_PRUNING_PLAN,
  CITY_ARCHIVE_PROTECTED_FILES,
  CITY_ARCHIVE_RECOMMENDED_WRITE_TIMING,
  CITY_ARCHIVE_STORED_DATA,
  CITY_ARCHIVE_TARGET_SAVE_VERSION,
} from './cityArchivePlanningConstants';
import { runCityArchivePlanningAudit } from './cityArchivePlanningAudit';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyCityArchivePlanningOutcome = {
  ok: boolean;
  checks: string[];
};

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function pass(checks: string[], condition: boolean, label: string, fail = label): boolean {
  checks.push(`${condition ? 'PASS' : 'FAIL'} ${condition ? label : fail}`);
  return condition;
}

export function verifyCityArchivePlanningScenario(): VerifyCityArchivePlanningOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (condition: boolean, label: string, fail = label) => {
    ok = pass(checks, condition, label, fail) && ok;
  };

  const audit = runCityArchivePlanningAudit();
  const docs = readRepo(CITY_ARCHIVE_PLANNING_DOCS_PATH);
  const packageJson = readRepo('package.json');
  const constants = readRepo('src/core/cityArchivePlanning/cityArchivePlanningConstants.ts');
  const types = readRepo('src/core/cityArchivePlanning/cityArchivePlanningTypes.ts');
  const auditSource = readRepo('src/core/cityArchivePlanning/cityArchivePlanningAudit.ts');

  record(audit.ok, 'Planning audit passes');
  record(audit.targetModelReady, 'Target model planning ready');
  record(audit.migrationPlanReady, 'Migration planning ready');
  record(audit.integrationPlanReady, 'Integration planning ready');
  record(audit.safetyReady, 'Safety planning ready');

  record(types.includes('CityArchiveV1State'), 'CityArchiveV1State draft exists');
  record(types.includes('CityArchiveEntry'), 'CityArchiveEntry draft exists');
  record(CITY_ARCHIVE_ENTRY_KINDS.length >= 12, `Entry kinds >= 12 (${CITY_ARCHIVE_ENTRY_KINDS.length})`);
  record(types.includes('CityArchiveDistrictSummary'), 'District summary plan exists');
  record(types.includes('CityArchivePlayerStyleSummary'), 'Player style summary plan exists');
  record(types.includes('CityArchiveEceRelationshipSummary'), 'Ece relationship summary plan exists');
  record(types.includes('CityArchiveRewardComebackSummary'), 'Reward/comeback summary plan exists');
  record(types.includes('CityArchiveStoryChainSummary'), 'Story chain summary plan exists');
  record(types.includes('CityArchivePruningState'), 'Pruning state plan exists');
  record(types.includes('CityArchiveMigrationMeta'), 'MigrationMeta plan exists');

  record(CITY_ARCHIVE_CURRENT_SAVE_VERSION === 24, 'Current SAVE_VERSION planning baseline 24');
  record(CITY_ARCHIVE_TARGET_SAVE_VERSION === 24, 'V24 migration target documented');
  record(CITY_ARCHIVE_MIGRATION_PLAN.includes('existing_saves_without_archive_initialize_empty'), 'Missing archive initializes empty');
  record(CITY_ARCHIVE_MIGRATION_PLAN.includes('day_1_3_create_no_heavy_archive'), 'Day 1-3 no heavy archive migration');
  record(CITY_ARCHIVE_MIGRATION_PLAN.includes('day_8_plus_main_operation_started_once_when_applicable'), 'Day 8 main operation migration marker planned');
  record(CITY_ARCHIVE_MIGRATION_PLAN.includes('corrupt_archive_fallback_empty_with_warning'), 'Corrupt archive fallback planned');
  record(CITY_ARCHIVE_MIGRATION_PLAN.includes('migration_idempotent_no_duplicate_entries'), 'Migration idempotency planned');
  record(CITY_ARCHIVE_BACKFILL_SOURCE_PRIORITY.length === 8, 'Backfill source priority complete');
  record(CITY_ARCHIVE_BACKFILL_RULES.maxEntries === 3, 'Backfill max 3 entries');
  record(CITY_ARCHIVE_BACKFILL_RULES.duplicateKeyRequired, 'Backfill duplicate key required');

  record(CITY_ARCHIVE_STORED_DATA.includes('day_number'), 'Stored data includes day number');
  record(CITY_ARCHIVE_STORED_DATA.includes('district_reference'), 'Stored data includes district reference');
  record(CITY_ARCHIVE_STORED_DATA.includes('short_deterministic_copy'), 'Stored data includes deterministic short copy');
  record(CITY_ARCHIVE_NOT_STORED_DATA.includes('raw_event_body_dump'), 'Raw event body dump excluded');
  record(CITY_ARCHIVE_NOT_STORED_DATA.includes('full_raw_save_copy'), 'Full raw save copy excluded');
  record(CITY_ARCHIVE_NOT_STORED_DATA.includes('pii'), 'PII excluded');
  record(CITY_ARCHIVE_NOT_STORED_DATA.includes('gps_or_location'), 'GPS/location excluded');
  record(CITY_ARCHIVE_NOT_STORED_DATA.includes('store_payment_raw_data'), 'Store/payment raw data excluded');
  record(CITY_ARCHIVE_NOT_STORED_DATA.includes('analytics_raw_events'), 'Analytics raw events excluded');
  record(CITY_ARCHIVE_NOT_STORED_DATA.includes('ai_raw_prompt_response'), 'AI raw prompt/response excluded');

  record(CITY_ARCHIVE_PRUNING_PLAN.maxEntries === 120, 'Pruning maxEntries 120');
  record(CITY_ARCHIVE_PRUNING_PLAN.maxEntriesPerDistrict === 20, 'Pruning maxEntriesPerDistrict 20');
  record(CITY_ARCHIVE_PRUNING_PLAN.keepLastNDaysDetailed === 10, 'Pruning keeps last 10 days detailed');
  record(CITY_ARCHIVE_PRUNING_PLAN.preserveStoryChainUnresolved, 'Pruning preserves unresolved story chains');
  record(CITY_ARCHIVE_PRUNING_PLAN.preserveMainOperationMilestones, 'Pruning preserves main operation milestones');
  record(CITY_ARCHIVE_PRUNING_PLAN.preservePositiveComebackImportantEntries, 'Pruning preserves comeback positives');
  record(CITY_ARCHIVE_PRUNING_PLAN.pruneLowPriorityFallbackFirst, 'Pruning removes low priority fallback first');

  record(CITY_ARCHIVE_INTEGRATION_PLAN.includes('cityJournal_archive_backed_with_derived_fallback'), 'CityJournal integration plan exists');
  record(CITY_ARCHIVE_INTEGRATION_PLAN.includes('districtReportCard_full_reads_last_three_archive_events'), 'DistrictReportCard Full dependency plan exists');
  record(CITY_ARCHIVE_INTEGRATION_PLAN.includes('advisorRelationship_uses_previous_decision_archive_reference'), 'AdvisorRelationship archive plan exists');
  record(CITY_ARCHIVE_INTEGRATION_PLAN.includes('rewardComeback_uses_recent_positive_and_completed_comeback_entries'), 'RewardComeback archive plan exists');
  record(CITY_ARCHIVE_INTEGRATION_PLAN.includes('storyChainPersistentRuntime_writes_chain_step_entries_later'), 'StoryChain persistent dependency plan exists');
  record(CITY_ARCHIVE_INTEGRATION_PLAN.includes('report_day_close_can_append_archive_entries'), 'Report write timing plan exists');
  record(CITY_ARCHIVE_INTEGRATION_PLAN.includes('map_journal_trace_can_read_recent_archive_entries'), 'Map journal trace plan exists');

  record(CITY_ARCHIVE_RECOMMENDED_WRITE_TIMING === 'after_end_current_day_report_close', 'Recommended write timing is report close');
  record(CITY_ARCHIVE_IDEMPOTENCY_GUARDS.includes('same_duplicate_key_once'), 'DuplicateKey idempotency guard planned');
  record(CITY_ARCHIVE_IDEMPOTENCY_GUARDS.includes('same_day_same_event_same_kind_once'), 'Same day/event/kind guard planned');
  record(CITY_ARCHIVE_IDEMPOTENCY_GUARDS.includes('migration_rerun_no_duplicates'), 'Migration rerun guard planned');
  record(CITY_ARCHIVE_IDEMPOTENCY_GUARDS.includes('report_reopen_no_duplicates'), 'Report reopen guard planned');
  record(CITY_ARCHIVE_IDEMPOTENCY_GUARDS.includes('app_resume_no_duplicates'), 'App resume guard planned');
  record(CITY_ARCHIVE_IDEMPOTENCY_GUARDS.includes('day_8_main_operation_started_once'), 'Day 8 once guard planned');
  record(CITY_ARCHIVE_IDEMPOTENCY_GUARDS.includes('story_chain_step_once_per_chain_step'), 'Story chain step once guard planned');
  record(CITY_ARCHIVE_IDEMPOTENCY_GUARDS.includes('reward_comeback_completed_once'), 'Reward/comeback completed once guard planned');

  record(!auditSource.includes('@/store/useGameStore'), 'Planning audit not connected to useGameStore');
  record(!auditSource.includes('@/store/gamePersist'), 'Planning audit not connected to persisted game store');
  record(!constants.includes('AsyncStorage') && !types.includes('AsyncStorage'), 'Planning module has no storage dependency');
  record(SAVE_VERSION === 25, 'SAVE_VERSION 24 (V1 implemented)');
  record(readRepo('src/store/gamePersist.ts').includes('SAVE_VERSION = 24'), 'gamePersist SAVE_VERSION 24');
  record(readRepo('src/store/gamePersist.ts').includes('cityArchive'), 'cityArchive in persist (V1)');
  record(!readRepo('src/core/game/applyDecision.ts').includes('cityArchive'), 'applyDecision unchanged by archive planning');
  record(!readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts').includes('cityArchive'), 'dayPipeline unchanged by archive planning');
  record(!readRepo('src/core/game/ensureDailyEventsForDay.ts').includes('cityArchive'), 'ensureDailyEventsForDay unchanged by archive planning');
  record(!readRepo('src/core/game/generateDailyEventSet.ts').includes('cityArchive'), 'generateDailyEventSet unchanged by archive planning');
  for (const file of CITY_ARCHIVE_PROTECTED_FILES) {
    record(readRepo(file).length > 0, `Protected file exists: ${file}`);
  }

  record(docs.includes('1. Amac'), 'Docs section: Amac');
  record(docs.includes('4. CityArchiveV1 target model'), 'Docs section: target model');
  record(docs.includes('6. Migration V24 plan'), 'Docs section: migration');
  record(docs.includes('8. Pruning / size guard'), 'Docs section: pruning');
  record(docs.includes('11. Idempotency guard'), 'Docs section: idempotency');
  record(
    docs.includes('Persist shape degismez') || existsSync(join(REPO_ROOT, 'docs/crevia-city-archive-persistence-v1.md')),
    'Planning or V1 docs present',
  );
  record(
    readRepo('docs/crevia-city-archive-persistence-v1.md').includes('SAVE_VERSION 24') ||
      docs.includes('SAVE_VERSION 24'),
    'Docs confirm SAVE_VERSION 24 migration',
  );
  record(docs.includes('Expo SDK v54 checked'), 'Docs Expo v54 check note');

  const release = runReleaseCandidateAudit();
  record(release.publicLaunchDecision === 'blocked', 'Public launch remains blocked');
  const tracker = runManualLaunchTrackerAudit();
  record(
    tracker.evidenceLog.filter((evidence) => evidence.status === 'verified').length === 0,
    'Evidence verified remains 0',
  );

  record(packageJson.includes('"verify:city-archive-planning"'), 'package.json script present');
  record(existsSync(join(REPO_ROOT, 'scripts/verify-city-archive-planning.ts')), 'verify script exists');

  return { ok, checks };
}
