export type CrashReportingProvider = 'sentry' | 'crashlytics' | 'none';

export type CrashIntegrationMode =
  | 'disabled'
  | 'dev_ready'
  | 'internal_test_ready'
  | 'production_ready';

export type CrashBreadcrumbCategory =
  | 'navigation'
  | 'game_flow'
  | 'iap'
  | 'performance'
  | 'system'
  | 'error';

export type CrashBreadcrumbActionType =
  | 'screen_opened'
  | 'decision_result_viewed'
  | 'report_opened'
  | 'map_selected_district'
  | 'post_pilot_offer_seen'
  | 'iap_purchase_started'
  | 'iap_purchase_succeeded'
  | 'iap_purchase_failed'
  | 'iap_purchase_restored'
  | 'main_operation_feel_shown'
  | 'content_pack_event_shown'
  | 'offline_resume_warning'
  | 'app_start'
  | 'screen_ready'
  | 'dev_crash_test';

export type CrashContextValue = string | number | boolean | undefined;

export type CrashContext = Record<string, CrashContextValue>;

export type CrashMessageLevel = 'debug' | 'info' | 'warning' | 'error' | 'fatal';

export type CrashReporter = {
  readonly provider: CrashReportingProvider;
  readonly active: boolean;
  init(): void;
  captureException(error: unknown, context?: CrashContext): void;
  captureMessage(message: string, level?: CrashMessageLevel, context?: CrashContext): void;
  addBreadcrumb(name: string, category: CrashBreadcrumbCategory, data?: CrashContext): void;
  setContext(context: CrashContext): void;
  clearContext(): void;
  startSpan(name: string, context?: CrashContext): void;
  endSpan(name: string, context?: CrashContext): void;
};

export type CrashPerformanceConfig = {
  provider: CrashReportingProvider;
  dsn?: string;
  enabled: boolean;
  appEnv: string;
  release?: string;
  dist?: string;
  performanceTracingEnabled: boolean;
  sendDefaultPii: boolean;
  debugLogging: boolean;
};

export type CrashPerformanceBlocker = {
  id: string;
  title: string;
  message: string;
  recommendation: string;
};

export type CrashPerformanceManualStep = {
  id: string;
  title: string;
  status: 'pending' | 'done' | 'not_applicable';
  notes?: string;
};

export type CrashPerformanceAuditResult = {
  health: 'PASS' | 'WARN' | 'BLOCKED';
  selectedProvider: CrashReportingProvider;
  integrationMode: CrashIntegrationMode;
  expoCompatibility: 'compatible' | 'partial' | 'incompatible';
  easBuildCompatibility: 'compatible' | 'partial' | 'docs_only';
  privacyRisk: 'low' | 'medium' | 'high';
  sourceMapStatus: 'not_configured' | 'docs_ready' | 'plugin_ready' | 'configured';
  environmentConfigStatus: 'missing_dsn' | 'disabled' | 'partial' | 'ready';
  smokeTestStatus: 'not_run' | 'manual_pending' | 'passed';
  releaseReadinessStatus: 'code_only' | 'internal_test_ready' | 'production_ready' | 'blocked';
  blockers: CrashPerformanceBlocker[];
  nextManualSteps: CrashPerformanceManualStep[];
  codeIntegrationPass: boolean;
  dualProviderBlocked: boolean;
  analyticsSeparationPass: boolean;
};

export type RunCrashPerformanceAuditOptions = {
  mode?: 'dev' | 'internal_device_test' | 'soft_launch_candidate' | 'launch_candidate';
};
