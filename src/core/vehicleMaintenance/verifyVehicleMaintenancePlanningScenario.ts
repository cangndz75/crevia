import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runManualLaunchTrackerAudit } from '@/core/manualLaunchTracker/manualLaunchTrackerAudit';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  VEHICLE_MAINTENANCE_ARCHIVE_ENTRY_RECOMMENDATIONS,
  VEHICLE_MAINTENANCE_ASSIGNMENT_INTEGRATION_RULES,
  VEHICLE_MAINTENANCE_ARCHIVE_INTEGRATION_RULES,
  VEHICLE_MAINTENANCE_PLANNING_AVAILABILITY_BANDS,
  VEHICLE_MAINTENANCE_PLANNING_CONDITION_BANDS,
  VEHICLE_MAINTENANCE_CONTENT_PACK_RULES,
  VEHICLE_MAINTENANCE_CURRENT_SAVE_VERSION,
  VEHICLE_MAINTENANCE_DAY_SAFETY_PLANS,
  VEHICLE_MAINTENANCE_PLANNING_FATIGUE_BANDS,
  VEHICLE_MAINTENANCE_FLEET_GROUP_IDS,
  VEHICLE_MAINTENANCE_FLEET_GROUP_PLANS,
  VEHICLE_MAINTENANCE_FORBIDDEN_PLAYER_TERMS,
  VEHICLE_MAINTENANCE_IMPLEMENTATION_SCOPE,
  VEHICLE_MAINTENANCE_MIGRATION_PLAN,
  VEHICLE_MAINTENANCE_PLANNING_DOCS_PATH,
  VEHICLE_MAINTENANCE_RUNTIME_UNCHANGED_FILES,
  VEHICLE_MAINTENANCE_SCORE_CONTRIBUTIONS,
  VEHICLE_MAINTENANCE_STORY_CHAIN_RULES,
  VEHICLE_MAINTENANCE_SURFACE_DENSITY_RULES,
  VEHICLE_MAINTENANCE_SURFACE_PLANS,
  VEHICLE_MAINTENANCE_TARGET_SAVE_VERSION,
  VEHICLE_MAINTENANCE_PLANNING_WINDOW_KINDS,
  VEHICLE_MAINTENANCE_WINDOW_RULES,
} from './vehicleMaintenancePlanningConstants';
import {
  buildVehicleMaintenanceReadinessScore,
  evaluateVehicleMaintenanceDaySafety,
  runVehicleMaintenancePlanningAudit,
} from './vehicleMaintenancePlanningAudit';
import {
  formatVehicleMaintenanceFleetGroupLine,
  formatVehicleMaintenanceImplementationScope,
  formatVehicleMaintenanceMigrationSummary,
  formatVehicleMaintenancePlanningSummary,
} from './vehicleMaintenancePlanningPresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyVehicleMaintenancePlanningOutcome = {
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

export function verifyVehicleMaintenancePlanningScenario(): VerifyVehicleMaintenancePlanningOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (value: boolean) => {
    ok = value && ok;
  };

  const audit = runVehicleMaintenancePlanningAudit();
  for (const c of audit.checks) {
    record(assert(checks, c.status !== 'FAIL', c.message, c.message));
  }

  record(assert(checks, VEHICLE_MAINTENANCE_FLEET_GROUP_IDS.length === 5, '5 fleet groups defined'));
  record(assert(checks, VEHICLE_MAINTENANCE_PLANNING_CONDITION_BANDS.length === 5, 'conditionBand defined'));
  record(assert(checks, VEHICLE_MAINTENANCE_PLANNING_FATIGUE_BANDS.length === 4, 'fatigueBand defined'));
  record(assert(checks, VEHICLE_MAINTENANCE_PLANNING_AVAILABILITY_BANDS.length === 4, 'availabilityBand defined'));
  record(assert(checks, VEHICLE_MAINTENANCE_PLANNING_WINDOW_KINDS.length === 5, 'maintenance window model defined'));
  record(assert(checks, VEHICLE_MAINTENANCE_SCORE_CONTRIBUTIONS.length >= 10, 'score source plan exists'));
  record(assert(checks, VEHICLE_MAINTENANCE_ASSIGNMENT_INTEGRATION_RULES.length >= 5, 'assignment integration plan'));
  record(assert(checks, VEHICLE_MAINTENANCE_ARCHIVE_INTEGRATION_RULES.length >= 6, 'City Archive integration plan'));
  record(assert(checks, VEHICLE_MAINTENANCE_STORY_CHAIN_RULES.length >= 4, 'Story Chain integration plan'));
  record(assert(checks, VEHICLE_MAINTENANCE_CONTENT_PACK_RULES.length >= 4, 'Content Pack Full integration plan'));
  record(assert(checks, VEHICLE_MAINTENANCE_SURFACE_PLANS.length >= 5, 'UI surface plan exists'));
  record(assert(checks, VEHICLE_MAINTENANCE_DAY_SAFETY_PLANS.length >= 5, 'Day safety rules exist'));
  record(assert(checks, VEHICLE_MAINTENANCE_MIGRATION_PLAN.targetSaveVersion === 25, 'V25 migration plan exists'));
  record(assert(checks, Boolean(VEHICLE_MAINTENANCE_IMPLEMENTATION_SCOPE.stage), 'implementation scope recommendation'));

  const score = buildVehicleMaintenanceReadinessScore();
  record(
    assert(
      checks,
      score.overallReadiness === 'ready_for_v1_implementation' ||
        score.overallReadiness === 'planning_complete',
      'Readiness score model exists',
    ),
  );
  record(assert(checks, score.daySafetyScore === 100, 'Day one safety score max'));
  record(assert(checks, !audit.implementationBlocked, 'Runtime implementation open'));
  record(assert(checks, audit.runtimeOpen, 'Vehicle maintenance runtime open'));

  const day1 = evaluateVehicleMaintenanceDaySafety(1);
  record(assert(checks, !day1.allowed && day1.visibility === 'hidden', 'Day 1 hidden'));
  const day8 = evaluateVehicleMaintenanceDaySafety(8);
  record(assert(checks, day8.allowed, 'Day 8+ controlled'));

  record(assert(checks, VEHICLE_MAINTENANCE_ARCHIVE_ENTRY_RECOMMENDATIONS.length === 4, 'Archive entry recommendations (4)'));
  record(
    assert(
      checks,
      VEHICLE_MAINTENANCE_ARCHIVE_ENTRY_RECOMMENDATIONS.every((e) => e.duplicateKeyPattern.includes('duplicateKey') === false && e.duplicateKeyPattern.length > 0),
      'Archive duplicateKey patterns defined',
    ),
  );

  record(assert(checks, SAVE_VERSION === 25, 'SAVE_VERSION 25'));
  record(assert(checks, VEHICLE_MAINTENANCE_CURRENT_SAVE_VERSION === 25, 'Planning current SAVE_VERSION 25'));
  record(assert(checks, VEHICLE_MAINTENANCE_TARGET_SAVE_VERSION === 25, 'Target SAVE_VERSION 25 for implementation'));
  record(assert(checks, readRepo('src/store/gamePersist.ts').includes('vehicleMaintenance'), 'persist shape includes vehicleMaintenance'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('vehicleMaintenance'), 'applyDecision unchanged'));
  record(assert(checks, !readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts').includes('vehicleMaintenance'), 'dayPipeline unchanged'));
  record(assert(checks, !readRepo('src/core/game/generateDailyEventSet.ts').includes('vehicleMaintenance'), 'event generation unchanged'));

  for (const file of VEHICLE_MAINTENANCE_RUNTIME_UNCHANGED_FILES) {
    const content = readRepo(file);
    record(assert(checks, content.length > 0, `File exists: ${file}`));
    record(
      assert(
        checks,
        !content.includes('vehicleMaintenance') && !content.includes('VehicleMaintenance'),
        `${file} unchanged by vehicle maintenance planning`,
      ),
    );
  }

  for (const term of ['gps', 'plaka', 'canlı takip']) {
    record(
      assert(
        checks,
        VEHICLE_MAINTENANCE_FORBIDDEN_PLAYER_TERMS.some((t) =>
          t.toLocaleLowerCase('tr-TR').includes(term),
        ),
        `Forbidden term listed: ${term}`,
      ),
    );
  }

  for (const plan of VEHICLE_MAINTENANCE_SURFACE_PLANS) {
    const line = plan.exampleLine.toLocaleLowerCase('tr-TR');
    record(
      assert(
        checks,
        !line.includes('gps') && !line.includes('plaka') && !line.includes('maintenance runtime'),
        `Surface example safe: ${plan.surface}`,
      ),
    );
  }

  record(assert(checks, VEHICLE_MAINTENANCE_SURFACE_DENSITY_RULES.length >= 7, 'Surface density guard plan'));
  record(assert(checks, VEHICLE_MAINTENANCE_WINDOW_RULES.length >= 10, 'Maintenance window rules'));

  const launchAudit = runManualLaunchTrackerAudit();
  record(assert(checks, launchAudit.evidenceSummary.verifiedEvidence === 0, 'evidence verified 0'));
  record(assert(checks, launchAudit.roundOne.canProceedPublicLaunch === false, 'public launch blocked'));

  record(assert(checks, readRepo(VEHICLE_MAINTENANCE_PLANNING_DOCS_PATH).includes('VehicleMaintenanceStateV1'), 'docs exist'));
  record(assert(checks, readRepo('package.json').includes('verify:vehicle-maintenance-planning'), 'package.json script'));

  record(assert(checks, formatVehicleMaintenancePlanningSummary(score).length > 20, 'presentation summary'));
  record(assert(checks, formatVehicleMaintenanceFleetGroupLine('route_support').includes('Rota'), 'fleet group line'));
  record(assert(checks, formatVehicleMaintenanceMigrationSummary().includes('25'), 'migration summary'));
  record(assert(checks, formatVehicleMaintenanceImplementationScope().includes('Implementation'), 'scope summary'));

  record(
    assert(
      checks,
      VEHICLE_MAINTENANCE_FLEET_GROUP_PLANS.every((g) => g.playerLabel.length > 0),
      'Player-facing fleet labels defined',
    ),
  );

  return { ok, checks };
}
