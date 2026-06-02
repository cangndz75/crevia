export type RankPermissionCategory =
  | 'core_operation'
  | 'planning'
  | 'assignment'
  | 'map_layer'
  | 'district'
  | 'resource'
  | 'crisis'
  | 'advisor'
  | 'event_content'
  | 'operation_era'
  | 'city_development';

export type RankPermissionStatus =
  | 'unlocked'
  | 'current'
  | 'next'
  | 'locked'
  | 'future';

export type RankPermissionUnlockAxis =
  | 'authority'
  | 'xp'
  | 'rank'
  | 'resource_stability'
  | 'district_trust'
  | 'crisis_control'
  | 'operation_era';

export type RankPermissionRankKey =
  | 'field_observer'
  | 'operations_assistant'
  | 'field_coordinator'
  | 'district_supervisor'
  | 'operations_supervisor'
  | 'city_operations_manager'
  | 'strategy_coordinator'
  | 'chief_operations_director';

export type RankPermissionId =
  | 'inspect_basic_events'
  | 'daily_plan_preview'
  | 'assignment_fit_preview'
  | 'resource_pressure_summary'
  | 'district_trust_preview'
  | 'district_memory_trace_preview'
  | 'district_specific_operations_preview'
  | 'map_resource_layer'
  | 'map_social_layer'
  | 'map_crisis_layer'
  | 'map_trust_layer'
  | 'event_family_rotation_preview'
  | 'mini_story_chain_preview'
  | 'player_adaptive_event_preview'
  | 'reward_recovery_event_preview'
  | 'team_specialization_preview'
  | 'vehicle_maintenance_window_preview'
  | 'container_network_upgrade_preview'
  | 'advisor_specialist_notes_preview'
  | 'operation_era_preview'
  | 'city_development_preview'
  | 'department_units_preview';

export type RankPermissionDefinition = {
  id: RankPermissionId;
  title: string;
  shortLabel: string;
  description: string;
  category: RankPermissionCategory;
  unlockAxis: RankPermissionUnlockAxis;
  requiredRankKey: RankPermissionRankKey;
  requiredAuthorityMin?: number;
  requiredXpMin?: number;
  isPreviewOnly: boolean;
  playerFacingPriority: number;
  iconKey?: string;
  tone?: 'positive' | 'neutral' | 'warning';
};

export type RankPermissionRankDefinition = {
  rankKey: RankPermissionRankKey;
  title: string;
  subtitle: string;
  order: number;
  authorityMin?: number;
  authorityMax?: number;
  summary: string;
  permissionIds: RankPermissionId[];
};

export type RankPermissionUiItem = {
  id: RankPermissionId;
  title: string;
  description: string;
  status: RankPermissionStatus;
  category: RankPermissionCategory;
  iconKey?: string;
  tone?: 'positive' | 'neutral' | 'warning';
};

export type RankPermissionBundle = {
  currentRank: RankPermissionRankDefinition;
  nextRank?: RankPermissionRankDefinition;
  unlockedPermissions: RankPermissionUiItem[];
  nextPermissions: RankPermissionUiItem[];
  futurePermissions: RankPermissionUiItem[];
};

export type RankPermissionPreviewModel = RankPermissionBundle & {
  progressLine: string;
  nextUnlockLine: string;
  primaryCategoryFocus: RankPermissionCategory;
  compactItems: RankPermissionUiItem[];
};
