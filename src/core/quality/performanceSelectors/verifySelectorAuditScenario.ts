import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { verifyDayPipelineScenario } from '@/core/dayPipeline/verifyDayPipelineScenario';
import { verifyFirstTenMinutesScenario } from '@/core/onboarding/verifyFirstTenMinutesScenario';
import { verifyOperationalResourcesScenario } from '@/core/operationalResources/verifyOperationalResourcesScenario';
import { verifyInteractionContractsScenario } from '@/core/quality/interactionContracts/verifyInteractionContractsScenario';
import { verifySeasonEndScenario } from '@/core/seasonEnd/verifySeasonEndScenario';
import { verifyFullSeasonSimulationScenario } from '@/core/simulation/verifyFullSeasonSimulationScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  SELECTOR_AUDIT_TARGETS,
  SELECTOR_AUDIT_FORBIDDEN_WORDS,
} from './selectorAuditConstants';
import {
  collectSelectorAuditCopy,
  countSelectorAuditForbiddenWords,
  runSelectorAudit,
} from './selectorAuditEngine';
import { buildSelectorAuditConsoleReport } from './selectorAuditPresentation';
import type { SelectorAuditResult } from './selectorAuditTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..', '..');

export type VerifySelectorAuditOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  audit: SelectorAuditResult;
  consoleReport: string;
};

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, fail: string): void {
  checks.push(ok ? `PASS ${pass}` : `WARN ${fail}`);
}

export function verifySelectorAuditScenario(): VerifySelectorAuditOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const audit = runSelectorAudit();
  const consoleReport = buildSelectorAuditConsoleReport(audit);

  ok =
    assert(checks, audit.findings.length > 0, 'Audit result not empty', 'Empty audit') &&
    ok;
  ok =
    assert(
      checks,
      audit.findings.some((f) => f.surface === 'hub' && f.componentName === 'HubScreen'),
      'HubScreen audited',
      'HubScreen missing',
    ) && ok;
  ok =
    assert(
      checks,
      audit.findings.some((f) => f.id.startsWith('surface_audited_report')),
      'Report surface audited',
      'Report surface missing',
    ) && ok;
  ok =
    assert(
      checks,
      audit.findings.some((f) => f.componentName === 'MapScreen'),
      'MapScreen audited',
      'MapScreen missing',
    ) && ok;
  ok =
    assert(
      checks,
      audit.findings.some((f) => f.surface === 'event_flow'),
      'Event flow audited',
      'Event flow missing',
    ) && ok;

  const hubGameState = audit.findings.find((f) => f.id.startsWith('full_game_state_HubScreen'));
  ok =
    assert(
      checks,
      hubGameState != null,
      'Hub full gameState finding',
      'Hub gameState finding missing',
    ) && ok;

  const seasonLazy = audit.findings.find(
    (f) => f.id === 'season_end_lazy_detail_ReportSeasonEndEvaluationCard',
  );
  ok =
    assert(
      checks,
      seasonLazy?.status === 'pass',
      'Season end lazy detail model',
      'Season end detail not lazy',
    ) && ok;

  const resourceTab = audit.findings.find(
    (f) => f.id === 'resource_sheet_tab_OperationalResourcesDetailSheet',
  );
  ok =
    assert(
      checks,
      resourceTab?.status === 'pass',
      'Resource sheet active tab only',
      'Resource sheet all tabs render',
    ) && ok;

  const resourceVisible = audit.findings.find(
    (f) => f.id === 'resource_sheet_visible_OperationalResourcesDetailSheet',
  );
  ok =
    assert(
      checks,
      resourceVisible?.status === 'pass',
      'Resource sheet visible guard',
      'Resource sheet no visible guard',
    ) && ok;

  const mapMemo = audit.findings.find((f) => f.id === 'map_overlay_memo_MapScreen');
  ok =
    assert(checks, mapMemo?.status === 'pass', 'Map overlay memoization', 'Map overlay not memoized') &&
    ok;

  const mapCrisis = audit.findings.find((f) => f.id === 'map_crisis_priority_MapScreen');
  ok =
    assert(checks, mapCrisis?.status === 'pass', 'Map crisis priority guard', 'Map crisis priority missing') &&
    ok;

  const mapPinFile = readRepo('src/features/map/components/MapPin.tsx');
  ok =
    assert(
      checks,
      mapPinFile.includes('selected') &&
        mapPinFile.includes('crisisHighlight') &&
        mapPinFile.includes('colors.primary'),
      'Map pin selected priority over crisis',
      'Map pin selection styling missing',
    ) && ok;

  const assignmentPanel = audit.findings.find(
    (f) => f.id === 'event_flow_side_effect_EventAssignmentPanel',
  );
  ok =
    assert(
      checks,
      assignmentPanel?.status === 'pass',
      'EventAssignmentPanel no render side effect',
      'Assignment panel side effect risk',
    ) && ok;

  const impactStrip = audit.findings.find(
    (f) => f.id === 'event_flow_side_effect_OperationImpactPreviewStrip',
  );
  ok =
    assert(
      checks,
      impactStrip?.status === 'pass',
      'OperationImpactPreviewStrip no render side effect',
      'Impact strip side effect risk',
    ) && ok;

  const hubDev = audit.findings.find((f) => f.id === 'dev_guard_HubDevTools');
  ok = assert(checks, hubDev?.status === 'pass', 'HubDevTools DEV guard', 'HubDevTools unguarded') && ok;

  const postPilotDev = readRepo('src/features/devtools/components/PostPilotDevTools.tsx');
  ok =
    assert(
      checks,
      postPilotDev.includes('isPostPilotDevToolsEnabled'),
      'PostPilotDevTools production guard',
      'PostPilotDevTools guard missing',
    ) && ok;

  const hubDevContent = readRepo('src/features/hub/components/HubDevTools.tsx');
  ok =
    assert(
      checks,
      hubDevContent.includes('__DEV__') && /crisis|resource|DEV/i.test(hubDevContent),
      'Dev crisis/resource buttons guarded',
      'Dev buttons guard missing',
    ) && ok;

  const firstTen = verifyFirstTenMinutesScenario();
  ok =
    assert(
      checks,
      firstTen.checks.some((c) => c.includes('Day 1 MainOperationSeason hidden')),
      'Day 1 hidden advanced cards',
      'First 10 minutes day1 guard missing',
    ) && ok;

  ok =
    assert(
      checks,
      !readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts').includes(
        "from '@/features/",
      ),
      'DayPipeline no UI import',
      'DayPipeline imports UI',
    ) && ok;

  const playerFlow = readRepo('src/core/playtest/playerFlowAuditEngine.ts');
  ok =
    assert(
      checks,
      !playerFlow.includes('/screens/') && !playerFlow.includes('Screen.tsx'),
      'PlayerFlowAudit no screen UI import',
      'PlayerFlowAudit imports screens',
    ) && ok;

  ok =
    assert(
      checks,
      !readRepo('src/core/simulation/fullSeasonSimulationEngine.ts').includes(
        "from '@/features/",
      ),
      'FullSeasonSimulation no UI import',
      'Simulation imports UI',
    ) && ok;

  ok =
    assert(
      checks,
      countSelectorAuditForbiddenWords(collectSelectorAuditCopy()) === 0,
      'No forbidden words in audit copy',
      'Forbidden words in audit',
    ) && ok;

  ok = assert(checks, SAVE_VERSION === 23, 'SAVE_VERSION 23', 'SAVE_VERSION changed') && ok;

  const seasonEndCard = readRepo(
    'src/features/reports/components/ReportSeasonEndEvaluationCard.tsx',
  );
  ok =
    assert(
      checks,
      !seasonEndCard.includes('persist') && !seasonEndCard.includes('SAVE_VERSION'),
      'No new persist key in season end card',
      'Persist reference in card',
    ) && ok;

  const hubLayout = readRepo('src/features/hub/screens/HubScreen.tsx');
  ok =
    assert(
      checks,
      hubLayout.includes('buildHubScreenLayoutModel') && hubLayout.includes('useMemo'),
      'Hub presentation memoized',
      'Hub layout not memoized',
    ) && ok;

  const mapScreen = readRepo('src/features/map/screens/MapScreen.tsx');
  ok =
    assert(
      checks,
      mapScreen.includes('buildMapResourcePresentationBundle') &&
        mapScreen.includes('useMemo'),
      'Map presentation memoized',
      'Map presentation not memoized',
    ) && ok;

  const reportSeason = readRepo(
    'src/features/reports/components/ReportSeasonEndEvaluationCard.tsx',
  );
  ok =
    assert(
      checks,
      reportSeason.includes('useMemo') && reportSeason.includes('buildSeasonEndReportCardModel'),
      'Report season end memoized',
      'Report season end not memoized',
    ) && ok;

  const contracts = verifyInteractionContractsScenario();
  ok =
    assert(checks, contracts.ok, 'Interaction contracts PASS', 'Interaction contracts FAIL') &&
    ok;

  ok =
    assert(checks, firstTen.ok, 'First 10 minutes PASS', 'First 10 minutes FAIL') && ok;

  const operational = verifyOperationalResourcesScenario();
  ok =
    assert(checks, operational.ok, 'Operational resources PASS', 'Operational resources FAIL') &&
    ok;

  const seasonEnd = verifySeasonEndScenario();
  ok = assert(checks, seasonEnd.ok, 'Season end PASS', 'Season end FAIL') && ok;
  if (seasonEnd.warn) hasWarn = true;

  const fullSeason = verifyFullSeasonSimulationScenario();
  ok = assert(checks, fullSeason.ok, 'Full season simulation no FAIL', 'Full season FAIL') && ok;
  if (fullSeason.warn) hasWarn = true;

  const dayPipeline = verifyDayPipelineScenario();
  ok = assert(checks, dayPipeline.ok, 'Day pipeline PASS', 'Day pipeline FAIL') && ok;

  ok =
    assert(checks, audit.health !== 'FAIL', 'Audit health not FAIL', `Audit health ${audit.health}`) &&
    ok;
  if (audit.health === 'WARN') hasWarn = true;

  ok =
    assert(checks, consoleReport.length > 40, 'Console report non-empty', 'Console report empty') &&
    ok;

  ok =
    assert(
      checks,
      SELECTOR_AUDIT_TARGETS.length >= 28,
      'Audit target coverage',
      'Too few audit targets',
    ) && ok;

  const endOfDay = readRepo('src/features/reports/components/end-of-day/EndOfDayReportView.tsx');
  ok =
    assert(
      checks,
      endOfDay.includes('numberOfLines') || endOfDay.includes('buildEndOfDayReportViewModel'),
      'Report density guards',
      'Report guards missing',
    ) && ok;

  const hubVisibility = readRepo('src/core/onboarding/firstTenMinutesPresentation.ts');
  ok =
    assert(
      checks,
      hubVisibility.includes('maxFeaturedCards'),
      'Hub card count guard',
      'Hub max cards missing',
    ) && ok;

  const seasonSheet = readRepo(
    'src/features/reports/components/SeasonEndEvaluationDetailSheet.tsx',
  );
  ok =
    assert(
      checks,
      seasonSheet.includes('onClose') && seasonSheet.includes('closeLabel'),
      'Season end sheet close stable',
      'Season end close missing',
    ) && ok;

  warn(
    checks,
    audit.warnCount < 30,
    'Warn count bounded',
    'High warn count — review presentation memoization',
  );
  if (audit.warnCount >= 30) hasWarn = true;

  return {
    ok,
    warn: hasWarn || audit.health === 'WARN',
    checks,
    audit,
    consoleReport,
  };
}
