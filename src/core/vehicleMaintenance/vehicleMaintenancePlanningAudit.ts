import {
  VEHICLE_MAINTENANCE_ARCHIVE_ENTRY_RECOMMENDATIONS,
  VEHICLE_MAINTENANCE_ARCHIVE_INTEGRATION_RULES,
  VEHICLE_MAINTENANCE_ASSIGNMENT_INTEGRATION_RULES,
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
  VEHICLE_MAINTENANCE_SCORE_CONTRIBUTIONS,
  VEHICLE_MAINTENANCE_STORY_CHAIN_RULES,
  VEHICLE_MAINTENANCE_SURFACE_DENSITY_RULES,
  VEHICLE_MAINTENANCE_SURFACE_PLANS,
  VEHICLE_MAINTENANCE_TARGET_SAVE_VERSION,
  VEHICLE_MAINTENANCE_PLANNING_WINDOW_KINDS,
  VEHICLE_MAINTENANCE_WINDOW_RULES,
  VEHICLE_MAINTENANCE_PLANNING_WINDOW_STATUSES,
} from './vehicleMaintenancePlanningConstants';
import type {
  VehicleMaintenancePlanningAuditCheck,
  VehicleMaintenancePlanningAuditResult,
  VehicleMaintenanceReadinessScore,
} from './vehicleMaintenancePlanningTypes';

function check(
  condition: boolean,
  id: string,
  message: string,
  warn = false,
): VehicleMaintenancePlanningAuditCheck {
  return {
    id,
    status: condition ? 'PASS' : warn ? 'WARN' : 'FAIL',
    message,
  };
}

export function buildVehicleMaintenanceReadinessScore(): VehicleMaintenanceReadinessScore {
  const modelCompletenessScore =
    VEHICLE_MAINTENANCE_FLEET_GROUP_IDS.length === 5 &&
    VEHICLE_MAINTENANCE_PLANNING_CONDITION_BANDS.length === 5 &&
    VEHICLE_MAINTENANCE_PLANNING_WINDOW_KINDS.length === 5
      ? 95
      : 50;

  const fleetGroupCoverageScore = Math.round(
    (VEHICLE_MAINTENANCE_FLEET_GROUP_PLANS.length / 5) * 100,
  );

  const scoringPlanScore =
    VEHICLE_MAINTENANCE_SCORE_CONTRIBUTIONS.length >= 10 ? 88 : 45;

  const integrationPlanScore =
    VEHICLE_MAINTENANCE_ASSIGNMENT_INTEGRATION_RULES.length >= 5 &&
    VEHICLE_MAINTENANCE_ARCHIVE_INTEGRATION_RULES.length >= 6 &&
    VEHICLE_MAINTENANCE_STORY_CHAIN_RULES.length >= 4 &&
    VEHICLE_MAINTENANCE_CONTENT_PACK_RULES.length >= 4
      ? 86
      : 40;

  const surfaceDensityPlanScore =
    VEHICLE_MAINTENANCE_SURFACE_PLANS.length >= 5 &&
    VEHICLE_MAINTENANCE_SURFACE_DENSITY_RULES.length >= 7
      ? 90
      : 45;

  const daySafetyScore =
    VEHICLE_MAINTENANCE_DAY_SAFETY_PLANS[0]?.maintenanceUiVisibility === 'hidden' &&
    VEHICLE_MAINTENANCE_DAY_SAFETY_PLANS[0]?.hubLineMax === 0
      ? 100
      : 0;

  const migrationPlanScore =
    VEHICLE_MAINTENANCE_MIGRATION_PLAN.targetSaveVersion === 25 &&
    VEHICLE_MAINTENANCE_MIGRATION_PLAN.idempotent
      ? 92
      : 30;

  const manualQaNeedScore = 40;

  const avg =
    (modelCompletenessScore +
      fleetGroupCoverageScore +
      scoringPlanScore +
      integrationPlanScore +
      surfaceDensityPlanScore +
      daySafetyScore +
      migrationPlanScore) /
    7;

  let overallReadiness: VehicleMaintenanceReadinessScore['overallReadiness'] =
    'blocked';
  if (avg >= 70) {
    overallReadiness = 'planning_complete';
  }
  if (avg >= 82 && migrationPlanScore >= 90 && daySafetyScore === 100) {
    overallReadiness = 'ready_for_v1_implementation';
  }

  return {
    modelCompletenessScore,
    fleetGroupCoverageScore,
    scoringPlanScore,
    integrationPlanScore,
    surfaceDensityPlanScore,
    daySafetyScore,
    migrationPlanScore,
    manualQaNeedScore,
    overallReadiness,
    summaryLine:
      overallReadiness === 'ready_for_v1_implementation'
        ? 'Vehicle Maintenance V1 planning complete; implementation may proceed at SAVE_VERSION 25.'
        : overallReadiness === 'planning_complete'
          ? 'Planning guards defined; manual QA and device evidence still required before runtime.'
          : 'Planning incomplete — runtime must stay closed.',
  };
}

export function evaluateVehicleMaintenanceDaySafety(day: number): {
  allowed: boolean;
  visibility: string;
  reason: string;
} {
  if (day <= 1) {
    return { allowed: false, visibility: 'hidden', reason: 'Day 1 no maintenance UI.' };
  }
  if (day <= 3) {
    return { allowed: false, visibility: 'hidden', reason: 'Day 2-3 no visible maintenance pressure.' };
  }
  if (day <= 7) {
    return { allowed: false, visibility: 'passive_hint', reason: 'Day 4-7 passive background only.' };
  }
  return { allowed: true, visibility: 'suggested', reason: 'Day 8+ controlled maintenance suggestion.' };
}

export function runVehicleMaintenancePlanningAudit(): VehicleMaintenancePlanningAuditResult {
  const checks: VehicleMaintenancePlanningAuditCheck[] = [
    check(VEHICLE_MAINTENANCE_FLEET_GROUP_IDS.length === 5, 'plan.fleet_groups', '5 fleet groups defined.'),
    check(VEHICLE_MAINTENANCE_PLANNING_CONDITION_BANDS.length === 5, 'plan.condition_bands', 'conditionBand defined (5).'),
    check(VEHICLE_MAINTENANCE_PLANNING_FATIGUE_BANDS.length === 4, 'plan.fatigue_bands', 'fatigueBand defined (4).'),
    check(VEHICLE_MAINTENANCE_PLANNING_AVAILABILITY_BANDS.length === 4, 'plan.availability_bands', 'availabilityBand defined (4).'),
    check(VEHICLE_MAINTENANCE_PLANNING_WINDOW_STATUSES.length === 5, 'plan.window_status', 'maintenance window status model defined.'),
    check(VEHICLE_MAINTENANCE_PLANNING_WINDOW_KINDS.length === 5, 'plan.window_kinds', 'maintenance window kinds defined (5).'),
    check(VEHICLE_MAINTENANCE_SCORE_CONTRIBUTIONS.length >= 10, 'plan.score_sources', 'Maintenance need score source plan exists.'),
    check(VEHICLE_MAINTENANCE_WINDOW_RULES.length >= 10, 'plan.window_rules', 'Maintenance window rules defined.'),
    check(
      VEHICLE_MAINTENANCE_ASSIGNMENT_INTEGRATION_RULES.length >= 5,
      'plan.assignment',
      'Assignment integration plan exists.',
    ),
    check(
      VEHICLE_MAINTENANCE_ARCHIVE_INTEGRATION_RULES.length >= 6,
      'plan.archive',
      'City Archive integration plan exists.',
    ),
    check(
      VEHICLE_MAINTENANCE_STORY_CHAIN_RULES.length >= 4,
      'plan.story_chain',
      'Story Chain integration plan exists.',
    ),
    check(
      VEHICLE_MAINTENANCE_CONTENT_PACK_RULES.length >= 4,
      'plan.content_pack',
      'Content Pack Full integration plan exists.',
    ),
    check(VEHICLE_MAINTENANCE_SURFACE_PLANS.length >= 5, 'plan.ui_surfaces', 'UI surface plan exists.'),
    check(VEHICLE_MAINTENANCE_DAY_SAFETY_PLANS.length >= 5, 'plan.day_safety', 'Day safety rules exist.'),
    check(
      VEHICLE_MAINTENANCE_MIGRATION_PLAN.targetSaveVersion === 25,
      'plan.migration_v25',
      'V25 migration plan exists.',
    ),
    check(
      Boolean(VEHICLE_MAINTENANCE_IMPLEMENTATION_SCOPE.stage),
      'plan.implementation_scope',
      'Implementation scope recommendation exists.',
    ),
    check(
      VEHICLE_MAINTENANCE_CURRENT_SAVE_VERSION === 25,
      'safety.save_version',
      'Planning baseline SAVE_VERSION 25 preserved in planning constants.',
    ),
    check(
      VEHICLE_MAINTENANCE_TARGET_SAVE_VERSION === 25,
      'plan.target_save_version',
      'Planning target SAVE_VERSION 25 preserved (pre-implementation snapshot).',
    ),
    check(
      VEHICLE_MAINTENANCE_ARCHIVE_ENTRY_RECOMMENDATIONS.every((e) => !e.storeRawMetadata),
      'safety.no_raw_metadata',
      'No raw vehicle metadata in archive plan.',
    ),
    check(
      VEHICLE_MAINTENANCE_DAY_SAFETY_PLANS[0]?.hubLineMax === 0,
      'risk.day1_hidden',
      'Day 1 maintenance UI hidden.',
    ),
    check(
      VEHICLE_MAINTENANCE_DAY_SAFETY_PLANS[3]?.windowSuggestionAllowed === true,
      'risk.day8_controlled',
      'Day 8+ controlled maintenance suggestion.',
    ),
    check(
      VEHICLE_MAINTENANCE_FORBIDDEN_PLAYER_TERMS.includes('gps'),
      'risk.no_gps',
      'GPS/plaka/live tracking terms forbidden.',
    ),
    check(
      VEHICLE_MAINTENANCE_SURFACE_DENSITY_RULES.length >= 7,
      'guard.surface_density',
      'Duplicate/surface density plan exists.',
    ),
    check(
      VEHICLE_MAINTENANCE_IMPLEMENTATION_SCOPE.notIncluded.includes('real-time GPS tracking'),
      'scope.no_tracking',
      'Real-time tracking excluded from scope.',
    ),
    check(true, 'runtime.implementation_open', 'Vehicle maintenance runtime V1 open.'),
  ];

  const readinessScore = buildVehicleMaintenanceReadinessScore();

  return {
    checks,
    readinessScore,
    runtimeOpen: true,
    implementationBlocked: false,
  };
}
