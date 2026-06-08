import type { ContentRuntimeActivationEventMeta } from '@/core/contentRuntimeActivation/contentRuntimeActivationTypes';
import type { CarryOverMemoryModel } from '@/core/carryOver/carryOverMemoryTypes';
import type { CityArchiveV1State } from '@/core/cityArchive/cityArchiveTypes';
import type { CityEchoBinding } from '@/core/cityEchoBinding/cityEchoBindingTypes';
import type { EventCard } from '@/core/models/EventCard';
import type { CreviaDistrictTrustBand } from '@/core/districtTrustRuntime/districtTrustRuntimeTypes';
import type { PostPilotPhase } from '@/core/postPilot/postPilotOperationTypes';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskTypes';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

export type DistrictReportCardLiteVisibility =
  | 'hidden'
  | 'compact'
  | 'standard'
  | 'detailed_preview';

export type DistrictReportCardLiteStatusTone =
  | 'stable'
  | 'watch'
  | 'strained'
  | 'recovering'
  | 'improving'
  | 'trusted'
  | 'fragile';

export type DistrictReportCardLitePriority = 'low' | 'medium' | 'high';

export type DistrictReportCardDominantIssueKind =
  | 'route_pressure'
  | 'container_pressure'
  | 'personnel_fatigue'
  | 'vehicle_fatigue'
  | 'social_trust'
  | 'district_trust'
  | 'visible_service'
  | 'environmental_care'
  | 'recovery_momentum'
  | 'crisis_prevention'
  | 'resource_balance'
  | 'operation_scope'
  | 'stable_identity'
  | 'fallback';

export type DistrictReportCardRecentEffectKind =
  | 'carry_over'
  | 'decision_echo'
  | 'memory_pressure'
  | 'trust_shift'
  | 'content_pack'
  | 'operation_signal'
  | 'fallback';

export type DistrictReportCardLiteSourceSignals = {
  hasTrustRuntime: boolean;
  hasMemoryRuntime: boolean;
  hasOperationsRuntime: boolean;
  hasCarryOver: boolean;
  hasContentPack: boolean;
  hasTomorrowRisk: boolean;
  hasCityEcho: boolean;
  hasOperationSignals: boolean;
  hasResourceFatigue: boolean;
  hasSocialPulse: boolean;
};

export type DistrictReportCardLiteModel = {
  districtId: MapDistrictId;
  districtName: string;
  day: number;
  visible: boolean;
  visibility: DistrictReportCardLiteVisibility;
  trustBand?: CreviaDistrictTrustBand;
  trustLabel?: string;
  trustLine?: string;
  dominantIssueKind: DistrictReportCardDominantIssueKind;
  dominantIssueLabel: string;
  dominantIssueLine: string;
  recentEffectKind: DistrictReportCardRecentEffectKind;
  recentEffectLine: string;
  eceLine?: string;
  socialToneLine?: string;
  operationLine?: string;
  memoryLine?: string;
  contentPackLine?: string;
  tomorrowLine?: string;
  statusTone: DistrictReportCardLiteStatusTone;
  priority: DistrictReportCardLitePriority;
  sourceSignals: DistrictReportCardLiteSourceSignals;
  maxVisibleLines: number;
  duplicateKey: string;
};

export type DistrictReportCardLiteInput = {
  districtId?: MapDistrictId | string | null;
  day?: number;
  isPostPilot?: boolean;
  isPilotCompleted?: boolean;
  postPilotPhase?: PostPilotPhase | null;
  accessMode?: 'none' | 'limited' | 'full';
  crisisState?: unknown;
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
  carryOverMemory?: CarryOverMemoryModel | null;
  tomorrowRisk?: TomorrowRiskModel | null;
  cityEcho?: CityEchoBinding | null;
  contentPackMeta?: ContentRuntimeActivationEventMeta | null;
  activeEvent?: EventCard | null;
  recentEvents?: EventCard[];
  existingLines?: string[];
  mainOperationScopeHintLine?: string | null;
  mapIntelligenceLines?: string[];
};

export type DistrictReportCardMapPresentation = {
  title: string;
  statusChipLabel?: string;
  primaryLine?: string;
  recentEffectLine?: string;
  publicToneLine?: string;
  recoveryLine?: string;
  recentEvents?: DistrictReportRecentEvent[];
  eceLine?: string;
  visibleLineCount: number;
};

export type DistrictReportCardFullVisibility =
  | 'hidden'
  | 'compact'
  | 'standard'
  | 'full_preview';

export type DistrictReportPublicTone =
  | 'calm'
  | 'watchful'
  | 'thankful'
  | 'strained'
  | 'recovering'
  | 'frustrated_soft'
  | 'confident'
  | 'mixed'
  | 'unknown';

export type DistrictReportPlayerStyleKind =
  | 'fast_responder'
  | 'social_trust_focused'
  | 'route_balancer'
  | 'resource_guardian'
  | 'recovery_builder'
  | 'balanced_operator'
  | 'unknown';

export type DistrictReportRecoveryState =
  | 'stable'
  | 'improving'
  | 'recovering'
  | 'comeback_available'
  | 'comeback_completed'
  | 'still_under_watch'
  | 'unknown';

export type DistrictReportRecentEventTone =
  | 'positive'
  | 'warning'
  | 'recovery'
  | 'neutral';

export type DistrictReportRecentEvent = {
  id: string;
  day: number;
  kind: string;
  title: string;
  shortLine: string;
  tone: DistrictReportRecentEventTone;
  sourceKind: string;
  priority: DistrictReportCardLitePriority;
};

export type DistrictReportCardFullSourceSignals = DistrictReportCardLiteSourceSignals & {
  hasCityArchive: boolean;
  hasArchiveDistrictSummary: boolean;
  hasArchiveRewardComeback: boolean;
  hasArchiveEceSummary: boolean;
};

export type DistrictReportCardFullModel = {
  districtId: MapDistrictId;
  districtName: string;
  day: number;
  visible: boolean;
  visibility: DistrictReportCardFullVisibility;
  trustBand?: CreviaDistrictTrustBand;
  trustTrend: 'down' | 'flat' | 'up' | 'recovered' | 'unknown';
  trustLabel?: string;
  trustLine?: string;
  dominantIssueKind: DistrictReportCardDominantIssueKind;
  dominantIssueLabel: string;
  dominantIssueLine: string;
  recentArchiveEvents: DistrictReportRecentEvent[];
  publicTone: DistrictReportPublicTone;
  publicToneLine: string;
  playerStyleInDistrict: DistrictReportPlayerStyleKind;
  playerStyleLine?: string;
  recoveryState: DistrictReportRecoveryState;
  recoveryLine?: string;
  resourcePressureState: 'none' | 'low' | 'medium' | 'high' | 'unknown';
  eceDistrictLine?: string;
  socialToneLine?: string;
  mapLine?: string;
  hubLine?: string;
  reportLine?: string;
  detailLines: string[];
  sourceSignals: DistrictReportCardFullSourceSignals;
  duplicateKey: string;
  maxVisibleRecentEvents: number;
  /** Lite uyumluluk */
  recentEffectLine: string;
  recentEffectKind: DistrictReportCardRecentEffectKind;
  statusTone: DistrictReportCardLiteStatusTone;
  priority: DistrictReportCardLitePriority;
  maxVisibleLines: number;
  /** Lite uyumluluk — downstream map/reward helpers */
  eceLine?: string;
};

export type DistrictReportCardSurfaceModel =
  | DistrictReportCardLiteModel
  | DistrictReportCardFullModel;

export type DistrictReportCardFullInput = DistrictReportCardLiteInput & {
  cityArchive?: CityArchiveV1State | null;
  advisorRelationshipLine?: string | null;
  rewardComebackLine?: string | null;
  mapReactionLine?: string | null;
  operationalResourceLine?: string | null;
};
