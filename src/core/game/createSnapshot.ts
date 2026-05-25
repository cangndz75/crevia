import { createId } from '@/core/game/createId';
import type {
  DaySnapshot,
  SnapshotMetrics,
  SnapshotReason,
  SnapshotResources,
} from '@/core/models/DaySnapshot';

export type CreateSnapshotParams = {
  day: number;
  reason: SnapshotReason;
  metrics: SnapshotMetrics;
  resources?: SnapshotResources;
  activeEventIds: string[];
  resolvedEventIds: string[];
  xp: number;
  level: number;
};

export function createSnapshot(params: CreateSnapshotParams): DaySnapshot {
  return {
    id: createId('snap'),
    day: params.day,
    createdAt: new Date().toISOString(),
    reason: params.reason,
    metrics: {
      publicSatisfaction: params.metrics.publicSatisfaction,
      budget: params.metrics.budget,
      staffMorale: params.metrics.staffMorale,
    },
    resources: params.resources
      ? {
          availableStaff: params.resources.availableStaff,
          availableVehicles: params.resources.availableVehicles,
          overtimeHours: params.resources.overtimeHours,
        }
      : undefined,
    activeEventIds: [...params.activeEventIds],
    resolvedEventIds: [...params.resolvedEventIds],
    xp: params.xp,
    level: params.level,
  };
}
