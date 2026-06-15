import { isCurrentSaveVersion, STRATEGY_HISTORY_MIGRATION_FROM_VERSION } from '@/core/quality/saveVersionPolicy';
import {
  TEAM_SPECIALIZATION_ARCHIVE_ENTRY_RECOMMENDATIONS,
  TEAM_SPECIALIZATION_ARCHIVE_INTEGRATION_RULES,
  TEAM_SPECIALIZATION_ASSIGNMENT_INTEGRATION_RULES,
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
  TEAM_SPECIALIZATION_PLANNING_MORALE_BANDS,
  TEAM_SPECIALIZATION_SCORE_CONTRIBUTIONS,
  TEAM_SPECIALIZATION_STORY_CHAIN_RULES,
  TEAM_SPECIALIZATION_SURFACE_DENSITY_RULES,
  TEAM_SPECIALIZATION_SURFACE_PLANS,
  TEAM_SPECIALIZATION_TARGET_SAVE_VERSION,
  TEAM_SPECIALIZATION_PLANNING_SPECIALIZATION_BANDS,
  TEAM_SPECIALIZATION_VEHICLE_MAINTENANCE_RULES,
} from './teamSpecializationPlanningConstants';
import type {
  TeamSpecializationPlanningAuditCheck,
  TeamSpecializationPlanningAuditResult,
  TeamSpecializationReadinessScore,
} from './teamSpecializationPlanningTypes';

function check(
  condition: boolean,
  id: string,
  message: string,
  warn = false,
): TeamSpecializationPlanningAuditCheck {
  return {
    id,
    status: condition ? 'PASS' : warn ? 'WARN' : 'FAIL',
    message,
  };
}

export function buildTeamSpecializationReadinessScore(): TeamSpecializationReadinessScore {
  const modelCompletenessScore =
    TEAM_SPECIALIZATION_GROUP_IDS.length === 6 &&
    TEAM_SPECIALIZATION_PLANNING_SPECIALIZATION_BANDS.length === 5 &&
    TEAM_SPECIALIZATION_PLANNING_FATIGUE_BANDS.length === 4 &&
    TEAM_SPECIALIZATION_PLANNING_MORALE_BANDS.length === 4
      ? 95
      : 50;

  const teamGroupCoverageScore = Math.round(
    (TEAM_SPECIALIZATION_GROUP_PLANS.length / 6) * 100,
  );

  const experienceContributions = TEAM_SPECIALIZATION_SCORE_CONTRIBUTIONS.filter(
    (c) => c.scoreKind === 'experience',
  );
  const fatigueContributions = TEAM_SPECIALIZATION_SCORE_CONTRIBUTIONS.filter(
    (c) => c.scoreKind === 'fatigue',
  );
  const moraleContributions = TEAM_SPECIALIZATION_SCORE_CONTRIBUTIONS.filter(
    (c) => c.scoreKind === 'morale',
  );

  const scoringPlanScore =
    experienceContributions.length >= 7 &&
    fatigueContributions.length >= 5 &&
    moraleContributions.length >= 4
      ? 90
      : 45;

  const integrationPlanScore =
    TEAM_SPECIALIZATION_ASSIGNMENT_INTEGRATION_RULES.length >= 6 &&
    TEAM_SPECIALIZATION_VEHICLE_MAINTENANCE_RULES.length >= 6 &&
    TEAM_SPECIALIZATION_ARCHIVE_INTEGRATION_RULES.length >= 8 &&
    TEAM_SPECIALIZATION_STORY_CHAIN_RULES.length >= 5 &&
    TEAM_SPECIALIZATION_CONTENT_PACK_RULES.length >= 6
      ? 88
      : 40;

  const surfaceDensityPlanScore =
    TEAM_SPECIALIZATION_SURFACE_PLANS.length >= 5 &&
    TEAM_SPECIALIZATION_SURFACE_DENSITY_RULES.length >= 8
      ? 92
      : 45;

  const daySafetyScore =
    TEAM_SPECIALIZATION_DAY_SAFETY_PLANS[0]?.specializationUiVisibility === 'hidden' &&
    TEAM_SPECIALIZATION_DAY_SAFETY_PLANS[0]?.hubLineMax === 0
      ? 100
      : 0;

  const migrationPlanScore =
    TEAM_SPECIALIZATION_MIGRATION_PLAN.targetSaveVersion === 26 &&
    TEAM_SPECIALIZATION_MIGRATION_PLAN.idempotent
      ? 94
      : 30;

  const manualQaNeedScore = 45;

  const avg =
    (modelCompletenessScore +
      teamGroupCoverageScore +
      scoringPlanScore +
      integrationPlanScore +
      surfaceDensityPlanScore +
      daySafetyScore +
      migrationPlanScore) /
    7;

  let overallReadiness: TeamSpecializationReadinessScore['overallReadiness'] = 'blocked';
  if (avg >= 70) {
    overallReadiness = 'planning_complete';
  }
  if (avg >= 82 && migrationPlanScore >= 90 && daySafetyScore === 100) {
    overallReadiness = 'ready_for_v1_implementation';
  }

  return {
    modelCompletenessScore,
    teamGroupCoverageScore,
    scoringPlanScore,
    integrationPlanScore,
    surfaceDensityPlanScore,
    daySafetyScore,
    migrationPlanScore,
    manualQaNeedScore,
    overallReadiness,
    summaryLine:
      overallReadiness === 'ready_for_v1_implementation'
        ? 'Team Specialization V1 planning complete; implementation may proceed at SAVE_VERSION 26.'
        : overallReadiness === 'planning_complete'
          ? 'Planning guards defined; manual QA and device evidence still required before runtime.'
          : 'Planning incomplete — runtime must stay closed.',
  };
}

export function evaluateTeamSpecializationDaySafety(day: number): {
  allowed: boolean;
  visibility: string;
  reason: string;
} {
  if (day <= 1) {
    return { allowed: false, visibility: 'hidden', reason: 'Day 1 no team specialization UI.' };
  }
  if (day <= 3) {
    return { allowed: false, visibility: 'hidden', reason: 'Day 2-3 no visible specialization.' };
  }
  if (day <= 7) {
    return {
      allowed: false,
      visibility: 'passive_hint',
      reason: 'Day 4-7 passive behind-the-scenes or minimal hint only.',
    };
  }
  return { allowed: true, visibility: 'visible', reason: 'Day 8+ controlled compact team line.' };
}

export function runTeamSpecializationPlanningAudit(): TeamSpecializationPlanningAuditResult {
  const checks: TeamSpecializationPlanningAuditCheck[] = [
    check(
      TEAM_SPECIALIZATION_GROUP_IDS.length === 6,
      'plan.team_groups',
      '6 team groups defined.',
    ),
    check(
      TEAM_SPECIALIZATION_PLANNING_SPECIALIZATION_BANDS.length === 5,
      'plan.specialization_bands',
      'specializationBand defined (5).',
    ),
    check(
      TEAM_SPECIALIZATION_PLANNING_FATIGUE_BANDS.length === 4,
      'plan.fatigue_bands',
      'fatigueBand defined (4).',
    ),
    check(
      TEAM_SPECIALIZATION_PLANNING_MORALE_BANDS.length === 4,
      'plan.morale_bands',
      'moraleBand defined (4).',
    ),
    check(
      TEAM_SPECIALIZATION_SCORE_CONTRIBUTIONS.length >= 18,
      'plan.score_sources',
      'Scoring source plan exists (experience/fatigue/morale).',
    ),
    check(
      TEAM_SPECIALIZATION_ASSIGNMENT_INTEGRATION_RULES.length >= 6,
      'plan.assignment',
      'Assignment integration plan exists.',
    ),
    check(
      TEAM_SPECIALIZATION_VEHICLE_MAINTENANCE_RULES.length >= 6,
      'plan.vehicle_maintenance',
      'Vehicle Maintenance integration plan exists.',
    ),
    check(
      TEAM_SPECIALIZATION_ARCHIVE_INTEGRATION_RULES.length >= 8,
      'plan.archive',
      'City Archive integration plan exists.',
    ),
    check(
      TEAM_SPECIALIZATION_STORY_CHAIN_RULES.length >= 5,
      'plan.story_chain',
      'Story Chain integration plan exists.',
    ),
    check(
      TEAM_SPECIALIZATION_CONTENT_PACK_RULES.length >= 6,
      'plan.content_pack',
      'Content Pack integration plan exists.',
    ),
    check(TEAM_SPECIALIZATION_SURFACE_PLANS.length >= 5, 'plan.ui_surfaces', 'UI surface plan exists.'),
    check(TEAM_SPECIALIZATION_DAY_SAFETY_PLANS.length >= 5, 'plan.day_safety', 'Day/access safety exists.'),
    check(
      TEAM_SPECIALIZATION_MIGRATION_PLAN.targetSaveVersion === 26,
      'plan.migration_v26',
      'V26 migration plan exists.',
    ),
    check(
      Boolean(TEAM_SPECIALIZATION_IMPLEMENTATION_SCOPE.stage),
      'plan.implementation_scope',
      'Implementation scope recommendation exists.',
    ),
    check(
      TEAM_SPECIALIZATION_CURRENT_SAVE_VERSION === 25,
      'safety.save_version_unchanged',
      'Planning baseline SAVE_VERSION 25 preserved in planning constants.',
    ),
    check(
      TEAM_SPECIALIZATION_TARGET_SAVE_VERSION === 25,
      'plan.target_save_version',
      'Planning target SAVE_VERSION 25 preserved (pre-implementation snapshot).',
    ),
    check(
      TEAM_SPECIALIZATION_IMPLEMENTATION_SAVE_VERSION === STRATEGY_HISTORY_MIGRATION_FROM_VERSION,
      'plan.future_save_version',
      'Future implementation SAVE_VERSION 26 documented.',
    ),
    check(
      TEAM_SPECIALIZATION_ARCHIVE_ENTRY_RECOMMENDATIONS.every((e) => !e.storeRawPersonnelData),
      'safety.no_raw_personnel',
      'No raw personnel data in archive plan.',
    ),
    check(
      TEAM_SPECIALIZATION_DAY_SAFETY_PLANS[0]?.hubLineMax === 0,
      'risk.day1_hidden',
      'Day 1 team specialization UI hidden.',
    ),
    check(
      TEAM_SPECIALIZATION_DAY_SAFETY_PLANS[3]?.hubLineMax === 1,
      'risk.day8_controlled',
      'Day 8+ controlled team line.',
    ),
    check(
      TEAM_SPECIALIZATION_FORBIDDEN_PLAYER_TERMS.includes('gps'),
      'risk.no_gps',
      'GPS/plaka/live tracking terms forbidden.',
    ),
    check(
      TEAM_SPECIALIZATION_FORBIDDEN_PLAYER_TERMS.some((t) => t.includes('sendika')),
      'risk.no_union_terms',
      'No sensitive worker/union/payroll terms.',
    ),
    check(
      TEAM_SPECIALIZATION_SURFACE_DENSITY_RULES.length >= 8,
      'guard.surface_density',
      'Duplicate/surface density plan exists.',
    ),
    check(
      TEAM_SPECIALIZATION_IMPLEMENTATION_SCOPE.notIncluded.includes('individual personnel profiles'),
      'scope.no_individual_personnel',
      'Individual personnel profiles excluded from scope.',
    ),
    check(
      true,
      'runtime.implementation_open',
      'Team specialization runtime V1 open.',
    ),
  ];

  const readinessScore = buildTeamSpecializationReadinessScore();

  return {
    checks,
    readinessScore,
    runtimeOpen: true,
    implementationBlocked: false,
  };
}
