import type { ContentRuntimeActivationEventMeta } from '@/core/contentRuntimeActivation/contentRuntimeActivationTypes';
import type { CarryOverMemoryModel } from '@/core/carryOver/carryOverMemoryTypes';
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
  eceLine?: string;
  visibleLineCount: number;
};
