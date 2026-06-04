export type AnalyticsEventName =
  | 'app_opened'
  | 'session_started'
  | 'day_started'
  | 'first_guide_seen'
  | 'advisor_hint_requested'
  | 'daily_plan_seen'
  | 'daily_plan_confirmed'
  | 'first_event_opened'
  | 'decision_selected'
  | 'assignment_seen'
  | 'assignment_confirmed'
  | 'field_phase_started'
  | 'event_completed'
  | 'report_opened'
  | 'hub_returned'
  | 'pilot_day_started'
  | 'pilot_day_completed'
  | 'day7_report_opened'
  | 'pilot_completion_seen'
  | 'post_pilot_offer_opened'
  | 'post_pilot_offer_primary_cta_pressed'
  | 'limited_continue_selected'
  | 'main_operation_mock_purchase_started'
  | 'main_operation_mock_purchase_completed'
  | 'access_restore_pressed'
  | 'iap_product_list_loaded'
  | 'iap_purchase_started'
  | 'iap_purchase_completed'
  | 'iap_purchase_failed'
  | 'iap_restore_started'
  | 'iap_restore_completed'
  | 'iap_restore_not_found'
  | 'main_operation_day_started'
  | 'season_goal_card_seen'
  | 'season_goal_detail_opened'
  | 'operational_resources_card_seen'
  | 'operational_resources_detail_opened'
  | 'map_resource_overlay_seen'
  | 'map_crisis_overlay_seen'
  | 'micro_decision_seen'
  | 'micro_decision_resolved'
  | 'crisis_desk_seen'
  | 'crisis_action_sheet_opened'
  | 'crisis_action_selected'
  | 'crisis_action_processed'
  | 'season_end_seen'
  | 'season_end_detail_opened'
  | 'report_primary_impact_seen'
  | 'report_daily_plan_seen'
  | 'report_assignment_seen'
  | 'report_resources_seen'
  | 'report_crisis_seen'
  | 'report_micro_decision_seen'
  | 'report_main_operation_seen'
  | 'report_season_end_seen'
  | 'tab_changed'
  | 'map_opened'
  | 'social_pulse_opened'
  | 'profile_opened'
  | 'leaderboard_opened'
  | 'hub_open_ended_card_viewed'
  | 'hub_open_ended_focus_line_viewed'
  | 'hub_next_unlock_summary_viewed'
  | 'hub_district_runtime_summary_viewed'
  | 'map_district_intelligence_viewed'
  | 'map_district_trust_line_viewed'
  | 'map_district_memory_line_viewed'
  | 'map_district_operation_hint_viewed'
  | 'map_active_route_hint_viewed'
  | 'active_route_preview_viewed'
  | 'active_route_phase_viewed'
  | 'active_route_resource_warning_viewed'
  | 'result_systems_echo_viewed'
  | 'result_variant_echo_viewed'
  | 'result_route_echo_viewed'
  | 'result_district_memory_echo_viewed'
  | 'result_tomorrow_echo_viewed'
  | 'report_systems_card_viewed'
  | 'report_systems_line_viewed'
  | 'report_tomorrow_carryover_line_viewed'
  | 'report_district_operation_hint_viewed'
  | 'profile_career_showcase_viewed'
  | 'profile_next_unlock_viewed'
  | 'profile_permission_chip_viewed'
  | 'profile_district_achievement_viewed'
  | 'content_pack_available_for_selection'
  | 'content_pack_quality_audit_summary'
  | 'district_pack_one_loaded';

export type AnalyticsSurface =
  | 'hub'
  | 'event_plan'
  | 'event_dispatch'
  | 'event_field'
  | 'event_result'
  | 'report'
  | 'map'
  | 'social'
  | 'profile'
  | 'leaderboard'
  | 'post_pilot_offer'
  | 'devtools';

export type AnalyticsAccessMode =
  | 'pilot'
  | 'post_pilot_limited'
  | 'post_pilot_full'
  | 'main_operation_full'
  | 'unknown';

export type AnalyticsEventPayloadBase = {
  eventName: AnalyticsEventName;
  surface: AnalyticsSurface;
  day?: number;
  pilotDay?: number;
  seasonDay?: number;
  accessMode?: AnalyticsAccessMode;
  isFirstSession?: boolean;
  timestampMs?: number;
  schemaVersion: number;
};

export type AnalyticsPayloadValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export type AnalyticsEventPayload = AnalyticsEventPayloadBase &
  Record<string, AnalyticsPayloadValue>;

export type AnalyticsEventDefinition = {
  name: AnalyticsEventName;
  description: string;
  surface: AnalyticsSurface;
  funnelIds: AnalyticsFunnelId[];
  allowedPayloadKeys: string[];
  requiredPayloadKeys: string[];
  privacyLevel: 'safe' | 'restricted';
  enabledInDev: boolean;
  enabledInProduction: boolean;
};

export type AnalyticsFunnelId =
  | 'first_session'
  | 'pilot_completion'
  | 'post_pilot_offer'
  | 'limited_operation'
  | 'full_main_operation'
  | 'crisis_management'
  | 'operational_resources'
  | 'season_end'
  | 'retention';

export type AnalyticsFunnelDefinition = {
  id: AnalyticsFunnelId;
  title: string;
  description: string;
  orderedEvents: AnalyticsEventName[];
  successEvent: AnalyticsEventName;
  dropoffRisks: string[];
};

export type AnalyticsValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type AnalyticsAuditFinding = {
  id: string;
  severity: 'pass' | 'warn' | 'fail';
  message: string;
  recommendation: string;
};

export type AnalyticsAuditResult = {
  health: 'PASS' | 'WARN' | 'FAIL';
  checkedCount: number;
  passCount: number;
  warnCount: number;
  failCount: number;
  findings: AnalyticsAuditFinding[];
};
