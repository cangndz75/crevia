import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildHubCardVisibilityModel } from '@/core/onboarding/firstTenMinutesPresentation';
import { SOCIAL_PULSE_LAYOUT_GUARDS } from '@/features/social/utils/socialPulsePresentation';
import { HUB_UI_LAYOUT_GUARDS } from '@/features/hub/utils/hubScreenPresentation';
import { MAP_UI_LAYOUT_GUARDS } from '@/features/map/utils/mapUiPresentation';
import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialMonetizationState } from '@/core/monetization/monetizationState';

import {
  UI_DENSITY_MAX_HUB_PRIMARY_CARDS,
  UI_DENSITY_MAX_MAP_BOTTOM_PANEL_LINES,
  UI_DENSITY_MAX_MAP_REACTIONS,
  UI_DENSITY_MAX_OPERATIONAL_RESOURCE_CARDS_COMPACT,
  UI_DENSITY_MAX_SOCIAL_MENTIONS_DAY1,
  UI_DENSITY_MAX_SOCIAL_MENTIONS_STANDARD,
  UI_DENSITY_NON_GOALS,
  UI_DENSITY_MONITORED_COMPONENTS,
  resolveUiDensityDayMode,
} from './uiDensityConstants';
import type { UiDensityAuditResult, UiDensityScreenResult } from './uiDensityTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

function hasAll(content: string, patterns: string[]): boolean {
  return patterns.every((p) => content.includes(p));
}

function screenResult(
  partial: Omit<UiDensityScreenResult, 'densityScore'> & { densityScore?: number },
): UiDensityScreenResult {
  return {
    densityScore: partial.densityScore ?? (partial.status === 'PASS' ? 85 : partial.status === 'WARN' ? 65 : 40),
    ...partial,
  };
}

function auditHub(): UiDensityScreenResult {
  const ref = readRepo('src/features/hub/components/HubReferenceHome.tsx');
  const feel = readRepo('src/features/hub/components/HubMainOperationFeelCard.tsx');
  const risk = readRepo('src/features/hub/components/HubTomorrowRiskStrip.tsx');
  const journal = readRepo('src/features/hub/components/HubCityJournalStrip.tsx');
  const resources = readRepo('src/features/hub/components/HubOperationalResourcesCard.tsx');
  const day1Vis = buildHubCardVisibilityModel(createDay1Seed().gameState, createInitialMonetizationState());

  const evidence: string[] = [];
  const fixes: string[] = [];

  const day1Simple =
    !day1Vis.showMainOperationSeason &&
    !day1Vis.showLiveOperations &&
    !day1Vis.showCrisis &&
    day1Vis.showOperationalResources === false;
  evidence.push(`Day1 visibility: liveOps=${String(day1Vis.showLiveOperations)}`);

  const carryOverGuard = ref.includes('showHubCarryOver') && ref.includes('showHubCarryOver ?');
  if (carryOverGuard) fixes.push('showHubCarryOver conditional PreviousDecisionEffectCard');

  const priorityOrder =
    (() => {
      const bodyStart = ref.indexOf('<View style={styles.body}>');
      const body = bodyStart >= 0 ? ref.slice(bodyStart) : ref;
      return (
        body.indexOf('HubMainOperationFeelCard') >= 0 &&
        body.indexOf('HubMainOperationFeelCard') < body.indexOf('HubCityJournalStrip')
      );
    })();
  if (priorityOrder) fixes.push('Day 8+ card priority reorder');

  const resourcesWired = ref.includes('HubOperationalResourcesCard') && ref.includes('showOperationalResources');
  if (resourcesWired) fixes.push('HubOperationalResourcesCard wired with visibility');

  const stripGuards =
    hasAll(risk, ['numberOfLines', 'minWidth: 0', 'flexShrink: 1']) &&
    hasAll(journal, ['numberOfLines', 'minWidth: 0', 'flexShrink: 1']);
  const feelGuards = hasAll(feel, ['minWidth: 0', 'flexShrink: 1', 'accessibilityRole']);
  const compactRisk = risk.includes('shouldShowAsCompact');

  const status =
    day1Simple && stripGuards && feelGuards && carryOverGuard && priorityOrder && resourcesWired
      ? 'PASS'
      : day1Simple && stripGuards
        ? 'WARN'
        : 'FAIL';

  return screenResult({
    screenId: 'hub',
    title: 'HubScreen / HubReferenceHome',
    status,
    largeTextRisk: feelGuards ? 'low' : 'medium',
    accessibilityRisk: feel.includes('accessibilityLabel') ? 'low' : 'medium',
    duplicateRisk: 'medium',
    summary: `Day1 sade=${day1Simple}, priority=${priorityOrder}, strips guarded=${stripGuards}`,
    evidence,
    fixesApplied: fixes,
    recommendedFollowUp: status === 'PASS' ? undefined : 'Hub card priority + carry-over guard',
  });
}

function auditDecisionResult(): UiDensityScreenResult {
  const screen = readRepo('src/features/events/screens/DecisionResultScreen.tsx');
  const card = readRepo('src/features/events/components/EventResultImpactExplanationCard.tsx');

  const impactGuard = hasAll(card, ['numberOfLines', 'minWidth: 0', 'flexShrink']);
  const maxLines = card.includes('maxVisibleLines');
  const ctaGuard = screen.includes('accessibilityRole') && screen.includes('numberOfLines');
  const compactAlways = screen.includes('EventResultImpactExplanationCard') && screen.includes('compact');

  const fixes: string[] = [];
  if (maxLines) fixes.push('EventResultImpactExplanationCard uses maxVisibleLines');
  if (impactGuard) fixes.push('Impact card overflow guards');

  return screenResult({
    screenId: 'decision_result',
    title: 'DecisionResultScreen',
    status: impactGuard && ctaGuard ? 'PASS' : 'WARN',
    largeTextRisk: impactGuard ? 'low' : 'medium',
    accessibilityRisk: screen.includes('accessibilityLabel') ? 'low' : 'medium',
    duplicateRisk: compactAlways ? 'low' : 'medium',
    summary: `impact guard=${impactGuard}, CTA guard=${ctaGuard}, compact=${compactAlways}`,
    evidence: [],
    fixesApplied: fixes,
  });
}

function auditReport(): UiDensityScreenResult {
  const report = readRepo('src/features/reports/components/end-of-day/EndOfDayReportView.tsx');
  const tomorrow = readRepo('src/features/reports/components/ReportTomorrowRiskCard.tsx');

  const day1Guard = report.includes('isDay1') || report.includes('reportGuard');
  const overflow = hasAll(report, ['numberOfLines', 'flexShrink']);
  const tomorrowGuard = tomorrow.includes('maxVisibleLines') && tomorrow.includes('numberOfLines');
  const presenceLine = report.includes('OperationalResourcePresence') || report.includes('operationalResourcePresence');

  return screenResult({
    screenId: 'report',
    title: 'EndOfDayReportView',
    status: day1Guard && overflow && tomorrowGuard ? 'PASS' : 'WARN',
    largeTextRisk: overflow ? 'low' : 'medium',
    accessibilityRisk: 'low',
    duplicateRisk: presenceLine ? 'medium' : 'low',
    summary: `Day1 guard=${day1Guard}, tomorrow overflow=${tomorrowGuard}`,
    evidence: [],
    fixesApplied: [],
  });
}

function auditMap(): UiDensityScreenResult {
  const panel = readRepo('src/features/map/components/MapOperationBottomPanel.tsx');
  const reportCard = readRepo('src/features/map/components/MapDistrictReportCard.tsx');
  const strip = readRepo('src/features/map/components/MapNeighborhoodStrip.tsx');

  const panelGuard =
    hasAll(panel, ['numberOfLines', 'minWidth: 0']) &&
    (panel.match(/numberOfLines/g)?.length ?? 0) >= UI_DENSITY_MAX_MAP_BOTTOM_PANEL_LINES;
  const reportGuard = hasAll(reportCard, ['numberOfLines', 'minWidth: 0', 'flexShrink: 1']);
  const stripGuard =
    strip.includes('reactionLabel') &&
    strip.includes('numberOfLines') &&
    strip.includes('accessibilityLabel');
  const reactionText = strip.includes('reactionIndicatorLabel');

  const fixes: string[] = [];
  if (panel.includes('panel:') && panel.includes('minWidth: 0')) fixes.push('MapOperationBottomPanel root minWidth');
  if (stripGuard) fixes.push('MapNeighborhoodStrip reaction label + a11y');

  const status = panelGuard && reportGuard && stripGuard && reactionText ? 'PASS' : 'WARN';

  return screenResult({
    screenId: 'map',
    title: 'MapScreen / MapOperationBottomPanel',
    status,
    largeTextRisk: panelGuard && strip.includes('flexShrink: 1') ? 'low' : 'medium',
    accessibilityRisk: strip.includes('accessibilityLabel') ? 'low' : 'medium',
    duplicateRisk: panel.includes('mapReactionHintLine') ? 'medium' : 'low',
    summary: `panel lines=${panelGuard}, reportCard=${reportGuard}, strip=${stripGuard}`,
    evidence: [],
    fixesApplied: fixes,
  });
}

function auditSocial(): UiDensityScreenResult {
  const screen = readRepo('src/features/social/screens/SocialPulseScreen.tsx');
  const day1Mode = resolveUiDensityDayMode(1) === 'day1';
  const capOk = SOCIAL_PULSE_LAYOUT_GUARDS.maxNeighborhoodStripItems <= UI_DENSITY_MAX_SOCIAL_MENTIONS_STANDARD;
  const mentionCap =
    SOCIAL_PULSE_LAYOUT_GUARDS.mentionTextNumberOfLines <= 2 &&
    SOCIAL_PULSE_LAYOUT_GUARDS.maxNeighborhoodStripItems >= UI_DENSITY_MAX_SOCIAL_MENTIONS_DAY1;

  return screenResult({
    screenId: 'social',
    title: 'SocialPulseScreen',
    status: capOk && mentionCap && screen.includes('isDay1Compact') ? 'PASS' : 'WARN',
    largeTextRisk: screen.includes('numberOfLines') ? 'low' : 'medium',
    accessibilityRisk: 'low',
    duplicateRisk: 'low',
    summary: `Day1 compact=${screen.includes('isDay1Compact')}, mention cap=${mentionCap}`,
    evidence: [`maxNeighborhood=${SOCIAL_PULSE_LAYOUT_GUARDS.maxNeighborhoodStripItems}`],
    fixesApplied: day1Mode ? [] : [],
  });
}

function auditOperationalResources(): UiDensityScreenResult {
  const sheet = readRepo('src/features/hub/components/OperationalResourcesDetailSheet.tsx');
  const card = readRepo('src/features/hub/components/HubOperationalResourcesCard.tsx');

  const maxTwoLines = (sheet.match(/numberOfLines=\{2\}/g)?.length ?? 0) >= 2;
  const noIndividual = !sheet.toLowerCase().includes('gps') && !sheet.includes('plaka');
  const tabGuard = sheet.includes('accessibilityRole') || sheet.includes('numberOfLines');
  const compactRows = card.includes('compact') && card.includes('numberOfLines');

  return screenResult({
    screenId: 'operational_resources',
    title: 'OperationalResourcesDetailSheet',
    status: maxTwoLines && noIndividual && compactRows ? 'PASS' : 'WARN',
    largeTextRisk: hasAll(sheet, ['flexShrink: 1', 'numberOfLines']) ? 'low' : 'medium',
    accessibilityRisk: tabGuard ? 'low' : 'medium',
    duplicateRisk: 'low',
    summary: `max 2 lines=${maxTwoLines}, tekil yok=${noIndividual}`,
    evidence: [],
    fixesApplied: [],
    recommendedFollowUp: !tabGuard ? 'Sheet tab accessibilityRole V1.1' : undefined,
  });
}

function auditAccessibility(): UiDensityScreenResult {
  const chip = readRepo('src/features/events/components/PostPilotEventContextChip.tsx');
  const strip = readRepo('src/features/map/components/MapNeighborhoodStrip.tsx');

  const chipLabel = chip.includes('accessibilityLabel') || chip.includes('numberOfLines');
  const reactionNotColorOnly =
    strip.includes('reactionIndicatorLabel') && strip.includes('accessibilityLabel');
  const ctaLabels =
    readRepo('src/features/hub/components/HubMainOperationFeelCard.tsx').includes('accessibilityLabel');

  const status = reactionNotColorOnly && ctaLabels ? 'PASS' : 'WARN';

  return screenResult({
    screenId: 'hub',
    title: 'Accessibility basics',
    status,
    largeTextRisk: 'low',
    accessibilityRisk: status === 'PASS' ? 'low' : 'medium',
    duplicateRisk: 'low',
    densityScore: status === 'PASS' ? 88 : 70,
    summary: `reaction label+a11y=${reactionNotColorOnly}, CTA labels=${ctaLabels}, chip=${chipLabel}`,
    evidence: [],
    fixesApplied: reactionNotColorOnly ? ['Map reaction accessibilityLabel'] : [],
    recommendedFollowUp: 'Full accessibility audit V1.1 backlog',
  });
}

export function runUiDensityAudit(): UiDensityAuditResult {
  const screenResults: UiDensityScreenResult[] = [
    auditHub(),
    auditDecisionResult(),
    auditReport(),
    auditMap(),
    auditSocial(),
    auditOperationalResources(),
    auditAccessibility(),
  ];

  const fixedIssues = [...new Set(screenResults.flatMap((r) => r.fixesApplied))];
  const remainingIssues = [
    'Full accessibility audit (VoiceOver/TalkBack matrix) — V1.1 backlog',
    'Tablet layout density pass — V1.1/V2',
    'HubAdvisorCard dedicated strip polish — backlog',
  ];

  const hasFail = screenResults.some((r) => r.status === 'FAIL');
  const hasWarn = screenResults.some((r) => r.status === 'WARN');
  const overallHealth = hasFail ? 'FAIL' : hasWarn ? 'WARN' : 'PASS';
  const launchRisk = hasFail ? 'high' : hasWarn ? 'medium' : 'low';

  void UI_DENSITY_MAX_HUB_PRIMARY_CARDS;
  void UI_DENSITY_MAX_MAP_REACTIONS;
  void UI_DENSITY_MAX_OPERATIONAL_RESOURCE_CARDS_COMPACT;
  void UI_DENSITY_MONITORED_COMPONENTS;
  void HUB_UI_LAYOUT_GUARDS;
  void MAP_UI_LAYOUT_GUARDS;

  return {
    overallHealth,
    launchRisk,
    screenResults,
    fixedIssues,
    remainingIssues,
    recommendedNextActions: [
      'Real-device large font QA on iPhone SE / small Android',
      'Day 8+ Hub scroll depth check after card priority reorder',
      ...(overallHealth !== 'PASS' ? ['Re-run verify:ui-density after device QA'] : []),
    ],
    nonGoalsConfirmed: [...UI_DENSITY_NON_GOALS],
  };
}
