export type CreviaDistrictOperationActionPersistenceHealthStatus = 'PASS' | 'WARN' | 'BLOCKED';

export type CreviaDistrictOperationActionPersistenceReviewArea =
  | 'session_only_behavior'
  | 'daily_max_one_action'
  | 'idempotency'
  | 'day_visibility_guards'
  | 'hub_map_report_echo'
  | 'operation_signals_effect_scope'
  | 'priority_district_daily_focus'
  | 'duplicate_suppression'
  | 'save_persistence_gap'
  | 'app_restart_behavior'
  | 'migration_cost'
  | 'save_version_impact'
  | 'v11_persistence_benefit'
  | 'telemetry_decision_criteria';

export type CreviaDistrictOperationActionPersistenceOptionId =
  | 'keep_session_only'
  | 'persist_daily_selected_summary'
  | 'persist_action_history_window';

export type CreviaDistrictOperationActionPersistenceRisk = {
  id: string;
  severity: 'blocker' | 'warning';
  title: string;
  message: string;
  recommendation: string;
};

export type CreviaDistrictOperationActionPersistenceRecommendation = {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
};

export type CreviaDistrictOperationActionSaveImpact = {
  persistShapeChanged: boolean;
  saveVersionChanged: boolean;
  currentSaveVersion: number;
  expectedSaveVersion: number;
  districtActionInPersistShape: boolean;
  storeShapeChanged: boolean;
  summary: string;
};

export type CreviaDistrictOperationActionMigrationRisk = {
  optionId: CreviaDistrictOperationActionPersistenceOptionId;
  requiresSaveVersionBump: boolean;
  requiresMigration: boolean;
  migrationComplexity: 'none' | 'low' | 'medium' | 'high';
  balanceRisk: 'none' | 'low' | 'medium' | 'high';
  summary: string;
};

export type CreviaDistrictOperationActionTelemetryQuestion = {
  id: string;
  question: string;
  decisionSignal: string;
};

export type CreviaDistrictOperationActionPersistenceOption = {
  id: CreviaDistrictOperationActionPersistenceOptionId;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  migrationRisk: CreviaDistrictOperationActionMigrationRisk;
  recommendedFor: 'soft_launch' | 'v11' | 'v2_backlog';
};

export type CreviaDistrictOperationActionPersistenceAreaResult = {
  area: CreviaDistrictOperationActionPersistenceReviewArea;
  health: CreviaDistrictOperationActionPersistenceHealthStatus;
  message: string;
  detail?: string;
};

export type CreviaDistrictOperationActionPersistenceSoftLaunchFindings = {
  persistenceReviewPresent: boolean;
  sessionOnlyCurrent: boolean;
  persistNotRequiredForSoftLaunch: boolean;
  v11PersistenceBacklogDefined: boolean;
  saveVersionUnchanged: boolean;
};

export type CreviaDistrictOperationActionPersistenceReviewResult = {
  health: CreviaDistrictOperationActionPersistenceHealthStatus;
  sessionOnly: boolean;
  persistAdded: boolean;
  runtimeGameplayChanged: boolean;
  areaResults: CreviaDistrictOperationActionPersistenceAreaResult[];
  risks: CreviaDistrictOperationActionPersistenceRisk[];
  persistenceOptions: CreviaDistrictOperationActionPersistenceOption[];
  saveImpact: CreviaDistrictOperationActionSaveImpact;
  migrationRisks: CreviaDistrictOperationActionMigrationRisk[];
  telemetryQuestions: CreviaDistrictOperationActionTelemetryQuestion[];
  v11Backlog: CreviaDistrictOperationActionPersistenceRecommendation[];
  recommendations: CreviaDistrictOperationActionPersistenceRecommendation[];
  softLaunchFindings: CreviaDistrictOperationActionPersistenceSoftLaunchFindings;
  currentBehaviorSummary: string;
  v11Recommendation: string;
  freezeCompliant: boolean;
  docsPath: string;
};

export type RunDistrictOperationActionPersistenceReviewOptions = {
  mode?: 'review_only';
};
