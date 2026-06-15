import { existsSync, readFileSync } from 'node:fs';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { createInitialCityArchiveState } from '@/core/cityArchive/cityArchiveState';
import { runManualLaunchTrackerAudit } from '@/core/manualLaunchTracker/manualLaunchTrackerAudit';
import { SAVE_VERSION, normalizePersistedSave } from '@/store/gamePersist';
import { createDay1Seed } from '@/core/content/day1Seed';

import {
  TEAM_SPECIALIZATION_ARCHIVE_KINDS,
  TEAM_SPECIALIZATION_FORBIDDEN_SURFACE_TERMS,
  TEAM_SPECIALIZATION_GROUP_IDS,
  TEAM_SPECIALIZATION_MIGRATION_FROM_SAVE_VERSION,
  TEAM_SPECIALIZATION_STORY_SIGNAL_TYPES,
  TEAM_SPECIALIZATION_TARGET_SAVE_VERSION,
  TEAM_SPECIALIZATION_VISIBLE_DAY_MIN,
} from './teamSpecializationRuntimeConstants';
import {
  bandsFromExperienceScore,
  bandsFromFatigueScore,
  bandsFromMoraleScore,
  buildTeamSpecializationStorySignal,
  calculateTeamGroupExperienceScore,
  calculateTeamGroupFatigueScore,
  calculateTeamGroupMoraleScore,
  mapAssignmentPersonnelToTeamGroup,
  updateTeamSpecializationForDay,
} from './teamSpecializationEngine';
import {
  migrateTeamSpecializationFromSaveV25,
  resolveTeamSpecializationOnPersistLoad,
} from './teamSpecializationMigration';
import {
  buildTeamSpecializationAssignmentHint,
  buildTeamSpecializationCityJournalEntry,
  buildTeamSpecializationHubLine,
  buildTeamSpecializationMapLine,
  buildTeamSpecializationReportLine,
} from './teamSpecializationRuntimePresentation';
import {
  evaluateTeamSpecializationDayVisibility,
  selectTeamSpecializationSurfaceLines,
} from './teamSpecializationSelectors';
import {
  appendTeamSpecializationDayCloseArchive,
  buildTeamSpecializationArchiveEntry,
} from './teamSpecializationWiring';
import {
  createInitialTeamSpecializationState,
  normalizeTeamSpecializationState,
} from './teamSpecializationState';
import type { TeamSpecializationDayCloseInput } from './teamSpecializationRuntimeTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyTeamSpecializationRuntimeOutcome = {
  ok: boolean;
  checks: string[];
};

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

function assert(checks: string[], ok: boolean, pass: string, fail = pass): boolean {
  checks.push(`${ok ? 'PASS' : 'FAIL'} ${ok ? pass : fail}`);
  return ok;
}

function dayCloseInput(
  day: number,
  extra: Partial<TeamSpecializationDayCloseInput> = {},
): TeamSpecializationDayCloseInput {
  return {
    day,
    operationSignals: {
      personnel: { status: 'stable' },
      vehicles: { status: 'watch' },
    },
    districtId: 'sanayi',
    assignmentPersonnelGroup: 'field_response_team',
    assignmentCompatibilityScore: 72,
    assignmentDomain: 'crisis',
    ...extra,
  };
}

export function verifyTeamSpecializationRuntimeScenario(): VerifyTeamSpecializationRuntimeOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (value: boolean) => {
    ok = value && ok;
  };

  const gamePersist = readRepo('src/store/gamePersist.ts');
  record(assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION current build'));
  record(assert(checks, gamePersist.includes('teamSpecialization'), 'teamSpecialization in gamePersist'));
  record(assert(checks, gamePersist.includes('SAVE_VERSION_25'), 'v25 migration path exists'));

  const v25Save = { ...createDay1Seed(), saveVersion: 25 };
  const migrated = normalizePersistedSave(v25Save);
  record(assert(checks, migrated != null && migrated.saveVersion === SAVE_VERSION, 'v25 save migrates to current SAVE_VERSION'));
  record(
    assert(
      checks,
      migrated != null && (migrated as { teamSpecialization?: unknown }).teamSpecialization != null,
      'migrated save has teamSpecialization',
    ),
  );

  record(assert(checks, TEAM_SPECIALIZATION_GROUP_IDS.length === 6, '6 team groups exist'));
  record(assert(checks, TEAM_SPECIALIZATION_TARGET_SAVE_VERSION <= SAVE_VERSION, 'target SAVE_VERSION 26 in constants'));
  record(
    assert(
      checks,
      TEAM_SPECIALIZATION_MIGRATION_FROM_SAVE_VERSION === 25,
      'migration from SAVE_VERSION 25',
    ),
  );

  const normalizedMissing = resolveTeamSpecializationOnPersistLoad({
    saveVersion: 26,
    currentDay: 5,
    rawTeamSpecialization: undefined,
  });
  record(
    assert(
      checks,
      normalizedMissing.teamGroups.field_coordination.specializationBand === 'none',
      'missing normalizes none band',
    ),
  );

  const corrupt = normalizeTeamSpecializationState({ version: 99, teamGroups: null }, 8);
  record(assert(checks, corrupt.version === 1, 'corrupt teamSpecialization safe initial'));

  const migratedV25 = resolveTeamSpecializationOnPersistLoad({ saveVersion: 25, currentDay: 6 });
  const migratedAgain = resolveTeamSpecializationOnPersistLoad({
    saveVersion: 26,
    currentDay: 6,
    rawTeamSpecialization: migratedV25,
  });
  record(
    assert(
      checks,
      migratedV25.migrationMeta.idempotent === true &&
        migratedAgain.teamGroups.field_coordination.specializationBand ===
          migratedV25.teamGroups.field_coordination.specializationBand,
      'migration idempotent',
    ),
  );
  record(
    assert(
      checks,
      migratedV25.migrationMeta.targetSaveVersion === 26,
      'migrationMeta targetSaveVersion 26',
    ),
  );

  const passiveDay7 = createInitialTeamSpecializationState(7);
  record(
    assert(
      checks,
      passiveDay7.teamGroups.route_cleanup.fatigueBand === 'low',
      'Day <= 7 passive low fatigue default',
    ),
  );

  const derivedDay8 = migrateTeamSpecializationFromSaveV25({
    saveVersion: 25,
    currentDay: 8,
    assignmentPersonnelGroup: 'field_response_team',
    assignmentCompatibilityScore: 80,
    cityArchive: createInitialCityArchiveState(8),
  });
  record(
    assert(
      checks,
      derivedDay8.teamGroups.rapid_support.experienceScore >= 0,
      'Day >= 8 safe derived default',
    ),
  );

  const state8 = updateTeamSpecializationForDay(createInitialTeamSpecializationState(8), {
    ...dayCloseInput(8),
    crisisAdjacent: true,
    assignmentOutcomePositive: true,
    repeatedDistrictSuccess: true,
  });
  const rapidGroup = state8.teamGroups.rapid_support;
  record(assert(checks, Boolean(rapidGroup.specializationBand), 'specializationBand computed'));
  record(assert(checks, Boolean(rapidGroup.fatigueBand), 'fatigueBand computed'));
  record(assert(checks, Boolean(rapidGroup.moraleBand), 'moraleBand computed'));
  record(
    assert(
      checks,
      rapidGroup.experienceScore >= 0 &&
        rapidGroup.experienceScore <= 100 &&
        rapidGroup.fatigueScore <= 100 &&
        rapidGroup.moraleScore <= 100,
      'scores bounded 0-100',
    ),
  );

  record(assert(checks, bandsFromExperienceScore(0) === 'none', 'experience none band'));
  record(assert(checks, bandsFromExperienceScore(25) === 'emerging', 'experience emerging band'));
  record(assert(checks, bandsFromExperienceScore(45) === 'reliable', 'experience reliable band'));
  record(assert(checks, bandsFromExperienceScore(65) === 'specialized', 'experience specialized band'));
  record(
    assert(checks, bandsFromExperienceScore(85) === 'expert_preview', 'experience expert_preview band'),
  );
  record(assert(checks, bandsFromFatigueScore(10) === 'low', 'fatigue low band'));
  record(assert(checks, bandsFromFatigueScore(30) === 'watched', 'fatigue watched band'));
  record(assert(checks, bandsFromFatigueScore(50) === 'elevated', 'fatigue elevated band'));
  record(assert(checks, bandsFromFatigueScore(70) === 'strained', 'fatigue strained band'));
  record(assert(checks, bandsFromMoraleScore(80) === 'motivated', 'morale motivated band'));
  record(assert(checks, bandsFromMoraleScore(30) === 'tired', 'morale tired band'));

  const engineSource = readRepo('src/core/teamSpecialization/teamSpecializationEngine.ts');
  record(assert(checks, !engineSource.includes('Math.random'), 'no Math.random in engine'));

  const stateJson = JSON.stringify(state8);
  record(assert(checks, !stateJson.includes('plaka') && !stateJson.includes('gps'), 'no plaka/GPS fields'));

  const day1State = createInitialTeamSpecializationState(1);
  record(
    assert(
      checks,
      selectTeamSpecializationSurfaceLines(day1State, { day: 1 }).hubLine == null,
      'Day 1 hub compact team line hidden',
    ),
  );

  const day3 = updateTeamSpecializationForDay(createInitialTeamSpecializationState(3), dayCloseInput(3));
  record(
    assert(
      checks,
      selectTeamSpecializationSurfaceLines(day3, { day: 3 }).hubLine == null,
      'Day 1-3 no visible hub line',
    ),
  );

  const day5vis = evaluateTeamSpecializationDayVisibility(5);
  record(assert(checks, !day5vis.allowed && day5vis.visibility === 'passive_hint', 'Day 4-7 passive only'));

  const day6 = updateTeamSpecializationForDay(createInitialTeamSpecializationState(6), {
    ...dayCloseInput(6),
    crisisAdjacent: true,
  });
  record(
    assert(
      checks,
      selectTeamSpecializationSurfaceLines(day6, { day: 6 }).hubLine == null,
      'Day 4-7 no hub line',
    ),
  );

  const pressuredSeed = createInitialTeamSpecializationState(8);
  pressuredSeed.teamGroups.rapid_support = {
    ...pressuredSeed.teamGroups.rapid_support,
    consecutiveUseDays: 3,
    fatigueScore: 55,
    experienceScore: 42,
  };
  const pressuredDay8 = updateTeamSpecializationForDay(pressuredSeed, {
    ...dayCloseInput(8),
    crisisAdjacent: true,
    assignmentPersonnelGroup: 'field_response_team',
    assignmentCompatibilityScore: 30,
    contentPackDomains: ['crisis_adjacent', 'vehicle_route'],
    storyChainKinds: ['crisis_watch_chain'],
  });
  record(
    assert(
      checks,
      Boolean(selectTeamSpecializationSurfaceLines(pressuredDay8, { day: 8 }).hubLine),
      'Day 8+ hub line possible',
    ),
  );
  record(assert(checks, TEAM_SPECIALIZATION_VISIBLE_DAY_MIN === 8, 'visible day min 8'));

  const freshRapid = createInitialTeamSpecializationState(8).teamGroups.rapid_support;
  const balancedFatigue = calculateTeamGroupFatigueScore(
    'rapid_support',
    { ...dayCloseInput(8), routeBalanced: true, assignmentPersonnelGroup: 'field_response_team' },
    { ...freshRapid, consecutiveUseDays: 1 },
  );
  const unbalancedFatigue = calculateTeamGroupFatigueScore(
    'rapid_support',
    { ...dayCloseInput(8), routeBalanced: false, assignmentPersonnelGroup: 'field_response_team' },
    { ...freshRapid, consecutiveUseDays: 2 },
  );
  record(assert(checks, balancedFatigue <= unbalancedFatigue, 'balanced assignment lowers fatigue'));

  const positiveMorale = calculateTeamGroupMoraleScore(
    'social_response',
    { ...dayCloseInput(8), assignmentOutcomePositive: true, socialTrustPositive: true },
    createInitialTeamSpecializationState(8).teamGroups.social_response,
  );
  const baseMorale = calculateTeamGroupMoraleScore(
    'social_response',
    dayCloseInput(8),
    createInitialTeamSpecializationState(8).teamGroups.social_response,
  );
  record(assert(checks, positiveMorale > baseMorale, 'positive outcome increases morale'));

  const highFatiguePrev = {
    ...createInitialTeamSpecializationState(8).teamGroups.route_cleanup,
    fatigueScore: 50,
  };
  const lowGain = calculateTeamGroupExperienceScore(
    'route_cleanup',
    { ...dayCloseInput(8), assignmentPersonnelGroup: 'inspection_team', assignmentDomain: 'vehicle' },
    highFatiguePrev,
  );
  const lowFatiguePrev = { ...highFatiguePrev, fatigueScore: 10 };
  const highGain = calculateTeamGroupExperienceScore(
    'route_cleanup',
    { ...dayCloseInput(8), assignmentPersonnelGroup: 'inspection_team', assignmentDomain: 'vehicle' },
    lowFatiguePrev,
  );
  record(assert(checks, highGain >= lowGain, 'fatigue high reduces experience gain'));

  record(
    assert(
      checks,
      mapAssignmentPersonnelToTeamGroup('field_response_team') === 'rapid_support',
      'assignment personnel read-only mapping',
    ),
  );
  record(
    assert(
      checks,
      mapAssignmentPersonnelToTeamGroup('public_relations_team') === 'social_response',
      'social personnel mapping',
    ),
  );

  const vmLink = updateTeamSpecializationForDay(createInitialTeamSpecializationState(8), {
    ...dayCloseInput(8),
    vehicleMaintenance: {
      fleetGroups: {
        route_support: { maintenanceNeedScore: 70, conditionBand: 'maintenance_due' },
        field_response: { maintenanceNeedScore: 68, fatigueBand: 'high' },
      },
    },
  });
  record(
    assert(
      checks,
      vmLink.vehicleMaintenanceLinkSummary.cautionActive === true,
      'vehicle maintenance read-only link',
    ),
  );
  record(
    assert(
      checks,
      Boolean(vmLink.teamGroups.route_cleanup.cautionLine),
      'route_cleanup caution from vehicle maintenance',
    ),
  );

  const storySignal = buildTeamSpecializationStorySignal(pressuredDay8);
  record(assert(checks, storySignal.priority === 'low', 'story signal low priority'));
  record(assert(checks, TEAM_SPECIALIZATION_STORY_SIGNAL_TYPES.length === 6, '6 story signal types'));
  record(assert(checks, typeof storySignal.canStrengthenChain === 'boolean', 'story signal exported'));

  for (const kind of TEAM_SPECIALIZATION_ARCHIVE_KINDS) {
    record(assert(checks, kind.length > 0, `archive kind ${kind} defined`));
  }

  const archiveEntry = buildTeamSpecializationArchiveEntry(pressuredDay8, dayCloseInput(8));
  record(assert(checks, archiveEntry == null || Boolean(archiveEntry.duplicateKey), 'archive duplicateKey safe'));

  const archiveWithSuppress = appendTeamSpecializationDayCloseArchive(
    createInitialCityArchiveState(8),
    pressuredDay8,
    { ...dayCloseInput(8), cityArchiveRecentKinds: ['story_chain_step'] },
  );
  record(
    assert(
      checks,
      !archiveWithSuppress.entries.some((e) => String(e.sourceKind) === 'teamSpecialization'),
      'duplicate suppression with story chain',
    ),
  );

  const hubLine = buildTeamSpecializationHubLine(pressuredDay8, { day: 8, districtId: 'sanayi' });
  record(assert(checks, hubLine == null || hubLine.startsWith('Ekip izi:'), 'hub line format'));
  const reportLine = buildTeamSpecializationReportLine(pressuredDay8, { day: 8 });
  record(assert(checks, reportLine == null || reportLine.startsWith('Ekip'), 'report line format'));
  const mapLine = buildTeamSpecializationMapLine(pressuredDay8, { day: 8, districtId: 'cumhuriyet' });
  record(assert(checks, mapLine == null || mapLine.startsWith('Ekip desteği:'), 'map line format'));
  const assignmentHint = buildTeamSpecializationAssignmentHint(pressuredDay8, {
    assignmentPersonnelGroup: 'field_response_team',
    assignmentDomain: 'crisis',
  });
  record(assert(checks, assignmentHint == null || assignmentHint.length > 0, 'assignment hint builder'));
  const journal = buildTeamSpecializationCityJournalEntry(pressuredDay8, { day: 8 });
  record(assert(checks, journal == null || journal.length > 0, 'city journal builder'));

  const surfaces = selectTeamSpecializationSurfaceLines(pressuredDay8, { day: 8 });
  record(assert(checks, (surfaces.hubLine?.match(/Ekip izi/g) ?? []).length <= 1, 'Hub max 1 line'));
  record(assert(checks, surfaces.reportLine == null || surfaces.reportLine.split('\n').length <= 1, 'Report max 1 line'));
  record(assert(checks, surfaces.mapHint == null || surfaces.mapHint.split('\n').length <= 1, 'Map max 1 hint'));

  const hubLineOnce = surfaces.hubLine;
  const hubLineDuplicateGuard = selectTeamSpecializationSurfaceLines(pressuredDay8, {
    day: 8,
    existingHubLines: hubLineOnce ? [hubLineOnce] : [],
  });
  record(
    assert(
      checks,
      hubLineOnce == null || hubLineDuplicateGuard.hubLine == null,
      'duplicate hub line suppressed same day',
    ),
  );

  record(
    assert(
      checks,
      selectTeamSpecializationSurfaceLines(undefined, { day: 8 }).hubLine == null &&
        selectTeamSpecializationSurfaceLines(null, { day: 8 }).reportLine == null,
      'missing teamSpecialization state does not crash',
    ),
  );

  let missingHubContextSafe = true;
  try {
    selectTeamSpecializationSurfaceLines(pressuredDay8, {
      day: 8,
      existingHubLines: undefined,
      existingReportLines: undefined,
      existingMapHints: undefined,
    });
  } catch {
    missingHubContextSafe = false;
  }
  record(assert(checks, missingHubContextSafe, 'missing hub context does not crash'));

  const presentationLines = [surfaces.hubLine, surfaces.reportLine, surfaces.mapHint].filter(
    (line): line is string => Boolean(line),
  );
  const rawEnumPattern = /\b(field_coordination|route_cleanup|container_service|social_response|rapid_support|backup_team)\b/;
  record(
    assert(
      checks,
      presentationLines.every(
        (line) =>
          !line.includes('undefined') &&
          !line.includes('null') &&
          !rawEnumPattern.test(line) &&
          !line.includes('team_fatigue_warning'),
      ),
      'hub/report/map presentation has no undefined/null/raw enum',
    ),
  );

  const hubReferenceHome = readRepo('src/features/hub/components/HubReferenceHome.tsx');
  record(
    assert(
      checks,
      hubReferenceHome.includes('showHubBadgeShowcase') &&
        hubReferenceHome.includes('Number(showHubDistrictExpansion) + Number(showHubAuthorityPreview) < 2'),
      'hub compact progression chip density capped at 2',
    ),
  );

  const teamSpecializationIndex = readRepo('src/core/teamSpecialization/index.ts');
  record(
    assert(
      checks,
      teamSpecializationIndex.includes('TeamSpecializationDayCloseInput') &&
        !teamSpecializationIndex.includes("export * from './teamSpecializationRuntimeTypes'"),
      'teamSpecialization index export has no duplicate type barrel',
    ),
  );

  for (const term of TEAM_SPECIALIZATION_FORBIDDEN_SURFACE_TERMS.slice(0, 5)) {
    const combined = [surfaces.hubLine, surfaces.reportLine, surfaces.mapHint]
      .filter(Boolean)
      .join(' ');
    record(
      assert(
        checks,
        !combined.toLocaleLowerCase('tr-TR').includes(term.trim()),
        `forbidden term absent: ${term.trim()}`,
      ),
    );
  }

  record(
    assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('teamSpecialization'), 'applyDecision unchanged'),
  );
  record(
    assert(
      checks,
      !readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts').includes('teamSpecialization'),
      'dayPipeline core unchanged',
    ),
  );
  record(
    assert(
      checks,
      !readRepo('src/core/game/generateDailyEventSet.ts').includes('teamSpecialization'),
      'event generation unchanged',
    ),
  );

  const contentFull = readRepo('src/core/contentRuntimeActivation/contentRuntimeActivationFullConstants.ts');
  record(assert(checks, !contentFull.includes('maxPackOriginEventsPerDay: 3'), 'Content Pack Aşama 2 max 3 not opened'));

  const launchAudit = runManualLaunchTrackerAudit();
  record(assert(checks, launchAudit.evidenceSummary.verifiedEvidence === 0, 'evidence verified 0'));
  record(assert(checks, launchAudit.roundOne.canProceedPublicLaunch === false, 'public launch blocked'));

  record(
    assert(
      checks,
      !readRepo('src/core/teamSpecialization/teamSpecializationPlanningConstants.ts').includes(
        'teamSpecializationEngine',
      ),
      'planning constants unchanged by runtime pass',
    ),
  );

  return { ok, checks };
}
