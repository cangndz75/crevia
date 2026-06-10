import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runManualLaunchTrackerAudit } from '@/core/manualLaunchTracker/manualLaunchTrackerAudit';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  TEAM_SPECIALIZATION_ARCHIVE_ENTRY_RECOMMENDATIONS,
  TEAM_SPECIALIZATION_ASSIGNMENT_INTEGRATION_RULES,
  TEAM_SPECIALIZATION_ARCHIVE_INTEGRATION_RULES,
  TEAM_SPECIALIZATION_CONTENT_PACK_RULES,
  TEAM_SPECIALIZATION_CURRENT_SAVE_VERSION,
  TEAM_SPECIALIZATION_DAY_SAFETY_PLANS,
  TEAM_SPECIALIZATION_PLANNING_FATIGUE_BANDS,
  TEAM_SPECIALIZATION_GROUP_IDS,
  TEAM_SPECIALIZATION_GROUP_PLANS,
  TEAM_SPECIALIZATION_FORBIDDEN_PLAYER_TERMS,
  TEAM_SPECIALIZATION_IMPLEMENTATION_SCOPE,
  TEAM_SPECIALIZATION_IMPLEMENTATION_SAVE_VERSION,
  TEAM_SPECIALIZATION_MIGRATION_PLAN,
  TEAM_SPECIALIZATION_PLANNING_DOCS_PATH,
  TEAM_SPECIALIZATION_PLANNING_MORALE_BANDS,
  TEAM_SPECIALIZATION_RUNTIME_UNCHANGED_FILES,
  TEAM_SPECIALIZATION_SCORE_CONTRIBUTIONS,
  TEAM_SPECIALIZATION_STORY_CHAIN_RULES,
  TEAM_SPECIALIZATION_SURFACE_DENSITY_RULES,
  TEAM_SPECIALIZATION_SURFACE_PLANS,
  TEAM_SPECIALIZATION_TARGET_SAVE_VERSION,
  TEAM_SPECIALIZATION_PLANNING_SPECIALIZATION_BANDS,
  TEAM_SPECIALIZATION_VEHICLE_MAINTENANCE_RULES,
} from './teamSpecializationPlanningConstants';
import {
  buildTeamSpecializationReadinessScore,
  evaluateTeamSpecializationDaySafety,
  runTeamSpecializationPlanningAudit,
} from './teamSpecializationPlanningAudit';
import {
  formatTeamSpecializationGroupLine,
  formatTeamSpecializationImplementationScope,
  formatTeamSpecializationMigrationSummary,
  formatTeamSpecializationPlanningSummary,
} from './teamSpecializationPlanningPresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyTeamSpecializationPlanningOutcome = {
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

export function verifyTeamSpecializationPlanningScenario(): VerifyTeamSpecializationPlanningOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (value: boolean) => {
    ok = value && ok;
  };

  const audit = runTeamSpecializationPlanningAudit();
  for (const c of audit.checks) {
    record(assert(checks, c.status !== 'FAIL', c.message, c.message));
  }

  record(assert(checks, TEAM_SPECIALIZATION_GROUP_IDS.length === 6, '6 team groups defined'));
  record(
    assert(
      checks,
      TEAM_SPECIALIZATION_PLANNING_SPECIALIZATION_BANDS.length === 5,
      'specializationBand defined',
    ),
  );
  record(assert(checks, TEAM_SPECIALIZATION_PLANNING_FATIGUE_BANDS.length === 4, 'fatigueBand defined'));
  record(assert(checks, TEAM_SPECIALIZATION_PLANNING_MORALE_BANDS.length === 4, 'moraleBand defined'));
  record(assert(checks, TEAM_SPECIALIZATION_SCORE_CONTRIBUTIONS.length >= 18, 'scoring source plan exists'));
  record(assert(checks, TEAM_SPECIALIZATION_ASSIGNMENT_INTEGRATION_RULES.length >= 6, 'assignment integration plan'));
  record(
    assert(checks, TEAM_SPECIALIZATION_VEHICLE_MAINTENANCE_RULES.length >= 6, 'vehicle maintenance integration plan'),
  );
  record(assert(checks, TEAM_SPECIALIZATION_ARCHIVE_INTEGRATION_RULES.length >= 8, 'City Archive integration plan'));
  record(assert(checks, TEAM_SPECIALIZATION_STORY_CHAIN_RULES.length >= 5, 'Story Chain integration plan'));
  record(assert(checks, TEAM_SPECIALIZATION_CONTENT_PACK_RULES.length >= 6, 'Content Pack integration plan'));
  record(assert(checks, TEAM_SPECIALIZATION_SURFACE_PLANS.length >= 5, 'UI surface plan exists'));
  record(assert(checks, TEAM_SPECIALIZATION_DAY_SAFETY_PLANS.length >= 5, 'Day/access safety exists'));
  record(assert(checks, TEAM_SPECIALIZATION_MIGRATION_PLAN.targetSaveVersion === 26, 'V26 migration plan exists'));
  record(assert(checks, Boolean(TEAM_SPECIALIZATION_IMPLEMENTATION_SCOPE.stage), 'implementation scope recommendation'));

  const score = buildTeamSpecializationReadinessScore();
  record(
    assert(
      checks,
      score.overallReadiness === 'ready_for_v1_implementation' ||
        score.overallReadiness === 'planning_complete',
      'Readiness score model exists',
    ),
  );
  record(assert(checks, score.daySafetyScore === 100, 'Day one safety score max'));
  record(assert(checks, !audit.implementationBlocked, 'Runtime implementation unblocked'));
  record(assert(checks, audit.runtimeOpen, 'Team specialization runtime open'));

  const day1 = evaluateTeamSpecializationDaySafety(1);
  record(assert(checks, !day1.allowed && day1.visibility === 'hidden', 'Day 1 hidden'));
  const day5 = evaluateTeamSpecializationDaySafety(5);
  record(assert(checks, !day5.allowed && day5.visibility === 'passive_hint', 'Day 4-7 passive'));
  const day8 = evaluateTeamSpecializationDaySafety(8);
  record(assert(checks, day8.allowed, 'Day 8+ controlled'));

  record(assert(checks, TEAM_SPECIALIZATION_ARCHIVE_ENTRY_RECOMMENDATIONS.length === 5, 'Archive entry recommendations (5)'));
  record(
    assert(
      checks,
      TEAM_SPECIALIZATION_ARCHIVE_ENTRY_RECOMMENDATIONS.every(
        (e) => e.duplicateKeyPattern.length > 0 && !e.storeRawPersonnelData,
      ),
      'Archive duplicateKey patterns defined, no raw personnel',
    ),
  );

  record(assert(checks, SAVE_VERSION === 26, 'SAVE_VERSION 26 after runtime V1'));
  record(assert(checks, TEAM_SPECIALIZATION_CURRENT_SAVE_VERSION === 25, 'Planning baseline SAVE_VERSION 25'));
  record(assert(checks, TEAM_SPECIALIZATION_TARGET_SAVE_VERSION === 25, 'Planning target SAVE_VERSION 25 (pre-implementation)'));
  record(
    assert(
      checks,
      TEAM_SPECIALIZATION_IMPLEMENTATION_SAVE_VERSION === 26,
      'Future implementation SAVE_VERSION 26 documented',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/store/gamePersist.ts').includes('teamSpecialization'),
      'persist shape includes teamSpecialization',
    ),
  );
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('teamSpecialization'), 'applyDecision unchanged'));
  record(
    assert(
      checks,
      !readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts').includes('teamSpecialization'),
      'dayPipeline unchanged',
    ),
  );
  record(
    assert(
      checks,
      !readRepo('src/core/game/generateDailyEventSet.ts').includes('teamSpecialization'),
      'event generation unchanged',
    ),
  );

  for (const file of TEAM_SPECIALIZATION_RUNTIME_UNCHANGED_FILES) {
    const content = readRepo(file);
    record(assert(checks, content.length > 0, `File exists: ${file}`));
    record(
      assert(
        checks,
        !content.includes('teamSpecialization') && !content.includes('TeamSpecialization'),
        `${file} unchanged by team specialization runtime`,
      ),
    );
  }

  for (const term of ['gps', 'plaka', 'sendika', 'maaş']) {
    record(
      assert(
        checks,
        TEAM_SPECIALIZATION_FORBIDDEN_PLAYER_TERMS.some((t) =>
          t.toLocaleLowerCase('tr-TR').includes(term),
        ),
        `Forbidden term listed: ${term}`,
      ),
    );
  }

  for (const plan of TEAM_SPECIALIZATION_SURFACE_PLANS) {
    const line = plan.exampleLine.toLocaleLowerCase('tr-TR');
    record(
      assert(
        checks,
        !line.includes('gps') &&
          !line.includes('plaka') &&
          !line.includes('teamspecialization') &&
          !line.includes('uzman ekip satın al'),
        `Surface example safe: ${plan.surface}`,
      ),
    );
  }

  record(assert(checks, TEAM_SPECIALIZATION_SURFACE_DENSITY_RULES.length >= 8, 'Surface density guard plan'));

  const launchAudit = runManualLaunchTrackerAudit();
  record(assert(checks, launchAudit.evidenceSummary.verifiedEvidence === 0, 'evidence verified 0'));
  record(assert(checks, launchAudit.roundOne.canProceedPublicLaunch === false, 'public launch blocked'));

  record(
    assert(
      checks,
      readRepo(TEAM_SPECIALIZATION_PLANNING_DOCS_PATH).includes('TeamSpecializationStateV1'),
      'docs exist',
    ),
  );
  record(
    assert(
      checks,
      readRepo('package.json').includes('verify:team-specialization-planning'),
      'package.json script',
    ),
  );

  record(assert(checks, formatTeamSpecializationPlanningSummary(score).length > 20, 'presentation summary'));
  record(assert(checks, formatTeamSpecializationGroupLine('route_cleanup').includes('Rota'), 'team group line'));
  record(assert(checks, formatTeamSpecializationMigrationSummary().includes('26'), 'migration summary'));
  record(assert(checks, formatTeamSpecializationImplementationScope().includes('Implementation'), 'scope summary'));

  record(
    assert(
      checks,
      TEAM_SPECIALIZATION_GROUP_PLANS.every((g) => g.playerLabel.length > 0),
      'Player-facing team labels defined',
    ),
  );

  record(
    assert(
      checks,
      TEAM_SPECIALIZATION_GROUP_PLANS.every((g) => g.linkedVehicleFleetGroups.length > 0),
      'Vehicle fleet group links defined for all teams',
    ),
  );

  const experienceCount = TEAM_SPECIALIZATION_SCORE_CONTRIBUTIONS.filter((c) => c.scoreKind === 'experience').length;
  const fatigueCount = TEAM_SPECIALIZATION_SCORE_CONTRIBUTIONS.filter((c) => c.scoreKind === 'fatigue').length;
  const moraleCount = TEAM_SPECIALIZATION_SCORE_CONTRIBUTIONS.filter((c) => c.scoreKind === 'morale').length;
  record(assert(checks, experienceCount >= 7, 'experience scoring plan'));
  record(assert(checks, fatigueCount >= 5, 'fatigue scoring plan'));
  record(assert(checks, moraleCount >= 4, 'morale scoring plan'));

  return { ok, checks };
}
