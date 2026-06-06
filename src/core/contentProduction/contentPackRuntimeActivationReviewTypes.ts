export type CreviaContentPackActivationHealthStatus = 'PASS' | 'WARN' | 'BLOCKED';

export type CreviaContentPackActivationReadinessArea =
  | 'total_family_count'
  | 'total_variant_count'
  | 'district_coverage'
  | 'domain_coverage'
  | 'variant_kind_coverage'
  | 'echo_surface_coverage'
  | 'duplicate_cross_pack_collision'
  | 'mobile_copy_guard'
  | 'forbidden_copy_guard'
  | 'crisis_panic_wording_guard'
  | 'district_tone_differentiation'
  | 'selection_engine_compatibility'
  | 'variant_adapter_compatibility'
  | 'freshness_guard_compatibility'
  | 'story_chain_compatibility'
  | 'operation_era_compatibility'
  | 'day_1_safety'
  | 'day_8_suitability'
  | 'v11_activation_risk';

export type CreviaContentPackActivationDecision =
  | 'ready_for_v11_review'
  | 'ready_for_v11_review_but_not_now'
  | 'needs_balance_tuning'
  | 'needs_copy_cleanup'
  | 'needs_runtime_adapter_design'
  | 'blocked_by_freeze'
  | 'not_ready';

export type CreviaContentPackActivationRisk = {
  id: string;
  title: string;
  severity: 'blocker' | 'warning';
  message: string;
  recommendation: string;
};

export type CreviaContentPackActivationBlocker = {
  id: string;
  title: string;
  message: string;
  recommendation: string;
};

export type CreviaContentPackActivationWarning = {
  id: string;
  title: string;
  message: string;
  recommendation: string;
};

export type CreviaContentPackActivationRecommendation = {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
};

export type CreviaContentPackV11BacklogItem = {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  dependsOn?: string[];
};

export type CreviaContentPackActivationPackSummary = {
  packId: string;
  familyCount: number;
  variantCount: number;
  districtDistribution: Record<string, number>;
  domainDistribution: Record<string, number>;
  variantKindCoverage: string[];
  auditScore: number;
  warnCount: number;
  failCount: number;
  runtimeLinked: boolean;
  activationRecommendation: CreviaContentPackActivationDecision;
};

export type CreviaContentPackActivationAreaResult = {
  area: CreviaContentPackActivationReadinessArea;
  health: CreviaContentPackActivationHealthStatus;
  message: string;
  detail?: string;
};

export type CreviaContentPackActivationSoftLaunchFindings = {
  activationReviewPresent: boolean;
  runtimeActivationBlockedByFreeze: boolean;
  packCoverageSufficient: boolean;
  v11BacklogDefined: boolean;
  activationNotRequiredForSoftLaunch: boolean;
};

export type CreviaContentPackRuntimeActivationReviewResult = {
  health: CreviaContentPackActivationHealthStatus;
  decision: CreviaContentPackActivationDecision;
  packSummaries: CreviaContentPackActivationPackSummary[];
  areaResults: CreviaContentPackActivationAreaResult[];
  blockers: CreviaContentPackActivationBlocker[];
  warnings: CreviaContentPackActivationWarning[];
  risks: CreviaContentPackActivationRisk[];
  recommendations: CreviaContentPackActivationRecommendation[];
  v11Backlog: CreviaContentPackV11BacklogItem[];
  softLaunchFindings: CreviaContentPackActivationSoftLaunchFindings;
  totalFamilyCount: number;
  totalVariantCount: number;
  freezeActive: boolean;
  runtimeActivationPerformed: boolean;
  eventGenerationChanged: boolean;
  docsPath: string;
};

export type RunContentPackRuntimeActivationReviewOptions = {
  mode?: 'review_only' | 'pre_activation_check';
};
