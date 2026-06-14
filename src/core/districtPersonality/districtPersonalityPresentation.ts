import {
  type DistrictCriterionId,
  type DistrictPersonalityAdvisorContext,
  type DistrictPersonalityEventContext,
  type DistrictPersonalityProfile,
  type DistrictRetentionHint,
} from './districtPersonalityTypes';
import { getDistrictPersonalityLine } from './districtPersonalityContentLines';

function clampPriority(priority: number): number {
  return Math.max(0, Math.min(100, Math.round(priority)));
}

function criterionLine(
  profile: DistrictPersonalityProfile,
  criterionId: DistrictCriterionId | undefined,
  kind: Parameters<typeof getDistrictPersonalityLine>[1],
): string {
  return getDistrictPersonalityLine(criterionId ?? profile.primaryCriterionId, kind);
}

export function buildDistrictPersonalityEventContext(
  profile: DistrictPersonalityProfile,
): DistrictPersonalityEventContext {
  const primary = profile.primaryCriterionId;
  const decisionShapeHint =
    primary === 'route_difficulty'
      ? 'fast_vs_costly'
      : primary === 'social_sensitivity'
        ? 'social_vs_resource'
        : primary === 'container_density'
          ? 'repair_vs_prevent'
          : primary === 'trust_fragility'
            ? 'safe_vs_risky'
            : primary === 'neglect_risk'
              ? 'short_term_vs_long_term'
              : primary === 'recovery_potential'
                ? 'short_term_vs_long_term'
                : undefined;

  return {
    domainBiases: profile.eventBias.preferredDomains,
    pressureBiases: profile.eventBias.pressureHints,
    decisionShapeHint,
    inspectLine: criterionLine(profile, primary, 'event_inspect'),
    planLine: criterionLine(profile, primary, 'event_plan'),
    strategyCautionLine: profile.strategyBias.recommendedCautionLine,
  };
}

export function buildDistrictPersonalityMapContext(profile: DistrictPersonalityProfile): {
  preferredMapRoles: DistrictPersonalityProfile['mapBias']['preferredMapRoles'];
  mapSignalLine: string;
  sourceKinds: DistrictPersonalityProfile['criteria'][number]['sourceKinds'];
  sourceIds: string[];
  confidence: DistrictPersonalityProfile['confidence'];
} {
  const criterion = profile.criteria.find((item) => item.id === profile.primaryCriterionId);
  return {
    preferredMapRoles: profile.mapBias.preferredMapRoles,
    mapSignalLine: profile.mapBias.mapSignalLine,
    sourceKinds: criterion?.sourceKinds ?? ['fallback'],
    sourceIds: profile.sourceIds,
    confidence: profile.confidence,
  };
}

export function buildDistrictPersonalityAdvisorLine(
  profile: DistrictPersonalityProfile,
  context: DistrictPersonalityAdvisorContext,
): string | undefined {
  if ((context.day ?? 1) <= 1 && context.phase !== 'inspect') {
    return undefined;
  }
  if (context.permissionVisibility === 'hidden') {
    return undefined;
  }

  const criterionId = context.activeCriterionId ?? profile.primaryCriterionId;
  const kind =
    context.phase === 'plan'
      ? 'event_plan'
      : context.phase === 'report'
        ? 'report_note'
        : context.phase === 'retention'
          ? 'retention_hook'
          : 'ece_hint';
  const line = criterionLine(profile, criterionId, kind);
  if (profile.confidence === 'low' || context.sourceConfidence === 'low') {
    return `Veri sinirli; ${line.charAt(0).toLocaleLowerCase('tr-TR')}${line.slice(1)}`;
  }
  return line;
}

export function buildDistrictRetentionHint(
  profile: DistrictPersonalityProfile,
  context: { day?: number; hasLiveSource?: boolean } = {},
): DistrictRetentionHint {
  const primary = profile.criteria.find((criterion) => criterion.id === profile.primaryCriterionId);
  const hasLiveSource =
    context.hasLiveSource ??
    (primary?.sourceKinds.some(
      (kind) => kind !== 'design_baseline' && kind !== 'district_identity' && kind !== 'fallback',
    ) ??
      false);
  const line =
    profile.retentionHookHint ??
    getDistrictPersonalityLine(profile.primaryCriterionId, 'retention_hook');

  return {
    districtId: profile.districtId,
    title: `${profile.districtName} takibi`,
    line,
    priority: clampPriority((primary?.score ?? 30) + (hasLiveSource ? 12 : 0)),
    sourceKinds: primary?.sourceKinds ?? ['fallback'],
    isActionable: (context.day ?? 1) >= 2 && hasLiveSource && profile.confidence !== 'low',
  };
}
