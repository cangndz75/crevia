import type {
  RankPermissionCategory,
  RankPermissionId,
  RankPermissionRankKey,
  RankPermissionUnlockAxis,
} from './rankPermissionTypes';

export const RANK_PERMISSION_FORBIDDEN_COPY_TERMS = [
  '14 günlük sezon',
  'sezon sonu',
  'sezon finali',
  'yeni sezona başla',
  'paywall',
  'satın almazsan',
] as const;

export const RANK_PERMISSION_CATEGORIES: readonly RankPermissionCategory[] = [
  'core_operation',
  'planning',
  'assignment',
  'map_layer',
  'district',
  'resource',
  'crisis',
  'advisor',
  'event_content',
  'operation_era',
  'city_development',
] as const;

export const RANK_PERMISSION_UNLOCK_AXES: readonly RankPermissionUnlockAxis[] = [
  'authority',
  'xp',
  'rank',
  'resource_stability',
  'district_trust',
  'crisis_control',
  'operation_era',
] as const;

export const RANK_PERMISSION_RANK_KEYS: readonly RankPermissionRankKey[] = [
  'field_observer',
  'operations_assistant',
  'field_coordinator',
  'district_supervisor',
  'operations_supervisor',
  'city_operations_manager',
  'strategy_coordinator',
  'chief_operations_director',
] as const;

export const REQUIRED_RANK_PERMISSION_IDS: readonly RankPermissionId[] = [
  'inspect_basic_events',
  'daily_plan_preview',
  'assignment_fit_preview',
  'resource_pressure_summary',
  'district_trust_preview',
  'district_memory_trace_preview',
  'district_specific_operations_preview',
  'map_resource_layer',
  'map_social_layer',
  'map_crisis_layer',
  'map_trust_layer',
  'event_family_rotation_preview',
  'mini_story_chain_preview',
  'player_adaptive_event_preview',
  'reward_recovery_event_preview',
  'team_specialization_preview',
  'vehicle_maintenance_window_preview',
  'container_network_upgrade_preview',
  'advisor_specialist_notes_preview',
  'operation_era_preview',
  'city_development_preview',
  'department_units_preview',
] as const;
