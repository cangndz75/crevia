import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

export type DistrictTrustLevel =
  | 'fragile'
  | 'watch'
  | 'neutral'
  | 'stable'
  | 'trusted'
  | 'supportive';

export type DistrictTrustTrend =
  | 'falling'
  | 'strained'
  | 'steady'
  | 'improving'
  | 'recovering';

export type DistrictTrustSignalSource =
  | 'district_identity'
  | 'operation_signal'
  | 'social_pulse'
  | 'recent_event'
  | 'carry_over'
  | 'resource_fatigue'
  | 'crisis_state'
  | 'report_summary'
  | 'fallback';

export type DistrictTrustPressureDomain =
  | 'container'
  | 'vehicle_route'
  | 'personnel'
  | 'social'
  | 'crisis'
  | 'district_balance'
  | 'resource_recovery'
  | 'generic';

export type DistrictTrustMemoryKind =
  | 'recent_improvement'
  | 'repeated_pressure'
  | 'unresolved_carry_over'
  | 'public_confidence_gain'
  | 'resource_strain'
  | 'crisis_watch'
  | 'recovery_window'
  | 'stable_operation';

export type DistrictTrustVisibilityMode =
  | 'hidden'
  | 'compact'
  | 'standard'
  | 'detailed';

export type DistrictTrustMemoryItem = {
  id: string;
  districtId: MapDistrictId;
  kind: DistrictTrustMemoryKind;
  title: string;
  description: string;
  source: DistrictTrustSignalSource;
  tone: 'positive' | 'neutral' | 'warning';
  day?: number;
  priority: number;
};

export type DistrictTrustScoreInput = {
  districtId: MapDistrictId | string;
  operationSignals?: unknown;
  socialPulse?: unknown;
  recentEvents?: unknown;
  carryOver?: unknown;
  resourceFatigue?: unknown;
  crisisState?: unknown;
  reportSummary?: unknown;
  day?: number;
  rankPermissionUnlocked?: boolean;
};

export type DistrictTrustScoreResult = {
  districtId: MapDistrictId;
  score: number;
  level: DistrictTrustLevel;
  trend: DistrictTrustTrend;
  pressureDomains: DistrictTrustPressureDomain[];
  signalSources: DistrictTrustSignalSource[];
  confidence: 'low' | 'medium' | 'high';
  isVisibleToPlayer: boolean;
  reasonLines: string[];
  memoryItems: DistrictTrustMemoryItem[];
};

export type DistrictTrustPresentationModel = {
  districtId: MapDistrictId;
  title: string;
  shortLabel: string;
  scoreLabel: string;
  levelLabel: string;
  trendLabel: string;
  tone: 'positive' | 'neutral' | 'warning';
  iconKey?: string;
  chipText: string;
  summaryLine: string;
  memoryLine?: string;
  pressureChips: string[];
  visibilityLine?: string;
};

export type DistrictTrustAuditResult = {
  status: 'PASS' | 'WARN' | 'FAIL';
  message: string;
  details?: string;
};
