import type { CityArchivePlanningAuditResult } from './cityArchivePlanningTypes';

export function buildCityArchivePlanningConsoleSummary(result: CityArchivePlanningAuditResult): string {
  const passCount = result.checks.filter((check) => check.status === 'PASS').length;
  const failCount = result.checks.filter((check) => check.status === 'FAIL').length;

  return [
    '=== Crevia City Archive Persistence V1 Planning ===',
    `overall=${result.ok ? 'ready' : 'blocked'} | targetModel=${result.targetModelReady ? 'ready' : 'blocked'} | migration=${result.migrationPlanReady ? 'ready' : 'blocked'} | integration=${result.integrationPlanReady ? 'ready' : 'blocked'} | safety=${result.safetyReady ? 'ready' : 'blocked'}`,
    `checks=${passCount} PASS, ${failCount} FAIL`,
    'implementation=started | persist_shape=cityArchive | save_version=24',
  ].join('\n');
}
