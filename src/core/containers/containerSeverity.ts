import type { NeighborhoodContainerStatus } from './containerTypes';

export type ContainerDaySeverity = 'balanced' | 'elevated' | 'high' | 'critical';

export function classifyNeighborhoodContainerDaySeverity(
  status: NeighborhoodContainerStatus,
): ContainerDaySeverity {
  if (status.statusLabel === 'Kritik' || status.criticalContainerCount >= 2) {
    return 'critical';
  }
  if (
    status.statusLabel === 'Yüksek' ||
    status.criticalContainerCount >= 1 ||
    status.highContainerCount >= 2 ||
    status.worstOverflowRisk === 'critical'
  ) {
    return 'high';
  }
  if (
    status.statusLabel === 'Baskılı' ||
    status.statusLabel === 'Takipte' ||
    status.highContainerCount > 0 ||
    status.worstOverflowRisk === 'high'
  ) {
    return 'elevated';
  }
  return 'balanced';
}

export function inferContainerCriticalReason(
  status: NeighborhoodContainerStatus,
): string {
  if (status.criticalContainerCount >= 2) {
    return 'multi_unit_critical';
  }
  if (status.criticalContainerCount >= 1) {
    return 'unit_critical';
  }
  if (status.averageFillRate >= 88 && status.odorPressure >= 78) {
    return 'fill_odor';
  }
  if (status.maintenancePressure >= 80 && status.averageCondition <= 45) {
    return 'maintenance_condition';
  }
  if (status.statusLabel === 'Kritik') {
    return 'aggregate_pressure';
  }
  return 'none';
}
