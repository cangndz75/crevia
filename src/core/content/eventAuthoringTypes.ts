import type { AuthorityPermissionId } from '@/core/authority/authorityTypes';
import type { BadgeId } from '@/core/badges/badgeTypes';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

export type EventPackId =
  | 'pilot_core'
  | 'district_cumhuriyet'
  | 'district_merkez'
  | 'district_sanayi'
  | 'district_istasyon'
  | 'district_yesilvadi'
  | 'post_pilot_light'
  | 'crisis_pack_future'
  | 'social_pack_future';

export type EventAuthoringPhase =
  | 'pilot'
  | 'post_pilot_light'
  | 'future_main_operation';

export type EventSystemFocus =
  | 'operations'
  | 'social'
  | 'container'
  | 'vehicle'
  | 'personnel'
  | 'resources'
  | 'crisis'
  | 'route'
  | 'district_identity'
  | 'post_pilot';

export type EventDecisionIntent =
  | 'inspect'
  | 'plan'
  | 'dispatch'
  | 'field'
  | 'communicate'
  | 'allocate_resource'
  | 'reduce_risk'
  | 'stabilize_social'
  | 'protect_personnel'
  | 'optimize_route';

export type EventAuthoringSeverity = 'low' | 'medium' | 'high' | 'critical';

export type EventExpectedResultTone = 'positive' | 'balanced' | 'risky' | 'crisis';

export type EventAuthoringProfile = {
  id: string;
  title: string;
  districtId: MapDistrictId;
  packId: EventPackId;
  phase: EventAuthoringPhase;
  dayRange?: {
    min: number;
    max: number;
  };
  primarySystem: EventSystemFocus;
  secondarySystems: EventSystemFocus[];
  severity: EventAuthoringSeverity;
  decisionIntent: EventDecisionIntent[];
  districtFitReason: string;
  authorityPreviewHints: AuthorityPermissionId[];
  badgeProgressHints: BadgeId[];
  expectedResultTone: EventExpectedResultTone;
  resultCopyNotes: string[];
  reportCopyNotes: string[];
};

export type EventPackTargetCounts = {
  anchor: number;
  side: number;
  quickOpportunity?: number;
  finalPressure?: number;
  socialMentionLinked?: number;
  crisisLightPressure?: number;
  vehicleContainerLinked?: number;
  postPilotLightSpecific?: number;
  socialEnvironment?: number;
};

export type EventPackDefinition = {
  id: EventPackId;
  title: string;
  goal: string;
  theme: string;
  phase: EventAuthoringPhase;
  districtId?: MapDistrictId;
  targetCounts: EventPackTargetCounts;
  risks: string[];
  /** Oyuna eklenmiş içerik paketi mi (yalnızca plan). */
  implemented: boolean;
  /** Yeni route/screen gerektirir mi — Aşama 1 planında hep false. */
  requiresNewRoute: boolean;
  requiresNewGameplay: boolean;
  /** Post-pilot günlük event üst sınırı notu. */
  dailyEventCapNote?: string;
  expansionPlanNote?: string;
};

export type EventAuthoringStandardField = {
  order: number;
  key: string;
  label: string;
  description: string;
};

export type EventQualityChecklistItem = {
  id: string;
  question: string;
};

export type EventTextStyleGuide = {
  recommendedTone: string[];
  avoidedTone: string[];
};
