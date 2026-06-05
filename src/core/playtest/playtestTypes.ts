export type CreviaRealDevicePlaytestSeverity =
  | 'blocker'
  | 'high'
  | 'medium'
  | 'low'
  | 'polish';

export type CreviaRealDevicePlaytestDecision =
  | 'ready_for_internal_device_test'
  | 'continue_manual_playtest'
  | 'fix_required_before_iap_sandbox'
  | 'blocked_for_release_candidate';

export type CreviaRealDevicePlaytestHealthStatus = 'PASS' | 'WARN' | 'BLOCKED';

export type CreviaRealDevicePlaytestArea =
  | 'install_launch'
  | 'first_ten_minutes'
  | 'event_flow'
  | 'assignment_route'
  | 'map'
  | 'result_screen'
  | 'end_of_day_report'
  | 'hub_day2_plus'
  | 'day7_post_pilot_offer'
  | 'day8_open_ended'
  | 'profile_career'
  | 'performance_device_ux';

export type CreviaRealDeviceDeviceProfile =
  | 'android_small'
  | 'android_mid'
  | 'android_low_mid_segment'
  | 'ios_small'
  | 'ios_mid_large'
  | 'ios_real_iphone';

export type CreviaRealDevicePlaytestStep = {
  order: number;
  action: string;
  surface?: string;
  watchFor: string[];
};

export type CreviaRealDevicePlaytestScenario = {
  id: string;
  title: string;
  area: CreviaRealDevicePlaytestArea;
  day: number;
  startState: string;
  deviceProfiles: CreviaRealDeviceDeviceProfile[];
  steps: CreviaRealDevicePlaytestStep[];
  expectedResult: string;
  relatedVerifyScripts: string[];
  screenshotNeeded: boolean;
  videoNeeded: boolean;
};

export type CreviaRealDevicePlaytestObservation = {
  scenarioId: string;
  deviceProfile: CreviaRealDeviceDeviceProfile | 'any';
  startState: string;
  steps: CreviaRealDevicePlaytestStep[];
  expectedResult: string;
  observedResult: string;
  severity: CreviaRealDevicePlaytestSeverity;
  screenshotNeeded: boolean;
  videoNeeded: boolean;
  owner: string;
  fixRecommendation: string;
  relatedVerifyScript: string;
  completed: boolean;
};

export type CreviaRealDevicePlaytestRisk = {
  id: string;
  category: string;
  severity: CreviaRealDevicePlaytestSeverity;
  title: string;
  description: string;
  examples: string[];
};

export type CreviaRealDevicePlaytestAreaDefinition = {
  id: CreviaRealDevicePlaytestArea;
  label: string;
  questions: string[];
  observationFocus: string[];
};

export type CreviaRealDevicePlaytestPlan = {
  version: string;
  round: number;
  docsPath: string;
  areas: CreviaRealDevicePlaytestAreaDefinition[];
  scenarios: CreviaRealDevicePlaytestScenario[];
  deviceProfiles: Array<{
    id: CreviaRealDeviceDeviceProfile;
    label: string;
    notes: string;
    required: boolean;
  }>;
  riskTaxonomy: CreviaRealDevicePlaytestRisk[];
  minimumScenarioCount: number;
  minimumAreaCount: number;
  manualCompletionRequired: boolean;
  iapPurchaseSmokeSeparatePhase: boolean;
};

export type CreviaRealDevicePlaytestReadinessSummary = {
  health: CreviaRealDevicePlaytestHealthStatus;
  decision: CreviaRealDevicePlaytestDecision;
  areaCount: number;
  scenarioCount: number;
  observationTemplateCount: number;
  completedObservationCount: number;
  blockerRiskCategories: number;
  planPresent: boolean;
  docsPresent: boolean;
  launchCandidateReady: boolean;
  nextActions: string[];
};
