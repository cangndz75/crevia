import type { CreviaMapLayerId } from '@/core/mapLayers/mapLayerTypes';

export type CreviaContentPackId = string;

export type CreviaContentPackStatus =
  | 'draft'
  | 'qa'
  | 'ready'
  | 'live'
  | 'deprecated'
  | 'archived';

export type CreviaContentPackKind =
  | 'pilot_core'
  | 'open_operation_core'
  | 'district_pack'
  | 'event_family_pack'
  | 'operation_era_pack'
  | 'social_echo_pack'
  | 'report_echo_pack'
  | 'map_hint_pack'
  | 'recovery_reward_pack'
  | 'crisis_adjacent_pack'
  | 'live_ops_theme'
  | 'future_expansion';

export type CreviaContentProductionSurface =
  | 'event_family'
  | 'event_variant'
  | 'district_operation'
  | 'operation_era'
  | 'social_echo'
  | 'report_echo'
  | 'advisor_echo'
  | 'map_hint'
  | 'tomorrow_preview'
  | 'operation_result'
  | 'hub'
  | 'report'
  | 'map';

export type CreviaContentCoverageDimension =
  | 'district'
  | 'domain'
  | 'variant_kind'
  | 'echo_surface'
  | 'operation_era'
  | 'district_operation'
  | 'player_style'
  | 'reward_recovery'
  | 'crisis_adjacent'
  | 'map_layer'
  | 'rank_permission';

export type CreviaContentQualityStatus = 'pass' | 'warn' | 'fail';

export type CreviaContentIssueSeverity = 'info' | 'warn' | 'fail' | 'blocker';

export type CreviaContentIssueKind =
  | 'missing_district_coverage'
  | 'missing_domain_coverage'
  | 'missing_variant_coverage'
  | 'missing_echo_surface'
  | 'duplicate_risk'
  | 'forbidden_copy'
  | 'weak_district_identity'
  | 'weak_tradeoff'
  | 'weak_carry_over'
  | 'mobile_length_risk'
  | 'missing_operation_era_link'
  | 'missing_rank_permission_link'
  | 'missing_map_hint'
  | 'stale_pack'
  | 'future_only_content';

export type CreviaContentCopyBlock = {
  id: string;
  surface: CreviaContentProductionSurface;
  text: string;
  maxRecommendedLength?: number;
  isPlayerFacing: boolean;
  language: string;
};

export type CreviaContentPackItem = {
  id: string;
  packId: string;
  surface: CreviaContentProductionSurface;
  title: string;
  districtIds: string[];
  domains: string[];
  operationEraIds: string[];
  eventFamilyIds?: string[];
  variantKinds?: string[];
  echoSurfaces?: CreviaContentProductionSurface[];
  mapLayerIds?: CreviaMapLayerId[];
  rankPermissionIds?: string[];
  tags: string[];
  copyBlocks: CreviaContentCopyBlock[];
  metadata?: Record<string, string | number | boolean>;
};

export type CreviaContentPackDefinition = {
  id: CreviaContentPackId;
  title: string;
  description: string;
  kind: CreviaContentPackKind;
  status: CreviaContentPackStatus;
  version: string;
  owner?: string;
  targetDistrictIds: string[];
  targetDomains: string[];
  targetOperationEraIds: string[];
  targetSurfaces: CreviaContentProductionSurface[];
  relatedRankPermissionIds: string[];
  relatedMapLayerIds: CreviaMapLayerId[];
  releaseNotes: string;
  createdForPhase: string;
  isRuntimeLinked: boolean;
  isFutureOnly: boolean;
  items: CreviaContentPackItem[];
};

export type CreviaContentCoverageTarget = {
  dimension: CreviaContentCoverageDimension;
  id: string;
  label: string;
  minimumCount: number;
  recommendedCount: number;
  priority: number;
};

export type CreviaContentCoverageResult = {
  dimension: CreviaContentCoverageDimension;
  id: string;
  label: string;
  count: number;
  minimumCount: number;
  recommendedCount: number;
  status: CreviaContentQualityStatus;
  missingCount: number;
  relatedItemIds: string[];
};

export type CreviaContentDuplicateRiskResult = {
  itemAId: string;
  itemBId: string;
  similarityScore: number;
  sharedTags: string[];
  sharedDomains: string[];
  sharedDistricts: string[];
  sharedSurfaces: string[];
  status: CreviaContentQualityStatus;
  reasonLine: string;
};

export type CreviaContentEchoCompletenessResult = {
  itemId: string;
  requiredSurfaces: CreviaContentProductionSurface[];
  presentSurfaces: CreviaContentProductionSurface[];
  missingSurfaces: CreviaContentProductionSurface[];
  status: CreviaContentQualityStatus;
  reasonLine: string;
};

export type CreviaContentProductionIssue = {
  id: string;
  severity: CreviaContentIssueSeverity;
  kind: CreviaContentIssueKind;
  message: string;
  itemId?: string;
  packId?: string;
  recommendation?: string;
};

export type CreviaContentProductionAuditResult = {
  status: CreviaContentQualityStatus;
  score: number;
  passCount: number;
  warnCount: number;
  failCount: number;
  blockerCount: number;
  coverageResults: CreviaContentCoverageResult[];
  duplicateRisks: CreviaContentDuplicateRiskResult[];
  echoCompletenessResults: CreviaContentEchoCompletenessResult[];
  issues: CreviaContentProductionIssue[];
  summaryLines: string[];
};

export type CreviaContentProductionReportModel = {
  title: string;
  statusLabel: string;
  scoreLabel: string;
  summaryLines: string[];
  coverageLines: string[];
  issueLines: string[];
  nextActionLines: string[];
};

export type ContentPackValidationResult = {
  status: CreviaContentQualityStatus;
  issues: CreviaContentProductionIssue[];
};

export type ContentItemDuplicateSignature = {
  titleWords: string[];
  districtIds: string[];
  domains: string[];
  surfaces: string[];
  tags: string[];
  operationEraIds: string[];
  variantKinds: string[];
  copyKeywords: string[];
};
