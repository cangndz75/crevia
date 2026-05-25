export type SnapshotReason =
  | 'initial'
  | 'before_decision'
  | 'after_decision'
  | 'end_day';

export type SnapshotMetrics = {
  publicSatisfaction: number;
  budget: number;
  staffMorale: number;
};

export type SnapshotResources = {
  availableStaff: number;
  availableVehicles: number;
  overtimeHours: number;
};

export type DaySnapshot = {
  id: string;
  day: number;
  createdAt: string;
  reason: SnapshotReason;
  metrics: SnapshotMetrics;
  resources?: SnapshotResources;
  activeEventIds: string[];
  resolvedEventIds: string[];
  xp: number;
  level: number;
};
