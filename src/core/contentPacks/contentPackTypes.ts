import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

export type ContentPackEventDomain =
  | 'container'
  | 'district_specific'
  | 'route'
  | 'vehicle'
  | 'personnel'
  | 'social'
  | 'crisis_adjacent';

export type ContentPackEventIntensity = 'low' | 'medium' | 'high';

export type ContentPackEventPhase =
  | 'pilot'
  | 'post_pilot_light'
  | 'main_operation_full';

export type ContentPackDecisionHint = {
  optionKind:
    | 'fast_response'
    | 'preventive_route'
    | 'balanced_dispatch'
    | 'communication_first'
    | 'monitor_only';
  label: string;
  gain: string;
  tradeOff: string;
  carryOver: string;
};

export type ContentPackEventTemplate = {
  id: string;
  title: string;
  districtId: MapDistrictId;
  domain: ContentPackEventDomain;
  intensity: ContentPackEventIntensity;
  phase: ContentPackEventPhase[];
  preferredPilotDays?: number[];
  avoidPilotDays?: number[];
  sceneText: string;
  pressureText: string;
  decisionContextText: string;
  shortTermEffectText: string;
  tradeOffText: string;
  carryOverText: string;
  socialEchoText: string;
  advisorEchoText: string;
  reportEchoText: string;
  tags: string[];
  auditTargetScore: number;
  decisionHints?: ContentPackDecisionHint[];
};
