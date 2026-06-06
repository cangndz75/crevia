export type CreviaStoryChainPersistentRuntimeHealthStatus = 'PASS' | 'WARN' | 'BLOCKED';

export type CreviaStoryChainRuntimeReadinessArea =
  | 'presentation_only_hint_behavior'
  | 'is_runtime_linked_false'
  | 'hub_map_result_report_max_one_line'
  | 'advisor_helper_only_binding'
  | 'duplicate_suppression'
  | 'day_1_hidden_behavior'
  | 'day_2_3_subtle_behavior'
  | 'day_4_7_compact_behavior'
  | 'day_8_plus_detailed_behavior'
  | 'district_memory_trust_dependency'
  | 'carry_over_tomorrow_dependency'
  | 'content_pack_compatibility'
  | 'operation_era_compatibility'
  | 'event_selection_compatibility'
  | 'app_restart_continuity_gap'
  | 'save_shape_impact'
  | 'migration_cost'
  | 'v11_persistence_value'
  | 'post_launch_telemetry_decision_criteria';

export type CreviaStoryChainPersistenceOptionId =
  | 'keep_presentation_only_derived_hints'
  | 'persist_active_chain_summary'
  | 'persist_chain_event_history_window'
  | 'full_story_chain_runtime_engine';

export type CreviaStoryChainPersistenceRisk = {
  id: string;
  severity: 'blocker' | 'warning';
  title: string;
  message: string;
  recommendation: string;
};

export type CreviaStoryChainPersistenceRecommendation = {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
};

export type CreviaStoryChainSaveImpact = {
  persistShapeChanged: boolean;
  saveVersionChanged: boolean;
  currentSaveVersion: number;
  expectedSaveVersion: number;
  storyChainInPersistShape: boolean;
  storeShapeChanged: boolean;
  documentedFutureFields: string[];
  summary: string;
};

export type CreviaStoryChainMigrationRisk = {
  optionId: CreviaStoryChainPersistenceOptionId;
  requiresSaveVersionBump: boolean;
  requiresMigration: boolean;
  migrationComplexity: 'none' | 'low' | 'medium' | 'high';
  balanceRisk: 'none' | 'low' | 'medium' | 'high';
  summary: string;
};

export type CreviaStoryChainTelemetryQuestion = {
  id: string;
  question: string;
  decisionSignal: string;
};

export type CreviaStoryChainPersistenceOption = {
  id: CreviaStoryChainPersistenceOptionId;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  migrationRisk: CreviaStoryChainMigrationRisk;
  recommendedFor: 'soft_launch' | 'v11' | 'v2_backlog';
};

export type CreviaStoryChainRuntimeReadinessAreaResult = {
  area: CreviaStoryChainRuntimeReadinessArea;
  health: CreviaStoryChainPersistentRuntimeHealthStatus;
  message: string;
  detail?: string;
};

export type CreviaStoryChainPersistentRuntimeSoftLaunchFindings = {
  persistenceReviewPresent: boolean;
  presentationOnlyCurrent: boolean;
  persistNotRequiredForSoftLaunch: boolean;
  v11PersistenceBacklogDefined: boolean;
  saveVersionUnchanged: boolean;
  runtimeActivationNotDone: boolean;
};

export type CreviaStoryChainPersistentRuntimeReviewResult = {
  health: CreviaStoryChainPersistentRuntimeHealthStatus;
  presentationOnly: boolean;
  persistAdded: boolean;
  runtimeGameplayChanged: boolean;
  runtimeActivationPerformed: boolean;
  eventGenerationChanged: boolean;
  isRuntimeLinked: boolean;
  areaResults: CreviaStoryChainRuntimeReadinessAreaResult[];
  risks: CreviaStoryChainPersistenceRisk[];
  persistenceOptions: CreviaStoryChainPersistenceOption[];
  saveImpact: CreviaStoryChainSaveImpact;
  migrationRisks: CreviaStoryChainMigrationRisk[];
  telemetryQuestions: CreviaStoryChainTelemetryQuestion[];
  v11Backlog: CreviaStoryChainPersistenceRecommendation[];
  recommendations: CreviaStoryChainPersistenceRecommendation[];
  softLaunchFindings: CreviaStoryChainPersistentRuntimeSoftLaunchFindings;
  currentBehaviorSummary: string;
  v11Recommendation: string;
  freezeCompliant: boolean;
  docsPath: string;
};

export type RunStoryChainPersistentRuntimeReviewOptions = {
  mode?: 'review_only';
};
