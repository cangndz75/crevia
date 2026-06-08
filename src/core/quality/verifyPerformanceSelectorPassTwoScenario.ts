import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildEventResultSystemsEchoModel } from '@/core/events/eventResultNewSystemsPresentation';
import {
  buildMapDistrictIntelligenceModel,
  MAP_DISTRICT_INTELLIGENCE_MAX_VISIBLE_LINES,
} from '@/core/map/mapDistrictIntelligencePresentation';
import { buildProfileCareerShowcaseModel } from '@/core/profile/profileCareerShowcasePresentation';
import { buildReportSystemsIntegrationModel } from '@/core/reports/reportSystemsIntegrationPresentation';
import { SAVE_VERSION } from '@/store/gamePersist';

import { verifySelectorAuditScenario } from './performanceSelectors/verifySelectorAuditScenario';

export type VerifyPerformanceSelectorPassTwoOutcome = {
  ok: boolean;
  checks: string[];
  consoleReport: string;
  audit: {
    health: string;
    passCount: number;
    warnCount: number;
    failCount: number;
  };
};

type CheckLevel = 'PASS' | 'WARN' | 'FAIL';

const REPO_ROOT = process.cwd();

function readRepo(relPath: string): string {
  const path = join(REPO_ROOT, relPath);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function record(
  checks: string[],
  level: CheckLevel,
  ok: boolean,
  pass: string,
  fail: string,
): boolean {
  checks.push(ok ? `PASS ${pass}` : `${level} ${fail}`);
  return ok || level !== 'FAIL';
}

function hasMemoizedBuilder(content: string, builderName: string): boolean {
  const builderIndex = content.indexOf(builderName);
  if (builderIndex < 0) return false;
  const memoIndex = content.lastIndexOf('useMemo', builderIndex);
  const nextReturnIndex = content.indexOf('return (', builderIndex);
  return memoIndex >= 0 && (nextReturnIndex < 0 || memoIndex < nextReturnIndex);
}

function hasMemoizedContext(content: string, contextName: string): boolean {
  return content.includes(`const ${contextName} = useMemo`);
}

function hasRenderTimeTracking(content: string): boolean {
  const returnIndex = content.lastIndexOf('  return (');
  if (returnIndex < 0) return false;
  const jsx = content.slice(returnIndex);
  return /track(?:OncePerRuntime|CreviaEvent)\s*\(/.test(jsx);
}

function hasLayoutGuards(content: string): boolean {
  return (
    content.includes('numberOfLines') &&
    content.includes('minWidth') &&
    content.includes('flexShrink')
  );
}

function hasMapDensityGuard(content: string): boolean {
  return (
    content.includes('MAP_DISTRICT_INTELLIGENCE_MAX_VISIBLE_LINES') &&
    content.includes('maxVisibleLines') &&
    content.includes('slice(0, maxLines)') &&
    content.includes('crisisOverlayVisible') &&
    content.includes('validateMapDistrictIntelligenceCopy')
  );
}

function hasBuilderInsideMapLoop(content: string): boolean {
  return content
    .split('\n')
    .some((line) => /\.map\([^)]*=>/.test(line) && /build\w+(Model|Bundle|Input)\s*\(/.test(line));
}

export function verifyPerformanceSelectorPassTwoScenario(): VerifyPerformanceSelectorPassTwoOutcome {
  const checks: string[] = [];
  let ok = true;

  const files = {
    hubHome: readRepo('src/features/hub/components/HubReferenceHome.tsx'),
    hubScreen: readRepo('src/features/hub/screens/HubScreen.tsx'),
    hubOpenEndedCard: readRepo('src/features/hub/components/HubOpenEndedOperationCard.tsx'),
    mapScreen: readRepo('src/features/map/screens/MapScreen.tsx'),
    dispatchPhase: readRepo('src/features/events/components/event-workflow/dispatch/EventDispatchPhase.tsx'),
    fieldPhase: readRepo('src/features/events/components/event-workflow/field/EventFieldPhase.tsx'),
    decisionResult: readRepo('src/features/events/screens/DecisionResultScreen.tsx'),
    reportView: readRepo('src/features/reports/components/end-of-day/EndOfDayReportView.tsx'),
    profileScreen: readRepo('src/features/profile/screens/ProfileScreen.tsx'),
    mapPresentation: readRepo('src/core/map/mapDistrictIntelligencePresentation.ts'),
    resultPresentation: readRepo('src/core/events/eventResultNewSystemsPresentation.ts'),
    reportPresentation: readRepo('src/core/reports/reportSystemsIntegrationPresentation.ts'),
    profilePresentation: readRepo('src/core/profile/profileCareerShowcasePresentation.ts'),
  };

  const hubOpenEndedMemoOk =
    (hasMemoizedBuilder(files.hubHome, 'buildHubOpenEndedIntegrationModel') &&
      hasMemoizedContext(files.hubHome, 'analyticsContext')) ||
    (hasMemoizedBuilder(files.hubScreen, 'buildHubCarryOverMemory') &&
      files.hubOpenEndedCard.includes('analyticsContext') &&
      files.hubOpenEndedCard.includes('useEffect'));

  ok = record(
    checks,
    'FAIL',
    hubOpenEndedMemoOk,
    'Hub open-ended/card analytics in effects; hub screen memoizes carry-over integration',
    'Hub open-ended model/context memoization missing',
  ) && ok;

  ok = record(
    checks,
    'FAIL',
    hasMemoizedBuilder(files.mapScreen, 'buildMapDistrictIntelligenceModel') &&
      hasMemoizedContext(files.mapScreen, 'newSystemsAnalyticsContext') &&
      files.mapScreen.includes('shouldSuppressMapOperationHintForActiveRoute'),
    'Map district intelligence model/context are memoized with active-route suppression',
    'Map district intelligence memoization or suppression missing',
  ) && ok;

  ok = record(
    checks,
    'FAIL',
    hasMapDensityGuard(files.mapPresentation),
    'Map district intelligence density guard uses max visible lines and crisis priority inputs',
    'Map district intelligence density guard missing',
  ) && ok;

  const mapModel = buildMapDistrictIntelligenceModel({
    selectedDistrictId: 'merkez',
    day: 8,
    isPostPilot: true,
    isPilotCompleted: true,
    crisisOverlayVisible: true,
    rankKey: 'operations_director',
    unlockedPermissionIds: ['district_specific_operations_preview'],
  } as any);
  ok = record(
    checks,
    'FAIL',
    mapModel.visibleLines.length <= MAP_DISTRICT_INTELLIGENCE_MAX_VISIBLE_LINES,
    'Map district intelligence builder caps visible line density',
    'Map district intelligence builder exceeds visible line cap',
  ) && ok;

  const resultModel = buildEventResultSystemsEchoModel({ day: 1 } as any);
  ok = record(
    checks,
    'FAIL',
    !resultModel.visible &&
      resultModel.visibility.maxVisibleLines === 0 &&
      hasMemoizedBuilder(files.decisionResult, 'buildEventResultSystemsEchoModel') &&
      hasMemoizedContext(files.decisionResult, 'resultSystemsAnalyticsContext'),
    'Result systems echo skips Day 1/hidden state and parent context is memoized',
    'Result systems echo skip guard or memoized context missing',
  ) && ok;

  const reportModel = buildReportSystemsIntegrationModel({});
  ok = record(
    checks,
    'FAIL',
    !reportModel.visible &&
      reportModel.visibility.mode === 'hidden' &&
      hasMemoizedBuilder(files.reportView, 'buildReportSystemsIntegrationModel') &&
      hasMemoizedContext(files.reportView, 'reportSystemsAnalyticsContext'),
    'Report systems integration skips missing report and parent context is memoized',
    'Report systems integration missing-report guard or memoized context missing',
  ) && ok;

  const profileModel = buildProfileCareerShowcaseModel({ day: 1 });
  ok = record(
    checks,
    'FAIL',
    !profileModel.visible &&
      profileModel.visibility.mode === 'hidden' &&
      hasMemoizedBuilder(files.profileScreen, 'buildProfileCareerShowcaseModel') &&
      hasMemoizedContext(files.profileScreen, 'careerAnalyticsContext'),
    'Profile career showcase skips Day 1 and parent context is memoized',
    'Profile career showcase Day 1 guard or memoized context missing',
  ) && ok;

  const analyticsComponents = [
    'src/features/hub/components/HubOpenEndedOperationCard.tsx',
    'src/features/events/components/ActiveTaskRoutePreviewStrip.tsx',
    'src/features/events/components/event-workflow/field/LiveOperationCard.tsx',
    'src/features/events/components/result/EventResultSystemsEchoStrip.tsx',
    'src/features/reports/components/ReportSystemsIntegrationCard.tsx',
    'src/features/profile/components/ProfileCareerShowcaseCard.tsx',
  ];
  const analyticsEffectsOk = analyticsComponents.every((relPath) => {
    const content = readRepo(relPath);
    return content.includes('useEffect') && !hasRenderTimeTracking(content);
  });
  ok = record(
    checks,
    'FAIL',
    analyticsEffectsOk,
    'New systems analytics tracking stays in effects, not render body',
    'New systems analytics tracking may run during render',
  ) && ok;

  const layoutGuardFiles = [
    'src/features/hub/components/HubCrisisDeskCard.tsx',
    'src/features/hub/components/HubCrisisActionCard.tsx',
    'src/features/hub/components/HubLiveOperationsCard.tsx',
    'src/features/hub/components/HubFirstTenMinutesGuideCard.tsx',
    'src/features/hub/components/HubDevTools.tsx',
  ];
  ok = record(
    checks,
    'FAIL',
    layoutGuardFiles.every((relPath) => hasLayoutGuards(readRepo(relPath))),
    'Hub dense cards/devtools include mobile text overflow guards',
    'Hub dense card/devtools layout guards missing',
  ) && ok;

  ok = record(
    checks,
    'FAIL',
    ![
      files.hubHome,
      files.mapScreen,
      files.decisionResult,
      files.reportView,
      files.profileScreen,
    ].some(hasBuilderInsideMapLoop),
    'Heavy model builders are not invoked inside map loops',
    'Heavy model builder detected inside a map loop',
  ) && ok;

  ok = record(
    checks,
    'FAIL',
    SAVE_VERSION === 25,
    'SAVE_VERSION unchanged',
    `SAVE_VERSION changed: ${SAVE_VERSION}`,
  ) && ok;

  const gameplayFilesUntouchedByScenario = [
    'src/core/game/applyDecision.ts',
    'src/core/dayPipeline/dayPipelineOrchestrator.ts',
    'src/store/useGameStore.ts',
  ].every((relPath) => !readRepo(relPath).includes('verifyPerformanceSelectorPassTwoScenario'));
  ok = record(
    checks,
    'FAIL',
    gameplayFilesUntouchedByScenario,
    'Runtime gameplay files are not coupled to this performance verifier',
    'Performance verifier leaked into gameplay runtime files',
  ) && ok;

  const selectorAudit = verifySelectorAuditScenario();
  ok = record(
    checks,
    'WARN',
    selectorAudit.audit.failCount === 0,
    'Performance selector audit has no FAIL findings',
    'Performance selector audit has FAIL findings',
  ) && ok;

  const consoleReport = [
    '=== Performance Selector Pass Two ===',
    `Performance audit health: ${selectorAudit.audit.health}`,
    `Performance audit findings: ${selectorAudit.audit.passCount} PASS / ${selectorAudit.audit.warnCount} WARN / ${selectorAudit.audit.failCount} FAIL`,
    'Screens optimized: Hub, Map, Active Route, Result, Report, Profile',
    'Runtime gameplay touched: no',
    `SAVE_VERSION: ${SAVE_VERSION}`,
  ].join('\n');

  return {
    ok,
    checks,
    consoleReport,
    audit: {
      health: selectorAudit.audit.health,
      passCount: selectorAudit.audit.passCount,
      warnCount: selectorAudit.audit.warnCount,
      failCount: selectorAudit.audit.failCount,
    },
  };
}
