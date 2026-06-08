import type { ContentPackFullPlanningAuditResult } from './contentRuntimeActivationFullPlanningTypes';

export function formatContentPackFullPlanningSummary(result: ContentPackFullPlanningAuditResult): string {
  const pass = result.checks.filter((c) => c.status === 'PASS').length;
  const fail = result.checks.filter((c) => c.status === 'FAIL').length;
  const warn = result.checks.filter((c) => c.status === 'WARN').length;
  return [
    `Readiness: ${result.readinessScore.overallReadiness}`,
    `Score avg ~${Math.round(
      (result.readinessScore.catalogCoverageScore +
        result.readinessScore.duplicateRiskScore +
        result.readinessScore.storyChainRiskScore) /
        3,
    )}`,
    `Checks: ${pass} PASS, ${warn} WARN, ${fail} FAIL`,
    `Runtime Full: ${result.implementationBlocked ? 'BLOCKED (plan only)' : 'OPEN'}`,
    result.readinessScore.summaryLine,
  ].join(' | ');
}

export function formatDistrictBalanceRiskLine(
  result: ContentPackFullPlanningAuditResult,
): string {
  const { overloadedDistricts, underusedDistricts } = result.districtBalanceRisk;
  if (overloadedDistricts.length === 0 && underusedDistricts.length === 0) {
    return 'District balance: even coverage planned.';
  }
  return `District balance: overloaded [${overloadedDistricts.join(', ')}], underused [${underusedDistricts.join(', ')}].`;
}
