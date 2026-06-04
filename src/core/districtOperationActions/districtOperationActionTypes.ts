import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';

export type CreviaDistrictOperationActionStatus =
  | 'available'
  | 'selected'
  | 'applied'
  | 'expired'
  | 'blocked'
  | 'preview_only';

export type CreviaDistrictOperationActionHealthStatus =
  | 'healthy'
  | 'limited'
  | 'blocked'
  | 'preview';

export type CreviaDistrictOperationActionEffect = {
  operationSignalDeltas: {
    personnel?: number;
    vehicles?: number;
    containers?: number;
    districts?: number;
  };
  trustDelta: number;
  memoryTrace: 'recovery' | 'follow_up' | 'visibility' | 'resource_relief';
  resourceTradeoff: string;
  summaryLine: string;
  tomorrowLine: string;
  advisorLine: string;
};

export type CreviaDistrictOperationAction = {
  id: string;
  day: number;
  districtId: MapDistrictId;
  districtName: string;
  operationKind: string;
  label: string;
  shortLabel: string;
  status: CreviaDistrictOperationActionStatus;
  healthStatus: CreviaDistrictOperationActionHealthStatus;
  isSelectableNow: boolean;
  isPostPilot: boolean;
  rankBand: 'early' | 'standard' | 'senior';
  ctaLabel: string;
  reasonLine: string;
  effectPreviewLine: string;
  effect: CreviaDistrictOperationActionEffect;
};

export type CreviaDistrictOperationActionState = {
  selectedByDay: Record<number, CreviaDistrictOperationAction>;
  appliedActionIds: string[];
  recentDistrictOperationKeys: string[];
};

export type CreviaDistrictOperationActionContext = {
  day?: number;
  focusDistrictId?: MapDistrictId | string;
  rankKey?: string;
  unlockedPermissionIds?: string[];
  operationSignals?: OperationSignalsState | unknown;
  resourceFatigue?: unknown;
  crisisState?: unknown;
  recentDistrictOperationKeys?: string[];
  selectedByDay?: Record<number, CreviaDistrictOperationAction>;
};

export type CreviaDistrictOperationActionDailySummary = {
  day: number;
  selectedAction?: CreviaDistrictOperationAction;
  reportLines: string[];
  tomorrowLines: string[];
  advisorLines: string[];
};
