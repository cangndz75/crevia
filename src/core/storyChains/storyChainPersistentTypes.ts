import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

import type { CreviaStoryChainKind, CreviaStoryChainStepKind } from './storyChainTypes';

export type PersistentStoryChainStepKind =
  | 'trigger'
  | 'follow_up'
  | 'pressure_shift'
  | 'recovery_window'
  | 'prevention_check'
  | 'closure';

export type PersistentStoryChainStatus =
  | 'active'
  | 'waiting'
  | 'ready_to_close'
  | 'closed'
  | 'expired';

export type PersistentStoryChainClosureKind =
  | 'resolved'
  | 'softened'
  | 'stabilized'
  | 'prevented'
  | 'expired_soft';

export type PersistentStoryChainPriority = 'low' | 'medium' | 'high';

export type PersistentStoryChain = {
  chainId: string;
  chainKind: CreviaStoryChainKind;
  districtId?: MapDistrictId;
  domain?: string;
  currentStepIndex: number;
  currentStepKind: PersistentStoryChainStepKind;
  status: PersistentStoryChainStatus;
  startedDay: number;
  lastAdvancedDay: number;
  expectedNextDay?: number;
  relatedEventIds: string[];
  relatedDecisionIds: string[];
  archiveEntryIds: string[];
  priority: PersistentStoryChainPriority;
  duplicateKey: string;
  playerVisibleTitle: string;
  playerVisibleLine: string;
  eceLine?: string;
  reportLine?: string;
  hubLine?: string;
  mapLine?: string;
};

export type PersistentStoryChainClosure = {
  chainId: string;
  chainKind: CreviaStoryChainKind;
  districtId?: MapDistrictId;
  closedDay: number;
  closureKind: PersistentStoryChainClosureKind;
  archiveEntryId?: string;
  summaryLine: string;
};

export type PersistentStoryChainSourceSignals = {
  hasCarryOver: boolean;
  hasDistrictReport: boolean;
  hasTomorrowRisk: boolean;
  hasRewardComeback: boolean;
  hasArchiveWarning: boolean;
  hasOperationSignals: boolean;
  hasCrisisWatch: boolean;
  hasMainOperation: boolean;
};

export type PersistentStoryChainState = {
  activeChains: PersistentStoryChain[];
  recentlyClosedChains: PersistentStoryChainClosure[];
  unresolvedChainKinds: CreviaStoryChainKind[];
  lastUpdatedDay: number;
  lastResolvedDay?: number;
  duplicateKeys: string[];
  summaryLine?: string;
  sourceSignals: PersistentStoryChainSourceSignals;
};

export type PersistentStoryChainDayCloseInput = {
  day: number;
  isPostPilot?: boolean;
  isPilotCompleted?: boolean;
  districtId?: MapDistrictId | string | null;
  carryOverLine?: string | null;
  carryOverUnresolved?: boolean;
  districtReportIssueKind?: string | null;
  tomorrowRiskLine?: string | null;
  tomorrowRiskSoftened?: boolean;
  rewardComebackLine?: string | null;
  rewardComebackKind?: string | null;
  mainOperationFeelLine?: string | null;
  operationSignals?: {
    containers?: { status?: string };
    vehicles?: { status?: string };
    personnel?: { status?: string };
    districts?: { status?: string };
    priorityDistrictId?: string;
  } | null;
  trustImproving?: boolean;
  trustRecovering?: boolean;
  crisisPrevented?: boolean;
  routeBalanced?: boolean;
  containerRelief?: boolean;
  socialResponse?: boolean;
  resourceRecovered?: boolean;
  crisisWatch?: boolean;
};

export type PersistentStoryChainUpdate = {
  state: PersistentStoryChainState;
  newArchiveEntries: import('@/core/cityArchive/cityArchiveTypes').CityArchiveEntry[];
};

export type PersistentStoryChainSurfaceLines = {
  hubLine?: string;
  reportLine?: string;
  eceLine?: string;
  mapLine?: string;
};

export type PersistentStoryChainStepKindMap = Record<
  PersistentStoryChainStepKind,
  CreviaStoryChainStepKind
>;
