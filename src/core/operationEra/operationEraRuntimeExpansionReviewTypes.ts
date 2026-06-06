export type CreviaOperationEraRuntimeExpansionHealthStatus = 'PASS' | 'WARN' | 'BLOCKED';

export type CreviaOperationEraRuntimeReadinessArea =
  | 'runtime_lite_preview_behavior'
  | 'day_1_7_hidden_behavior'
  | 'day_8_plus_visibility'
  | 'hub_report_profile_binding'
  | 'map_helper_only_binding'
  | 'related_content_packs_metadata'
  | 'story_chain_bias_helper'
  | 'event_selection_context_hint'
  | 'variant_bias_helper'
  | 'duplicate_suppression'
  | 'crisis_calm_wording'
  | 'post_pilot_limited_full_behavior'
  | 'content_pack_dependency'
  | 'event_selection_dependency'
  | 'story_chain_dependency'
  | 'district_operation_action_dependency'
  | 'save_shape_impact'
  | 'migration_cost'
  | 'v11_expansion_value'
  | 'v2_full_runtime_risk'
  | 'post_launch_telemetry_decision_criteria';

export type CreviaOperationEraExpansionOptionId =
  | 'keep_runtime_lite_preview'
  | 'persist_current_operation_era_summary'
  | 'runtime_era_weighting_event_selection'
  | 'full_operation_era_season_engine';

export type CreviaOperationEraExpansionRisk = {
  id: string;
  severity: 'blocker' | 'warning';
  title: string;
  message: string;
  recommendation: string;
};

export type CreviaOperationEraExpansionRecommendation = {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
};

export type CreviaOperationEraSaveImpact = {
  persistShapeChanged: boolean;
  saveVersionChanged: boolean;
  currentSaveVersion: number;
  expectedSaveVersion: number;
  operationEraInPersistShape: boolean;
  storeShapeChanged: boolean;
  documentedFutureFields: string[];
  summary: string;
};

export type CreviaOperationEraMigrationRisk = {
  optionId: CreviaOperationEraExpansionOptionId;
  requiresSaveVersionBump: boolean;
  requiresMigration: boolean;
  migrationComplexity: 'none' | 'low' | 'medium' | 'high';
  balanceRisk: 'none' | 'low' | 'medium' | 'high';
  summary: string;
};

export type CreviaOperationEraTelemetryQuestion = {
  id: string;
  question: string;
  decisionSignal: string;
};

export type CreviaOperationEraExpansionOption = {
  id: CreviaOperationEraExpansionOptionId;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  migrationRisk: CreviaOperationEraMigrationRisk;
  recommendedFor: 'soft_launch' | 'v11' | 'v11_later' | 'v2_backlog';
};

export type CreviaOperationEraRuntimeReadinessAreaResult = {
  area: CreviaOperationEraRuntimeReadinessArea;
  health: CreviaOperationEraRuntimeExpansionHealthStatus;
  message: string;
  detail?: string;
};

export type CreviaOperationEraRuntimeExpansionSoftLaunchFindings = {
  expansionReviewPresent: boolean;
  runtimeLiteCurrent: boolean;
  expansionNotRequiredForSoftLaunch: boolean;
  v11ExpansionBacklogDefined: boolean;
  saveVersionUnchanged: boolean;
  runtimeActivationNotDone: boolean;
};

export type CreviaOperationEraRuntimeExpansionReviewResult = {
  health: CreviaOperationEraRuntimeExpansionHealthStatus;
  runtimeLite: boolean;
  persistAdded: boolean;
  runtimeGameplayChanged: boolean;
  runtimeActivationPerformed: boolean;
  eventGenerationChanged: boolean;
  eventSelectionChanged: boolean;
  isRuntimeLinked: boolean;
  previewKindCount: number;
  areaResults: CreviaOperationEraRuntimeReadinessAreaResult[];
  risks: CreviaOperationEraExpansionRisk[];
  expansionOptions: CreviaOperationEraExpansionOption[];
  saveImpact: CreviaOperationEraSaveImpact;
  migrationRisks: CreviaOperationEraMigrationRisk[];
  telemetryQuestions: CreviaOperationEraTelemetryQuestion[];
  v11Backlog: CreviaOperationEraExpansionRecommendation[];
  recommendations: CreviaOperationEraExpansionRecommendation[];
  softLaunchFindings: CreviaOperationEraRuntimeExpansionSoftLaunchFindings;
  currentBehaviorSummary: string;
  v11Recommendation: string;
  freezeCompliant: boolean;
  docsPath: string;
};

export type RunOperationEraRuntimeExpansionReviewOptions = {
  mode?: 'review_only';
};
