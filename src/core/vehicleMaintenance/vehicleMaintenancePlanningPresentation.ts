import {
  VEHICLE_MAINTENANCE_FLEET_GROUP_PLANS,
  VEHICLE_MAINTENANCE_IMPLEMENTATION_SCOPE,
  VEHICLE_MAINTENANCE_MIGRATION_PLAN,
} from './vehicleMaintenancePlanningConstants';
import type { VehicleMaintenanceReadinessScore } from './vehicleMaintenancePlanningTypes';

export function formatVehicleMaintenancePlanningSummary(
  score: VehicleMaintenanceReadinessScore,
): string {
  return [
    `Vehicle Maintenance V1 Planning — ${score.overallReadiness}`,
    score.summaryLine,
    `Model ${score.modelCompletenessScore}% | Fleet ${score.fleetGroupCoverageScore}% | Score plan ${score.scoringPlanScore}%`,
    `Integration ${score.integrationPlanScore}% | Surface ${score.surfaceDensityPlanScore}% | Day safety ${score.daySafetyScore}%`,
    `Migration ${score.migrationPlanScore}% | Manual QA need ${score.manualQaNeedScore}%`,
  ].join('\n');
}

export function formatVehicleMaintenanceFleetGroupLine(
  groupId: (typeof VEHICLE_MAINTENANCE_FLEET_GROUP_PLANS)[number]['groupId'],
): string {
  const plan = VEHICLE_MAINTENANCE_FLEET_GROUP_PLANS.find((g) => g.groupId === groupId);
  if (!plan) return 'Bilinmeyen araç hattı';
  return `${plan.playerLabel}: ${plan.linkedDomains.slice(0, 2).join(', ')}`;
}

export function formatVehicleMaintenanceMigrationSummary(): string {
  return [
    `Migration v${VEHICLE_MAINTENANCE_MIGRATION_PLAN.currentSaveVersion} → v${VEHICLE_MAINTENANCE_MIGRATION_PLAN.targetSaveVersion}`,
    `Idempotent: ${VEHICLE_MAINTENANCE_MIGRATION_PLAN.idempotent}`,
    VEHICLE_MAINTENANCE_MIGRATION_PLAN.day7Default,
  ].join(' | ');
}

export function formatVehicleMaintenanceImplementationScope(): string {
  return [
    VEHICLE_MAINTENANCE_IMPLEMENTATION_SCOPE.stage,
    `Included: ${VEHICLE_MAINTENANCE_IMPLEMENTATION_SCOPE.included.length} items`,
    `Not included: ${VEHICLE_MAINTENANCE_IMPLEMENTATION_SCOPE.notIncluded.length} items`,
  ].join(' — ');
}
