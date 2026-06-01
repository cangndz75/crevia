export type FinalPolishRoadmapGroup =
  | 'scope_freeze'
  | 'anti_boredom_core'
  | 'content_safety_pack'
  | 'decision_visibility'
  | 'dynamic_map_presence'
  | 'resource_visual_states'
  | 'advisor_depth'
  | 'premium_wow'
  | 'post_pilot_variety'
  | 'analytics_sdk'
  | 'monetization_iap'
  | 'manual_playtest'
  | 'release_candidate'
  | 'ai_later';

export type FinalPolishPriority =
  | 'mandatory'
  | 'critical'
  | 'high'
  | 'medium'
  | 'later';

export type FinalPolishStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'blocked'
  | 'later';

export type FinalPolishSoftLaunchImpact = 'low' | 'medium' | 'high' | 'critical';

export type FinalPolishRiskLevel = 'low' | 'medium' | 'high';

export type FinalPolishRoadmapItem = {
  id: string;
  title: string;
  group: FinalPolishRoadmapGroup;
  priority: FinalPolishPriority;
  status: FinalPolishStatus;
  softLaunchImpact: FinalPolishSoftLaunchImpact;
  riskLevel: FinalPolishRiskLevel;
  requiresPersistChange: boolean;
  allowsNewRoute: boolean;
  allowsGameplayCoreChange: boolean;
  description: string;
  acceptanceChecks: string[];
  forbiddenChanges: string[];
};

export type FinalPolishGuardSeverity = 'blocker' | 'fail' | 'warn' | 'info';

export type FinalPolishGuardCheckType = 'manual' | 'static' | 'scenario';

export type FinalPolishGuard = {
  id: string;
  title: string;
  severity: FinalPolishGuardSeverity;
  description: string;
  appliesToGroups: FinalPolishRoadmapGroup[];
  checkType: FinalPolishGuardCheckType;
  expectedBehavior: string;
};

export type FinalPolishRoadmapSummary = {
  totalItems: number;
  byStatus: Record<FinalPolishStatus, number>;
  byPriority: Record<FinalPolishPriority, number>;
  mandatoryIncomplete: number;
  criticalIncomplete: number;
};

export type FinalPolishGroupSummary = {
  group: FinalPolishRoadmapGroup;
  title: string;
  itemCount: number;
  completedCount: number;
  inProgressCount: number;
  blockedCount: number;
};

export type FinalPolishReadinessLine = {
  severity: FinalPolishGuardSeverity;
  message: string;
};

export type FinalPolishVerifyOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};
