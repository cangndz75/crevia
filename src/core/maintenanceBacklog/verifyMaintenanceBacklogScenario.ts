import { buildOperationReadinessSnapshot } from '@/core/operationReadiness/operationReadinessModel';

import {
  buildMaintenanceBacklogSnapshot,
  buildMaintenanceBacklogItems,
  dedupeMaintenanceBacklogItems,
  deriveMaintenanceSeverity,
  selectTopMaintenanceItems,
} from './maintenanceBacklogModel';
import {
  buildEceMaintenanceHint,
  buildMaintenanceDispatchHint,
  buildMaintenanceFieldHint,
  buildMaintenanceReportInsight,
  buildMaintenanceResultHint,
} from './maintenanceBacklogPresentation';

type Check = { ok: boolean; name: string; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail: string) {
  checks.push({ ok, name, detail });
}

export function verifyMaintenanceBacklogScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];

  const readySnapshot = buildOperationReadinessSnapshot({
    phase: 'dispatch',
    assignmentStatus: 'ready',
    hasVehicle: true,
    compatibilityBand: 'high',
    compatibilityTone: 'positive',
  });
  const readyBacklog = buildMaintenanceBacklogSnapshot({ readinessSnapshot: readySnapshot });
  assert(checks, readyBacklog.items.length === 0, 'ready produces no items', `${readyBacklog.items.length}`);

  const limitedSnapshot = buildOperationReadinessSnapshot({
    phase: 'dispatch',
    assignmentStatus: 'partial',
    hasVehicle: true,
    compatibilityBand: 'medium',
    compatibilityTone: 'neutral',
    publicSatisfactionPreview: -1,
  });
  const limitedItems = buildMaintenanceBacklogItems({ readinessSnapshot: limitedSnapshot });
  assert(
    checks,
    limitedItems.length > 0 && limitedItems.every((i) => i.severity === 'attention' || i.severity === 'watch'),
    'limited produces watch/attention',
    limitedItems.map((i) => i.severity).join(','),
  );

  const strainedSnapshot = buildOperationReadinessSnapshot({
    phase: 'field',
    hasVehicle: true,
    assignmentEffectBand: 'low',
    planStrategyId: 'rapid_response',
    eventRiskLevel: 'high',
  });
  const strainedItems = buildMaintenanceBacklogItems({ readinessSnapshot: strainedSnapshot });
  assert(
    checks,
    strainedItems.some((i) => i.status === 'queued_preview' || i.status === 'recommended'),
    'strained produces queued_preview/recommended',
    strainedItems.map((i) => i.status).join(','),
  );

  const blockedSnapshot = buildOperationReadinessSnapshot({
    phase: 'dispatch',
    assignmentStatus: 'missing',
    hasVehicle: false,
  });
  const blockedBacklog = buildMaintenanceBacklogSnapshot({ readinessSnapshot: blockedSnapshot });
  assert(
    checks,
    blockedBacklog.hasCritical && blockedBacklog.items.some((i) => i.severity === 'critical'),
    'blocked produces critical',
    blockedBacklog.items.map((i) => i.severity).join(','),
  );

  assert(
    checks,
    !blockedBacklog.items.some((i) => i.domain === 'social' as never),
    'social not a maintenance domain',
    'ok',
  );

  const manyItems = buildMaintenanceBacklogItems({ readinessSnapshot: strainedSnapshot });
  const deduped = dedupeMaintenanceBacklogItems(manyItems);
  assert(checks, deduped.length <= 3, 'max 3 visible items', `${deduped.length}`);

  const emptyBacklog = buildMaintenanceBacklogSnapshot({
    readinessSnapshot: buildOperationReadinessSnapshot({ phase: 'dispatch' }),
  });
  assert(checks, emptyBacklog.summary.length > 0, 'empty context fallback', emptyBacklog.summary);

  const reportLine = buildMaintenanceReportInsight(blockedBacklog, []);
  const duplicateReport = buildMaintenanceReportInsight(blockedBacklog, [blockedBacklog.summary]);
  assert(checks, reportLine !== null, 'report insight exists', reportLine ?? 'null');
  assert(checks, duplicateReport === null, 'report dedupe', duplicateReport ?? 'null');

  const eceHint = buildEceMaintenanceHint(blockedBacklog, []);
  const eceDup = buildEceMaintenanceHint(blockedBacklog, [eceHint ?? '']);
  assert(checks, eceHint !== null, 'ece hint exists', eceHint ?? 'null');
  assert(checks, eceDup === null, 'ece dedupe', eceDup ?? 'null');

  const dispatchHint = buildMaintenanceDispatchHint(strainedBacklogFromSnapshot(strainedSnapshot), []);
  assert(checks, dispatchHint !== null, 'dispatch hint', dispatchHint?.text ?? 'null');

  const fieldHint = buildMaintenanceFieldHint(strainedBacklogFromSnapshot(strainedSnapshot), []);
  assert(checks, fieldHint !== null, 'field hint', fieldHint?.text ?? 'null');

  const resultHint = buildMaintenanceResultHint(strainedBacklogFromSnapshot(strainedSnapshot), []);
  assert(checks, resultHint !== null, 'result hint', resultHint ?? 'null');

  const top = selectTopMaintenanceItems(manyItems, 2);
  assert(checks, top.length <= 2, 'select top 2', `${top.length}`);

  assert(
    checks,
    deriveMaintenanceSeverity('ready') === null,
    'ready severity null',
    String(deriveMaintenanceSeverity('ready')),
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'OK' : 'FAIL'} ${c.name}: ${c.detail}`),
  };
}

function strainedBacklogFromSnapshot(
  snapshot: ReturnType<typeof buildOperationReadinessSnapshot>,
) {
  return buildMaintenanceBacklogSnapshot({ readinessSnapshot: snapshot });
}
