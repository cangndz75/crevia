import type { AdvisorOperationalRelationshipModel } from '@/core/advisorRelationship/advisorRelationshipTypes';
import type { CarryOverMemoryModel } from '@/core/carryOver/carryOverMemoryTypes';
import type { CityEchoBinding } from '@/core/cityEchoBinding/cityEchoBindingTypes';
import type { CityJournalLiteEntry } from '@/core/cityJournal/cityJournalTypes';
import type { ContentRuntimeActivationEventMeta } from '@/core/contentRuntimeActivation/contentRuntimeActivationTypes';
import type { DecisionImpactExplanation } from '@/core/decisionImpactExplanation/decisionImpactExplanationTypes';
import type { DistrictReportCardLiteModel } from '@/core/districtReportCard/districtReportCardTypes';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import type { MainOperationFeelModel } from '@/core/mainOperationFeel/mainOperationFeelTypes';
import type { MapDistrictReactionKind } from '@/core/mapReactions/mapReactionTypes';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskTypes';
import type { DecisionResultSnapshot } from '@/features/events/types/decisionResultTypes';

export type RewardComebackVisibility = 'hidden' | 'compact' | 'standard' | 'highlighted';

export type RewardComebackMomentKind =
  | 'decision_worked'
  | 'district_recovered'
  | 'risk_prevented'
  | 'trust_improved'
  | 'route_balanced'
  | 'container_relief'
  | 'resource_recovered'
  | 'social_thanks'
  | 'comeback_available'
  | 'comeback_started'
  | 'comeback_completed'
  | 'reward_event_seen'
  | 'positive_followup'
  | 'advisor_prediction_confirmed'
  | 'fallback';

export type RewardComebackMomentTone =
  | 'positive'
  | 'recovery'
  | 'opportunity'
  | 'steady'
  | 'neutral';

export type RewardComebackMomentSourceKind =
  | 'decision_impact'
  | 'advisor_relationship'
  | 'city_echo'
  | 'tomorrow_risk'
  | 'carry_over'
  | 'district_report_card'
  | 'city_journal'
  | 'map_reaction'
  | 'content_pack'
  | 'operation_signals'
  | 'resource_fatigue'
  | 'main_operation_feel'
  | 'fallback';

export type RewardComebackMomentPriority = 'low' | 'medium' | 'high';

export type RewardComebackMoment = {
  id: string;
  kind: RewardComebackMomentKind;
  tone: RewardComebackMomentTone;
  districtId?: MapDistrictId;
  districtName?: string;
  domain?: string;
  title: string;
  line: string;
  playerFacingLabel: string;
  eceLine?: string;
  socialLine?: string;
  reportLine?: string;
  mapReactionKind?: MapDistrictReactionKind;
  priority: RewardComebackMomentPriority;
  sourceKind: RewardComebackMomentSourceKind;
  duplicateKey: string;
};

export type RewardComebackSourceSignals = {
  hasDecisionImpact: boolean;
  hasAdvisorRelationship: boolean;
  hasCityEcho: boolean;
  hasTomorrowRisk: boolean;
  hasCarryOver: boolean;
  hasDistrictReportCard: boolean;
  hasCityJournal: boolean;
  hasContentPack: boolean;
  hasOperationSignals: boolean;
  hasResourceRecovery: boolean;
  hasMainOperationFeel: boolean;
  hasMapReaction: boolean;
};

export type RewardComebackVisibilityModel = {
  day: number;
  visibility: RewardComebackVisibility;
  moments: RewardComebackMoment[];
  primaryMoment?: RewardComebackMoment;
  reportLine?: string;
  hubLine?: string;
  socialLine?: string;
  mapLine?: string;
  eceLine?: string;
  journalLine?: string;
  resultLine?: string;
  sourceSignals: RewardComebackSourceSignals;
  duplicateKey: string;
  maxVisibleMoments: number;
};

export type RewardComebackSurface = 'hub' | 'report' | 'result' | 'social' | 'map' | 'ece' | 'journal';

export type RewardComebackInput = {
  day: number;
  surface?: RewardComebackSurface;
  isDay1Tutorial?: boolean;
  isMainOperationFull?: boolean;
  isPostPilot?: boolean;
  decisionImpact?: DecisionImpactExplanation | null;
  advisorRelationship?: AdvisorOperationalRelationshipModel | null;
  cityEchoBinding?: CityEchoBinding | null;
  tomorrowRisk?: TomorrowRiskModel | null;
  carryOverMemory?: CarryOverMemoryModel | null;
  districtReportCard?: DistrictReportCardLiteModel | null;
  cityJournalEntry?: CityJournalLiteEntry | null;
  operationSignals?: OperationSignalsState | null;
  resourceFatigue?: { domain?: string; state?: string; trend?: string } | null;
  mainOperationFeel?: MainOperationFeelModel | null;
  contentPackMeta?: ContentRuntimeActivationEventMeta | null;
  snapshot?: DecisionResultSnapshot | null;
  eventId?: string | null;
  priorityDistrictId?: MapDistrictId | null;
  mapReactionKind?: MapDistrictReactionKind | null;
  existingLines?: string[];
};

export type RewardComebackHubPresentation = {
  model: RewardComebackVisibilityModel;
  hubLine?: string;
  visible: boolean;
};

export type RewardComebackReportPresentation = {
  model: RewardComebackVisibilityModel;
  reportLine?: string;
  visible: boolean;
};

export type RewardComebackResultPresentation = {
  model: RewardComebackVisibilityModel;
  resultLine?: string;
  label?: string;
  visible: boolean;
};

export type RewardComebackSocialPresentation = {
  model: RewardComebackVisibilityModel;
  socialLine?: string;
  visible: boolean;
};

export type RewardComebackMapPresentation = {
  model: RewardComebackVisibilityModel;
  mapLine?: string;
  mapReactionKind?: MapDistrictReactionKind;
  visible: boolean;
};

export type RewardComebackJournalPresentation = {
  model: RewardComebackVisibilityModel;
  journalLine?: string;
  visible: boolean;
};
