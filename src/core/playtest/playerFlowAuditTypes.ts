export type PlayerFlowStage =
  | 'day1_first_session'
  | 'day2_reinforcement'
  | 'day3_system_expansion'
  | 'day7_pilot_completion'
  | 'post_pilot_offer'
  | 'day8_limited'
  | 'day8_full'
  | 'full_main_crisis'
  | 'full_main_resources'
  | 'full_main_report';

export type PlayerFlowSurface =
  | 'hub'
  | 'event_plan'
  | 'event_dispatch'
  | 'event_field'
  | 'event_result'
  | 'report'
  | 'map'
  | 'social'
  | 'profile'
  | 'post_pilot_offer';

export type PlayerFlowRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type PlayerFlowCheckStatus = 'pass' | 'warn' | 'fail';

export type PlayerFlowCheck = {
  id: string;
  stage: PlayerFlowStage;
  surface: PlayerFlowSurface;
  title: string;
  question: string;
  expectedOutcome: string;
  riskLevel: PlayerFlowRiskLevel;
  status: PlayerFlowCheckStatus;
  notes?: string;
  recommendation?: string;
};

export type PlayerFlowCheckDefinition = Omit<PlayerFlowCheck, 'status' | 'notes'> & {
  manualOnly?: boolean;
};

export type PlayerFlowAuditScenario = {
  id: string;
  title: string;
  description: string;
  stages: PlayerFlowStage[];
  checks: PlayerFlowCheck[];
};

export type PlayerFlowAuditResult = {
  health: 'PASS' | 'WARN' | 'FAIL';
  checkedCount: number;
  passCount: number;
  warnCount: number;
  failCount: number;
  criticalFailCount: number;
  findings: PlayerFlowCheck[];
};

export type PlayerFlowManualChecklistItem = {
  id: string;
  stage: PlayerFlowStage;
  surface: PlayerFlowSurface;
  prompt: string;
  expectedPlayerReaction: string;
  passCriteria: string;
  failSignal: string;
};

export type PlayerFlowManualChecklist = {
  title: string;
  description: string;
  items: PlayerFlowManualChecklistItem[];
};

export type PlayerFlowAuditHealth = PlayerFlowAuditResult['health'];
