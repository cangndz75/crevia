import {
  TEAM_SPECIALIZATION_GROUP_PLANS,
  TEAM_SPECIALIZATION_IMPLEMENTATION_SCOPE,
  TEAM_SPECIALIZATION_MIGRATION_PLAN,
  TEAM_SPECIALIZATION_PLAYER_FEEL_GOAL,
} from './teamSpecializationPlanningConstants';
import type { TeamSpecializationReadinessScore } from './teamSpecializationPlanningTypes';

export function formatTeamSpecializationPlanningSummary(
  score: TeamSpecializationReadinessScore,
): string {
  return [
    `Team Specialization V1 Planning — ${score.overallReadiness}`,
    score.summaryLine,
    `Player feel: ${TEAM_SPECIALIZATION_PLAYER_FEEL_GOAL}`,
    `Model ${score.modelCompletenessScore}% | Groups ${score.teamGroupCoverageScore}% | Score plan ${score.scoringPlanScore}%`,
    `Integration ${score.integrationPlanScore}% | Surface ${score.surfaceDensityPlanScore}% | Day safety ${score.daySafetyScore}%`,
    `Migration ${score.migrationPlanScore}% | Manual QA need ${score.manualQaNeedScore}%`,
  ].join('\n');
}

export function formatTeamSpecializationGroupLine(
  groupId: (typeof TEAM_SPECIALIZATION_GROUP_PLANS)[number]['groupId'],
): string {
  const plan = TEAM_SPECIALIZATION_GROUP_PLANS.find((g) => g.groupId === groupId);
  if (!plan) return 'Bilinmeyen ekip grubu';
  return `${plan.playerLabel}: ${plan.linkedDomains.slice(0, 2).join(', ')}`;
}

export function formatTeamSpecializationMigrationSummary(): string {
  return [
    `Migration v${TEAM_SPECIALIZATION_MIGRATION_PLAN.currentSaveVersion} → v${TEAM_SPECIALIZATION_MIGRATION_PLAN.targetSaveVersion}`,
    `Idempotent: ${TEAM_SPECIALIZATION_MIGRATION_PLAN.idempotent}`,
    TEAM_SPECIALIZATION_MIGRATION_PLAN.day7Default,
  ].join(' | ');
}

export function formatTeamSpecializationImplementationScope(): string {
  return [
    TEAM_SPECIALIZATION_IMPLEMENTATION_SCOPE.stage,
    `Included: ${TEAM_SPECIALIZATION_IMPLEMENTATION_SCOPE.included.length} items`,
    `Not included: ${TEAM_SPECIALIZATION_IMPLEMENTATION_SCOPE.notIncluded.length} items`,
  ].join(' — ');
}
