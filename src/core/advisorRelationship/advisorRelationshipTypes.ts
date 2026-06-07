import type { ContentRuntimeActivationEventMeta } from '@/core/contentRuntimeActivation/contentRuntimeActivationTypes';
import type { AdvisorState } from '@/core/advisors/advisorTypes';
import type { CarryOverMemoryModel } from '@/core/carryOver/carryOverMemoryTypes';
import type { CityEchoBinding } from '@/core/cityEchoBinding/cityEchoBindingTypes';
import type { CityJournalLiteEntry } from '@/core/cityJournal/cityJournalTypes';
import type { DecisionImpactExplanation } from '@/core/decisionImpactExplanation/decisionImpactExplanationTypes';
import type { DistrictReportCardLiteModel } from '@/core/districtReportCard/districtReportCardTypes';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import type { DailyReport } from '@/core/models/DailyReport';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { MainOperationFeelModel } from '@/core/mainOperationFeel/mainOperationFeelTypes';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import type { PlayerStyleProfile } from '@/core/playerStyle/playerStyleTypes';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskTypes';
import type { DecisionResultSnapshot } from '@/features/events/types/decisionResultTypes';

export type AdvisorRelationshipVisibility = 'hidden' | 'compact' | 'standard' | 'strategic';

export type AdvisorRelationshipTrustTone =
  | 'observing'
  | 'cautious'
  | 'clearer'
  | 'confident'
  | 'strategic';

export type AdvisorRelationshipFamiliarityBand =
  | 'new_partner'
  | 'learning_player'
  | 'recognizes_patterns'
  | 'trusted_operator'
  | 'strategic_partner';

export type AdvisorRelationshipStyleKind =
  | 'fast_responder'
  | 'social_trust_focused'
  | 'route_balancer'
  | 'resource_guardian'
  | 'crisis_watcher'
  | 'district_mediator'
  | 'recovery_builder'
  | 'balanced_operator'
  | 'unknown';

export type AdvisorRelationshipPredictionState =
  | 'prediction_confirmed'
  | 'prediction_softened'
  | 'prediction_corrected'
  | 'still_observing'
  | 'no_prediction';

export type AdvisorRelationshipSourceKind =
  | 'day_tone'
  | 'player_style'
  | 'previous_decision'
  | 'district_memory'
  | 'resource_habit'
  | 'prediction_correction'
  | 'district_focus'
  | 'main_operation'
  | 'fallback';

export type AdvisorRelationshipSourceSignals = {
  hasPlayerStyle: boolean;
  hasPreviousDecision: boolean;
  hasDistrictMemory: boolean;
  hasResourceHabit: boolean;
  hasPredictionCorrection: boolean;
  hasDistrictFocus: boolean;
  hasMainOperation: boolean;
  hasCarryOver: boolean;
  hasDecisionImpact: boolean;
  hasTomorrowRisk: boolean;
  hasCityJournal: boolean;
};

export type AdvisorRelationshipPlayerStyleSignal = {
  kind: AdvisorRelationshipStyleKind;
  label: string;
  softLine: string;
};

export type AdvisorRelationshipPreviousDecisionReference = {
  decisionId?: string;
  day: number;
  districtId?: string;
  districtName?: string;
  domain?: string;
  line: string;
};

export type AdvisorRelationshipDistrictMemoryReference = {
  districtId: MapDistrictId;
  districtName: string;
  line: string;
};

export type AdvisorRelationshipResourceHabitReference = {
  resource: string;
  line: string;
};

export type AdvisorOperationalRelationshipModel = {
  day: number;
  relationshipVisibility: AdvisorRelationshipVisibility;
  trustTone: AdvisorRelationshipTrustTone;
  familiarityBand: AdvisorRelationshipFamiliarityBand;
  playerStyleSignal?: AdvisorRelationshipPlayerStyleSignal;
  previousDecisionReference?: AdvisorRelationshipPreviousDecisionReference;
  districtMemoryReference?: AdvisorRelationshipDistrictMemoryReference;
  resourceHabitReference?: AdvisorRelationshipResourceHabitReference;
  predictionCorrectionLine?: string;
  predictionState: AdvisorRelationshipPredictionState;
  confidenceLine?: string;
  mainAdvisorLine: string;
  supportingLine?: string;
  reportLine?: string;
  hubLine?: string;
  resultLine?: string;
  sourceSignals: AdvisorRelationshipSourceSignals;
  duplicateKey: string;
  maxVisibleLines: number;
};

export type AdvisorRelationshipSurface = 'hub' | 'report' | 'result' | 'profile';

export type AdvisorRelationshipInput = {
  day: number;
  surface?: AdvisorRelationshipSurface;
  isDay1Tutorial?: boolean;
  isMainOperationFull?: boolean;
  advisorState?: AdvisorState | null;
  playerStyleProfile?: PlayerStyleProfile | null;
  decisionHistory?: DecisionRecord[];
  lastDecision?: DecisionRecord | null;
  decisionImpact?: DecisionImpactExplanation | null;
  tomorrowRisk?: TomorrowRiskModel | null;
  cityJournalEntry?: CityJournalLiteEntry | null;
  carryOverMemory?: CarryOverMemoryModel | null;
  districtReportCard?: DistrictReportCardLiteModel | null;
  operationSignals?: OperationSignalsState | null;
  resourceFatigue?: { domain?: string; state?: string } | null;
  mainOperationFeel?: MainOperationFeelModel | null;
  cityEchoBinding?: CityEchoBinding | null;
  dailyReport?: DailyReport | null;
  snapshot?: DecisionResultSnapshot | null;
  contentPackMeta?: ContentRuntimeActivationEventMeta | null;
  priorityDistrictId?: MapDistrictId | null;
  existingLines?: string[];
};

export type AdvisorRelationshipHubPresentation = {
  model: AdvisorOperationalRelationshipModel;
  mainLine?: string;
  supportingLine?: string;
  numberOfLines: number;
  visible: boolean;
};

export type AdvisorRelationshipReportPresentation = {
  model: AdvisorOperationalRelationshipModel;
  reportLine?: string;
  visible: boolean;
};

export type AdvisorRelationshipResultPresentation = {
  model: AdvisorOperationalRelationshipModel;
  resultLine?: string;
  numberOfLines: number;
  visible: boolean;
};
