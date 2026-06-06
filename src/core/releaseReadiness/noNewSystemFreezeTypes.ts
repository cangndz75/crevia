import type { CreviaSoftLaunchReviewMode } from './softLaunchReviewTypes';

export type CreviaFreezeAllowedScope =
  | 'bugfix'
  | 'crash_fix'
  | 'layout_overflow_fix'
  | 'typo_copy_fix'
  | 'false_claim_copy_fix'
  | 'secret_hygiene_fix'
  | 'privacy_store_fix'
  | 'iap_setup_tracker_update'
  | 'iap_smoke_result_update'
  | 'real_device_playtest_result_update'
  | 'store_metadata_update'
  | 'screenshot_capture_status_update'
  | 'performance_selector_fix'
  | 'release_candidate_audit'
  | 'verification_only'
  | 'documentation_only';

export type CreviaFreezeForbiddenScope =
  | 'new_gameplay_system'
  | 'new_content_pack'
  | 'new_runtime_activation'
  | 'new_progression_system'
  | 'new_map_layer'
  | 'new_profile_system'
  | 'new_report_system'
  | 'new_hub_card_system'
  | 'new_analytics_event_schema'
  | 'save_version_bump'
  | 'persist_shape_change'
  | 'event_generation_rewrite'
  | 'applyDecision_rewrite'
  | 'dayPipeline_rewrite'
  | 'iap_purchase_flow_rewrite'
  | 'new_screen_or_route'
  | 'large_ui_redesign'
  | 'new_ai_runtime_feature'
  | 'remote_config_activation'
  | 'live_ops_calendar';

export type CreviaFreezeHealthStatus = 'PASS' | 'WARN' | 'BLOCKED';

export type CreviaFreezeDecision =
  | 'freeze_ready'
  | 'freeze_recommended_after_manual_blockers'
  | 'freeze_blocked_by_active_system_work'
  | 'freeze_active'
  | 'fix_only_mode';

export type CreviaFreezeFinding = {
  id: string;
  severity: 'pass' | 'warn' | 'blocker';
  title: string;
  message: string;
  recommendation: string;
  automatic: boolean;
};

export type CreviaFreezeViolation = {
  id: string;
  forbiddenScope: CreviaFreezeForbiddenScope;
  severity: 'warn' | 'blocker';
  title: string;
  message: string;
  recommendation: string;
};

export type CreviaFreezeRecommendation = {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  action: string;
  manual: boolean;
};

export type CreviaFreezePromptGuardItem = {
  id: string;
  question: string;
  rejectIfYes: boolean;
};

export type CreviaFreezeManualBlocker = {
  id: string;
  title: string;
  status: 'pending' | 'resolved';
  drivesFreeze: boolean;
};

export type CreviaNoNewSystemFreezeResult = {
  mode: CreviaSoftLaunchReviewMode;
  health: CreviaFreezeHealthStatus;
  decision: CreviaFreezeDecision;
  freezeActive: boolean;
  fixOnlyMode: boolean;
  allowedScopes: CreviaFreezeAllowedScope[];
  forbiddenScopes: CreviaFreezeForbiddenScope[];
  findings: CreviaFreezeFinding[];
  violations: CreviaFreezeViolation[];
  recommendations: CreviaFreezeRecommendation[];
  manualBlockers: CreviaFreezeManualBlocker[];
  promptGuardChecklist: CreviaFreezePromptGuardItem[];
  nextActions: string[];
  saveVersion: number;
  expectedSaveVersion: number;
  docsPath: string;
};

export type RunNoNewSystemFreezeAuditOptions = {
  mode?: CreviaSoftLaunchReviewMode;
};
