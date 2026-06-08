import type { ContentRuntimeActivationEventMeta } from '@/core/contentRuntimeActivation/contentRuntimeActivationTypes';
import type { CarryOverMemoryModel } from '@/core/carryOver/carryOverMemoryTypes';
import type { CityEchoBinding } from '@/core/cityEchoBinding/cityEchoBindingTypes';
import type { CityJournalLiteModel } from '@/core/cityJournal/cityJournalTypes';
import type { DecisionImpactExplanation } from '@/core/decisionImpactExplanation/decisionImpactExplanationTypes';
import type { DistrictReportCardSurfaceModel } from '@/core/districtReportCard/districtReportCardTypes';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import type { OperationalResourcePresenceLiteModel } from '@/core/operationalResourcePresence/operationalResourcePresenceTypes';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskTypes';

export type MapReactionLiteVisibility = 'hidden' | 'compact' | 'standard';

export type MapDistrictReactionKind =
  | 'trust_pulse'
  | 'risk_ring'
  | 'recovery_glow'
  | 'social_bubble'
  | 'route_pressure_marker'
  | 'container_pressure_marker'
  | 'resource_fatigue_marker'
  | 'resource_presence_marker'
  | 'team_capacity_marker'
  | 'vehicle_capacity_marker'
  | 'crisis_watch_ring'
  | 'operation_scope_marker'
  | 'journal_trace'
  | 'content_pack_marker'
  | 'active_route_hint'
  | 'fallback';

export type MapDistrictReactionTone =
  | 'positive'
  | 'watch'
  | 'recovery'
  | 'risk'
  | 'neutral'
  | 'operation';

export type MapDistrictReactionIntensity = 'low' | 'medium' | 'high';

export type MapDistrictReactionPulseStyle = 'none' | 'soft' | 'ring' | 'bubble' | 'glow';

export type MapDistrictReactionPriority = 'low' | 'medium' | 'high';

export type MapDistrictReactionSourceKind =
  | 'tomorrow_risk'
  | 'carry_over'
  | 'district_report_card'
  | 'resource_presence'
  | 'content_pack'
  | 'city_echo'
  | 'district_trust'
  | 'district_memory'
  | 'operation_signals'
  | 'resource_fatigue'
  | 'city_journal'
  | 'main_operation_feel'
  | 'active_route'
  | 'district_identity'
  | 'fallback';

export type MapDistrictReaction = {
  id: string;
  districtId: MapDistrictId;
  districtName: string;
  kind: MapDistrictReactionKind;
  tone: MapDistrictReactionTone;
  intensity: MapDistrictReactionIntensity;
  label: string;
  shortLine: string;
  iconKey?: string;
  pulseStyle: MapDistrictReactionPulseStyle;
  shouldAnimate: boolean;
  animationHint?: string;
  sourceKind: MapDistrictReactionSourceKind;
  priority: MapDistrictReactionPriority;
  duplicateKey: string;
  maxVisibleLines: number;
};

export type MapReactionLiteSourceSignals = {
  hasTomorrowRisk: boolean;
  hasCarryOver: boolean;
  hasDistrictReportCard: boolean;
  hasResourcePresence: boolean;
  hasContentPack: boolean;
  hasCityEcho: boolean;
  hasCityJournal: boolean;
  hasOperationSignals: boolean;
  hasResourceFatigue: boolean;
  hasMainOperationFeel: boolean;
  hasActiveRoute: boolean;
};

export type MapReactionLiteModel = {
  day: number;
  visibility: MapReactionLiteVisibility;
  reactions: MapDistrictReaction[];
  selectedDistrictReaction?: MapDistrictReaction;
  globalMapHint?: string;
  sourceSignals: MapReactionLiteSourceSignals;
  maxVisibleReactions: number;
  duplicateKey: string;
};

export type MapReactionLiteInput = {
  day?: number;
  selectedDistrictId?: MapDistrictId | string | null;
  isPostPilot?: boolean;
  isPilotCompleted?: boolean;
  accessMode?: 'none' | 'limited' | 'full';
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
  operationalResources?: unknown;
  tomorrowRisk?: TomorrowRiskModel | null;
  cityEcho?: CityEchoBinding | null;
  decisionImpact?: DecisionImpactExplanation | null;
  districtReportCard?: DistrictReportCardSurfaceModel | null;
  operationalResourcePresence?: OperationalResourcePresenceLiteModel | null;
  contentPackMeta?: ContentRuntimeActivationEventMeta | null;
  cityJournal?: CityJournalLiteModel | null;
  cityArchive?: import('@/core/cityArchive/cityArchiveTypes').CityArchiveV1State | null;
  carryOverMemory?: CarryOverMemoryModel | null;
  mainOperationScopeHintLine?: string | null;
  mainOperationScopeDistrictIds?: MapDistrictId[];
  activeRouteDistrictId?: MapDistrictId | string | null;
  activeRouteVisible?: boolean;
  existingLines?: string[];
  mapIntelligenceLines?: string[];
  districtReportCardLines?: string[];
  resourceOverlayLines?: string[];
  resourcePresenceMapLine?: string | null;
  mainOperationFeelMapHint?: string | null;
  cityEchoLines?: string[];
  tomorrowRiskLine?: string | null;
};

export type MapReactionStripOverlay = {
  districtId: MapDistrictId;
  indicatorLabel?: string;
  tone: MapDistrictReactionTone;
  pulseStyle: MapDistrictReactionPulseStyle;
  shouldAnimate: boolean;
};

export type MapReactionPanelPresentation = {
  hintLine?: string;
  hintTone?: MapDistrictReactionTone;
  selectedShortLine?: string;
  visible: boolean;
};
