import type { CarryOverMemoryModel } from '@/core/carryOver/carryOverMemoryTypes';
import type { CityEchoBinding } from '@/core/cityEchoBinding/cityEchoBindingTypes';
import type { ContentRuntimeActivationEventMeta } from '@/core/contentRuntimeActivation/contentRuntimeActivationTypes';
import type { DecisionImpactExplanation } from '@/core/decisionImpactExplanation/decisionImpactExplanationTypes';
import type { DistrictReportCardLiteModel } from '@/core/districtReportCard/districtReportCardTypes';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import type { DailyReport } from '@/core/models/DailyReport';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { MainOperationFeelModel } from '@/core/mainOperationFeel/mainOperationFeelTypes';
import type { PostPilotPhase } from '@/core/postPilot/postPilotOperationTypes';
import type { CityArchiveV1State } from '@/core/cityArchive/cityArchiveTypes';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskTypes';

export type CityJournalLiteVisibility =
  | 'hidden'
  | 'compact'
  | 'standard'
  | 'timeline_preview';

export type CityJournalLiteEntryKind =
  | 'route_balanced'
  | 'container_followup'
  | 'social_trust_recovered'
  | 'district_trust_shift'
  | 'resource_pressure_noted'
  | 'crisis_prevented'
  | 'operation_scope_expanded'
  | 'recovery_momentum'
  | 'visible_service_improved'
  | 'carry_over_created'
  | 'carry_over_resolved'
  | 'main_operation_started'
  | 'fallback';

export type CityJournalLiteEntryTone =
  | 'positive'
  | 'watch'
  | 'recovery'
  | 'neutral'
  | 'operation';

export type CityJournalLiteSourceKind =
  | 'daily_report'
  | 'carry_over'
  | 'decision_impact'
  | 'tomorrow_risk'
  | 'city_echo'
  | 'district_memory'
  | 'content_pack'
  | 'main_operation_feel'
  | 'fallback';

export type CityJournalLitePriority = 'low' | 'medium' | 'high';

export type CityJournalLiteEntry = {
  id: string;
  day: number;
  title: string;
  line: string;
  districtId?: MapDistrictId;
  districtName?: string;
  domain?: string;
  kind: CityJournalLiteEntryKind;
  tone: CityJournalLiteEntryTone;
  sourceKind: CityJournalLiteSourceKind;
  priority: CityJournalLitePriority;
  createdFromDay: number;
  maxVisibleLines: number;
  contentPackFamilyId?: string;
};

export type CityJournalLiteSourceSignals = {
  hasDailyReport: boolean;
  hasCarryOver: boolean;
  hasDecisionImpact: boolean;
  hasTomorrowRisk: boolean;
  hasCityEcho: boolean;
  hasDistrictMemory: boolean;
  hasDistrictTrust: boolean;
  hasContentPack: boolean;
  hasMainOperationFeel: boolean;
  hasOperationSignals: boolean;
  hasDistrictReportCard: boolean;
};

export type CityJournalLiteModel = {
  currentDay: number;
  visibility: CityJournalLiteVisibility;
  entries: CityJournalLiteEntry[];
  summaryLine: string;
  emptyLine: string;
  sourceSignals: CityJournalLiteSourceSignals;
  maxEntries: number;
  duplicateKey: string;
  shouldShowInHub: boolean;
  shouldShowInReport: boolean;
  shouldShowInProfile: boolean;
  shouldShowInMap: boolean;
};

export type CityJournalLiteInput = {
  currentDay?: number;
  isPostPilot?: boolean;
  isPilotCompleted?: boolean;
  accessMode?: 'none' | 'limited' | 'full';
  postPilotPhase?: PostPilotPhase | null;
  lastDailyReport?: DailyReport | null;
  currentDailyReport?: DailyReport | null;
  carryOverMemory?: CarryOverMemoryModel | null;
  decisionImpact?: DecisionImpactExplanation | null;
  tomorrowRisk?: TomorrowRiskModel | null;
  cityEcho?: CityEchoBinding | null;
  districtReportCard?: DistrictReportCardLiteModel | null;
  mainOperationFeel?: MainOperationFeelModel | null;
  contentPackMeta?: ContentRuntimeActivationEventMeta | null;
  operationSignals?: {
    dailyFocus?: string;
    priorityDistrictId?: string;
    containers?: { status?: string; summary?: string; score?: number };
    vehicles?: { status?: string; summary?: string; score?: number };
    personnel?: { status?: string; summary?: string; score?: number };
    districts?: { status?: string; summary?: string; score?: number };
    overall?: { status?: string; summary?: string; score?: number };
  } | null;
  resourceFatigue?: unknown;
  socialPulse?: {
    globalPulseScore?: number;
    score?: number;
    trend?: string;
  } | null;
  districtTrustRuntime?: Partial<Record<MapDistrictId, { state?: string; band?: string }>> | null;
  districtMemoryRuntime?: Partial<Record<MapDistrictId, { kind?: string }>> | null;
  focusDistrictId?: MapDistrictId | string | null;
  recentDecisions?: DecisionRecord[];
  existingLines?: string[];
  cityArchive?: CityArchiveV1State | null;
};

export type CityJournalHubPresentation = {
  title: string;
  primaryLine: string | null;
  secondaryLine: string | null;
  visible: boolean;
};

export type CityJournalReportPresentation = {
  label: string;
  line: string | null;
  visible: boolean;
};

export type CityJournalMapPresentation = {
  line: string | null;
  visible: boolean;
};
