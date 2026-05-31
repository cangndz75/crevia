import type { AdvisorState } from '@/core/advisors/advisorTypes';
import type { AssignmentsState } from '@/core/assignments/assignmentTypes';
import type { CrisisActionState } from '@/core/crisisActions/crisisActionTypes';
import type { CrisisState } from '@/core/crisis/crisisTypes';
import type { DailyOperationsPlanState } from '@/core/dailyPlanning/dailyPlanningTypes';
import type { MainOperationSeasonState } from '@/core/mainOperation/mainOperationTypes';
import type { GameState } from '@/core/models/GameState';
import type { MonetizationState } from '@/core/monetization/monetizationTypes';
import type { MicroDecisionState } from '@/core/microDecisions/microDecisionTypes';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';

export type DayPipelinePhase =
  | 'preflight'
  | 'event_outcome'
  | 'operation_signals'
  | 'daily_plan'
  | 'assignments'
  | 'micro_decisions'
  | 'crisis_actions'
  | 'operational_resources'
  | 'main_operation'
  | 'crisis'
  | 'advisor'
  | 'authority_badges'
  | 'report'
  | 'post_day_refresh'
  | 'cleanup';

export type DayPipelineAccessMode =
  | 'pilot'
  | 'post_pilot_limited'
  | 'post_pilot_full'
  | 'main_operation_full'
  | 'unknown';

export type DayPipelineStepStatus =
  | 'pending'
  | 'skipped'
  | 'processed'
  | 'blocked'
  | 'failed';

export type DayPipelineStepId = string;

export type DayPipelineStepDefinition = {
  id: DayPipelineStepId;
  phase: DayPipelinePhase;
  label: string;
  description: string;
  requiredStateKeys: string[];
  writesStateKeys: string[];
  runsIn: DayPipelineAccessMode[];
  mustRunBefore?: DayPipelineStepId[];
  mustRunAfter?: DayPipelineStepId[];
  idempotencyKey?: string;
  isCritical: boolean;
};

export type DayPipelineStepResult = {
  stepId: DayPipelineStepId;
  status: DayPipelineStepStatus;
  day: number;
  reason?: string;
  beforeSummary?: Record<string, unknown>;
  afterSummary?: Record<string, unknown>;
  warnings: string[];
};

export type DayPipelineAuditFinding = {
  id: string;
  severity: 'pass' | 'warn' | 'fail';
  stepId?: DayPipelineStepId;
  message: string;
  recommendation: string;
};

export type DayPipelineAuditResult = {
  health: 'PASS' | 'WARN' | 'FAIL';
  day: number;
  accessMode: DayPipelineAccessMode;
  checkedStepCount: number;
  processedStepCount: number;
  skippedStepCount: number;
  warnCount: number;
  failCount: number;
  findings: DayPipelineAuditFinding[];
};

export type DayPipelineRunSummary = {
  day: number;
  accessMode: DayPipelineAccessMode;
  stepResults: DayPipelineStepResult[];
  audit: DayPipelineAuditResult;
};

/** Audit + orchestrator context; not a persist shape. */
export type DayPipelineContext = {
  gameState: GameState;
  monetization: MonetizationState;
  lastClosedDay?: number | null;
  lastDailyReport?: { day: number } | null;
  operationSignals?: OperationSignalsState;
  dailyOperationsPlan?: DailyOperationsPlanState;
  assignments?: AssignmentsState;
  microDecisionState?: MicroDecisionState;
  crisisActionState?: CrisisActionState;
  mainOperationSeason?: MainOperationSeasonState;
  crisisState?: CrisisState;
  advisorState?: AdvisorState;
};
