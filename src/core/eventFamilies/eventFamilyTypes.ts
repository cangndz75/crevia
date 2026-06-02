import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

export type EventFamilyId = string;

export type EventFamilyDomain =
  | 'container'
  | 'vehicle_route'
  | 'personnel'
  | 'social'
  | 'crisis_adjacent'
  | 'district_balance'
  | 'resource_recovery'
  | 'authority_milestone'
  | 'operation_era'
  | 'generic_operation';

export type EventFamilyVariantKind =
  | 'normal'
  | 'improved'
  | 'worsened'
  | 'carry_over'
  | 'crisis_adjacent'
  | 'player_adaptive'
  | 'resource_fatigue'
  | 'district_trust'
  | 'reward'
  | 'comeback'
  | 'recovery'
  | 'operation_era';

export type EventFamilyAvailabilityPhase =
  | 'pilot_training'
  | 'light_main_operation'
  | 'district_responsibility'
  | 'crisis_recovery_management'
  | 'citywide_operations'
  | 'long_term_career';

export type EventFamilyEchoSurface =
  | 'advisor'
  | 'report'
  | 'social'
  | 'map'
  | 'tomorrow_preview'
  | 'operation_result'
  | 'hub'
  | 'district_memory';

export type EventFamilyTriggerSignal =
  | 'day_progression'
  | 'rank_unlock'
  | 'authority_level'
  | 'district_trust_low'
  | 'district_trust_high'
  | 'resource_fatigue'
  | 'resource_stability'
  | 'crisis_watch'
  | 'crisis_active'
  | 'player_style_fast_response'
  | 'player_style_preventive'
  | 'player_style_public_focused'
  | 'player_style_resource_guardian'
  | 'operation_era_active'
  | 'carry_over_pending';

export type EventFamilyOutcomeTone =
  | 'neutral'
  | 'positive'
  | 'strained'
  | 'recovering'
  | 'warning'
  | 'crisis_watch'
  | 'resolved';

export type EventFamilyEchoHint = {
  surface: EventFamilyEchoSurface;
  hint: string;
  required: boolean;
  maxLength?: number;
};

export type EventFamilyMapHint = {
  districtId?: MapDistrictId;
  layer: string;
  tone: EventFamilyOutcomeTone;
  markerHint?: string;
  memoryTraceHint?: string;
};

export type EventFamilyDefinition = {
  id: EventFamilyId;
  title: string;
  shortLabel: string;
  description: string;
  domain: EventFamilyDomain;
  primaryDistrictIds: MapDistrictId[];
  availabilityPhases: EventFamilyAvailabilityPhase[];
  unlockRankPermissionId?: string;
  requiredRankKey?: string;
  minAuthority?: number;
  minXp?: number;
  triggerSignals: EventFamilyTriggerSignal[];
  variantKinds: EventFamilyVariantKind[];
  echoSurfaces: EventFamilyEchoSurface[];
  outcomeTones: EventFamilyOutcomeTone[];
  qualityTags: string[];
  duplicateGuardTags: string[];
  isPreviewOnly: boolean;
  playerFacingPriority: number;
};

export type EventFamilyVariantDefinition = {
  id: string;
  familyId: EventFamilyId;
  kind: EventFamilyVariantKind;
  titlePattern: string;
  situationLine: string;
  decisionPressureLine: string;
  expectedOutcomeTone: EventFamilyOutcomeTone;
  triggerSignals: EventFamilyTriggerSignal[];
  echoHints: EventFamilyEchoHint[];
  mapHintTags: EventFamilyMapHint[];
  carryOverHint?: string;
  freshnessTags: string[];
  mobileReadabilityScore?: number;
};

export type EventFamilyQualityResult = {
  familyId: EventFamilyId;
  status: 'PASS' | 'WARN' | 'FAIL';
  score: number;
  warnings: string[];
  failures: string[];
};

export type EventFamilyPreviewModel = {
  id: EventFamilyId;
  title: string;
  domainLabel: string;
  districtLabel: string;
  variantSummary: string;
  unlockLine: string;
  echoSurfaceLabels: string[];
  statusLine: string;
};

export type EventFamilyBundle = {
  family: EventFamilyDefinition;
  variants: EventFamilyVariantDefinition[];
  coverage: {
    variantKinds: EventFamilyVariantKind[];
    echoSurfaces: EventFamilyEchoSurface[];
    outcomeTones: EventFamilyOutcomeTone[];
  };
  qualityHint: EventFamilyQualityResult;
};

export type EventFamilyValidationResult = {
  ok: boolean;
  warnings: string[];
  failures: string[];
};
