export type CreviaMapLayerId =
  | 'base_districts'
  | 'district_identity'
  | 'resource_pressure'
  | 'resource_fatigue'
  | 'social_pulse'
  | 'crisis_watch'
  | 'district_trust'
  | 'district_memory'
  | 'active_task_route'
  | 'event_family_signal'
  | 'operation_era'
  | 'city_development';

export type CreviaMapLayerCategory =
  | 'base'
  | 'resource'
  | 'social'
  | 'crisis'
  | 'district'
  | 'route'
  | 'event_content'
  | 'progression'
  | 'city_growth';

export type CreviaMapLayerStatus =
  | 'active'
  | 'available'
  | 'preview'
  | 'locked_by_rank'
  | 'hidden'
  | 'future';

export type CreviaMapLayerVisibilityMode =
  | 'hidden'
  | 'compact'
  | 'standard'
  | 'detailed';

export type CreviaMapLayerUnlockAxis =
  | 'day'
  | 'rank_permission'
  | 'authority'
  | 'xp'
  | 'district_trust'
  | 'resource_stability'
  | 'crisis_state'
  | 'operation_era'
  | 'future_system';

export type CreviaMapLayerDefinition = {
  id: CreviaMapLayerId;
  title: string;
  shortLabel: string;
  description: string;
  category: CreviaMapLayerCategory;
  unlockAxis: CreviaMapLayerUnlockAxis;
  requiredPermissionId?: string;
  requiredRankKey?: string;
  minDay?: number;
  minAuthority?: number;
  minXp?: number;
  requiresDistrictTrust?: boolean;
  requiresCrisisState?: boolean;
  isFutureOnly: boolean;
  playerFacingPriority: number;
  iconKey?: string;
  tone?: 'positive' | 'neutral' | 'warning';
};

export type CreviaMapLayerContext = {
  day?: number;
  currentRankKey?: string;
  authorityTrust?: number;
  xp?: number;
  unlockedPermissionIds?: string[];
  hasDistrictTrustPreview?: boolean;
  hasDistrictMemoryPreview?: boolean;
  hasCrisisState?: boolean;
  hasActiveTask?: boolean;
  hasOperationEra?: boolean;
  isPilotDay?: boolean;
  isLimitedMode?: boolean;
  isFullMode?: boolean;
};

export type CreviaMapLayerState = {
  definition: CreviaMapLayerDefinition;
  status: CreviaMapLayerStatus;
  visibilityMode: CreviaMapLayerVisibilityMode;
  reasonLine: string;
  unlockLine?: string;
  isSelectable: boolean;
  isRecommended: boolean;
  priority: number;
};

export type CreviaMapLayerChipModel = {
  id: CreviaMapLayerId;
  label: string;
  status: CreviaMapLayerStatus;
  iconKey?: string;
  tone?: 'positive' | 'neutral' | 'warning';
  isSelected: boolean;
  isDisabled: boolean;
  helperText?: string;
};

export type CreviaMapLayerViewModel = {
  availableLayers: CreviaMapLayerState[];
  previewLayers: CreviaMapLayerState[];
  hiddenLayerCount: number;
  selectedLayerId: CreviaMapLayerId;
  defaultLayerId: CreviaMapLayerId;
  compactChips: CreviaMapLayerChipModel[];
  summaryLine: string;
  unlockHintLine?: string;
};

export type CreviaMapLayerAuditResult = {
  status: 'PASS' | 'WARN' | 'FAIL';
  message: string;
  details?: string;
};
