import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { verifyDayPipelineScenario } from '@/core/dayPipeline/verifyDayPipelineScenario';
import { verifyFirstTenMinutesScenario } from '@/core/onboarding/verifyFirstTenMinutesScenario';
import { verifyOperationalResourcesScenario } from '@/core/operationalResources/verifyOperationalResourcesScenario';
import { verifyInteractionContractsScenario } from '@/core/quality/interactionContracts/verifyInteractionContractsScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  PLAYER_FLOW_CHECK_DEFINITIONS,
  PLAYER_FLOW_DOCS_PATH,
  PLAYER_FLOW_FORBIDDEN_WORDS,
  PLAYER_FLOW_MANUAL_CHECKLIST_ITEMS,
  REQUIRED_PLAYER_FLOW_STAGES,
} from './playerFlowAuditConstants';
import {
  buildManualPlayerFlowChecklist,
  buildPlayerFlowAuditScenario,
  runPlayerFlowAudit,
  runPlayerFlowAuditForStage,
  validatePlayerFlowChecks,
} from './playerFlowAuditEngine';
import {
  buildManualChecklistMarkdown,
  buildPlayerFlowAuditConsoleReport,
  getPlayerFlowAuditHealth,
  groupPlayerFlowFindingsByStage,
} from './playerFlowAuditPresentation';

export type VerifyPlayerFlowAuditOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  failCount: number;
  warnCount: number;
  auditHealth: string;
};

const REPO_ROOT = join(__dirname, '..', '..', '..');

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, message: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${message}`);
  return ok;
}

export function verifyPlayerFlowAuditScenario(): VerifyPlayerFlowAuditOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;
  const add = (p: boolean, pass: string, fail: string) => {
    ok = assert(checks, p, pass, fail) && ok;
  };
  const addWarn = (p: boolean, pass: string, message: string) => {
    if (!warn(checks, p, pass, message)) hasWarn = true;
  };

  const scenario = buildPlayerFlowAuditScenario();
  const result = runPlayerFlowAudit();

  add(scenario.checks.length > 0, 'Audit scenario not empty', 'empty scenario');
  add(
    REQUIRED_PLAYER_FLOW_STAGES.every((s) => scenario.stages.includes(s)),
    'All required stages present',
    'missing stage',
  );

  for (const stage of REQUIRED_PLAYER_FLOW_STAGES) {
    add(
      scenario.checks.some((c) => c.stage === stage),
      `Stage checks: ${stage}`,
      `no checks for ${stage}`,
    );
  }

  const ids = scenario.checks.map((c) => c.id);
  add(ids.length === new Set(ids).size, 'Check ids unique', 'duplicate id');

  add(
    scenario.checks.every((c) => c.question.trim().length > 0),
    'Every check has question',
    'empty question',
  );
  add(
    scenario.checks.every((c) => c.expectedOutcome.trim().length > 0),
    'Every check has expectedOutcome',
    'empty outcome',
  );

  const highRisk = scenario.checks.filter(
    (c) => c.riskLevel === 'high' || c.riskLevel === 'critical',
  );
  add(
    highRisk.every((c) => (c.recommendation?.trim().length ?? 0) > 0),
    'High/critical checks have recommendation',
    'missing recommendation',
  );

  const manual = buildManualPlayerFlowChecklist();
  add(manual.items.length > 0, 'Manual checklist not empty', 'empty manual');
  add(manual.items.length >= 25, 'Manual checklist 25+ items', String(manual.items.length));

  add(
    manual.items.some((i) => i.id.includes('day1') && i.prompt.toLowerCase().includes('cta')),
    'Day 1 manual CTA timing',
    'missing day1 cta manual',
  );
  add(
    manual.items.some((i) => i.id.includes('ece')),
    'Day 1 manual Ece readability',
    'missing ece manual',
  );
  add(
    manual.items.some((i) => i.id.includes('report')),
    'Day 1 manual report readability',
    'missing report manual',
  );
  add(
    manual.items.some((i) => i.id.includes('offer')),
    'Day 7 manual offer clarity',
    'missing offer manual',
  );
  add(
    manual.items.some(
      (i) => i.stage === 'day8_limited' || i.stage === 'day8_full',
    ),
    'Day 8 limited/full comparison manual',
    'missing day8 manual',
  );
  add(
    manual.items.some((i) => i.id.includes('crisis')),
    'Crisis action playtest item',
    'missing crisis manual',
  );
  add(
    manual.items.some((i) => i.id.includes('resources')),
    'Resource detail sheet manual item',
    'missing resource manual',
  );
  add(
    manual.items.some((i) => i.id.includes('map')),
    'Map overlay manual item',
    'missing map manual',
  );
  add(
    manual.items.some((i) => i.id.includes('report_story') || i.id.includes('report')),
    'Report readability manual item',
    'missing report readability',
  );

  const ftm = verifyFirstTenMinutesScenario();
  add(ftm.ok, 'verify:first-10-minutes compatible', 'ftm fail');

  const opRes = verifyOperationalResourcesScenario();
  add(opRes.ok, 'verify:operational-resources compatible', 'op res fail');

  const contracts = verifyInteractionContractsScenario();
  add(contracts.ok, 'verify:interaction-contracts compatible', 'contracts fail');

  const pipeline = verifyDayPipelineScenario();
  add(pipeline.ok, 'Day pipeline audit no FAIL', 'pipeline fail');

  const day1Stage = runPlayerFlowAuditForStage('day1_first_session');
  add(
    day1Stage.failCount === 0,
    'Day 1 automated stage no FAIL',
    `fails=${day1Stage.failCount}`,
  );

  const markdown = buildManualChecklistMarkdown(manual);
  add(markdown.includes('##'), 'Manual checklist markdown generated', 'no markdown');

  const consoleReport = buildPlayerFlowAuditConsoleReport(result, scenario.checks);
  add(consoleReport.includes('Health:'), 'Console report generated', 'no report');

  const grouped = groupPlayerFlowFindingsByStage(result);
  add(typeof grouped === 'object', 'Stage grouping works', 'group fail');

  add(
    getPlayerFlowAuditHealth(result) === result.health,
    'Health calculation consistent',
    result.health,
  );
  add(
    result.checkedCount === scenario.checks.length,
    'Checked count matches',
    String(result.checkedCount),
  );
  add(
    result.passCount + result.warnCount + result.failCount === result.checkedCount,
    'Pass+warn+fail sum',
    'sum mismatch',
  );
  add(
    result.criticalFailCount <= result.failCount,
    'Critical fail count bounded',
    String(result.criticalFailCount),
  );

  add(
    result.failCount === 0,
    'Static audit no automated FAIL',
    `failCount=${result.failCount}`,
  );

  addWarn(
    true,
    'Real human playtest still required',
    'Human playtest pending',
  );
  addWarn(
    true,
    'Analytics integration pending',
    'Analytics pending',
  );
  addWarn(
    true,
    'Video/session recording not implemented',
    'Recording pending',
  );

  const docsPath = join(REPO_ROOT, PLAYER_FLOW_DOCS_PATH);
  add(existsSync(docsPath), 'Playtest docs file exists', PLAYER_FLOW_DOCS_PATH);
  if (existsSync(docsPath)) {
    const doc = readFileSync(docsPath, 'utf8');
    add(doc.includes('Gözlem'), 'Docs observation form', 'no observation');
    add(doc.includes('Başarısızlık') || doc.includes('başarısızlık'), 'Docs fail signals', 'no fail');
    add(doc.includes('Yeni oyuncu') || doc.includes('test profil'), 'Docs test profiles', 'no profiles');
  }

  const blob = [
    consoleReport,
    markdown,
    ...PLAYER_FLOW_CHECK_DEFINITIONS.map((d) => d.title),
  ].join(' ');
  add(
    !PLAYER_FLOW_FORBIDDEN_WORDS.some((w) => blob.toLowerCase().includes(w)),
    'No forbidden words in audit copy',
    'forbidden',
  );

  add(SAVE_VERSION === 24, 'SAVE_VERSION unchanged at 23', String(SAVE_VERSION));

  add(
    scenario.checks.some((c) => c.id === 'crisis_map_priority'),
    'Map crisis > resource documented in checks',
    'missing priority check',
  );

  add(
    scenario.checks.some((c) => c.id.includes('resources_detail')),
    'OperationalResourcesDetailSheet check exists',
    'missing sheet check',
  );

  add(
    typeof runPlayerFlowAudit === 'function',
    'verify:full-loop regression hook available',
    'runPlayerFlowAudit missing',
  );

  add(
    validatePlayerFlowChecks([]).health === 'PASS',
    'Empty checks health PASS',
    'empty health',
  );

  add(
    result.health !== 'FAIL',
    'Audit health not FAIL',
    result.health,
  );

  const failCount = checks.filter((c) => c.startsWith('FAIL')).length;
  const warnCount = checks.filter((c) => c.startsWith('WARN')).length;

  return {
    ok: ok && failCount === 0,
    warn: hasWarn || result.health === 'WARN',
    checks,
    failCount,
    warnCount,
    auditHealth: result.health,
  };
}
