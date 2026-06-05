import { REAL_DEVICE_PLAYTEST_AREA_LABELS } from './realDevicePlaytestConstants';
import {
  buildAllObservationTemplates,
  buildRealDevicePlaytestPlan,
} from './realDevicePlaytestPlan';
import type {
  CreviaRealDevicePlaytestObservation,
  CreviaRealDevicePlaytestReadinessSummary,
} from './playtestTypes';

export function buildRealDevicePlaytestChecklist(): string[] {
  const plan = buildRealDevicePlaytestPlan();
  const lines: string[] = [
    `# Crevia Real Device Playtest Round ${plan.round} Checklist`,
    '',
    '## Device matrix',
  ];

  for (const profile of plan.deviceProfiles) {
    lines.push(`- [ ] ${profile.label} (${profile.notes})${profile.required ? ' **required**' : ''}`);
  }

  lines.push('', '## Areas');
  for (const area of plan.areas) {
    lines.push(`- [ ] ${area.label}`);
    for (const q of area.questions) {
      lines.push(`  - ${q}`);
    }
  }

  lines.push('', '## Scenarios');
  for (const scenario of plan.scenarios) {
    lines.push(`- [ ] ${scenario.title} (\`${scenario.id}\`)`);
  }

  return lines;
}

export function buildRealDeviceObservationSheet(
  observation: CreviaRealDevicePlaytestObservation,
): string {
  return [
    `## Observation: ${observation.scenarioId}`,
    '',
    `| Field | Value |`,
    `|-------|-------|`,
    `| deviceProfile | ${observation.deviceProfile} |`,
    `| startState | ${observation.startState} |`,
    `| expectedResult | ${observation.expectedResult} |`,
    `| observedResult | ${observation.observedResult || '_pending_'} |`,
    `| severity | ${observation.severity} |`,
    `| screenshotNeeded | ${observation.screenshotNeeded} |`,
    `| videoNeeded | ${observation.videoNeeded} |`,
    `| owner | ${observation.owner} |`,
    `| relatedVerifyScript | ${observation.relatedVerifyScript} |`,
    `| completed | ${observation.completed} |`,
    '',
    '### Steps',
    ...observation.steps.map(
      (s) => `${s.order}. ${s.action} — watch: ${s.watchFor.join(', ')}`,
    ),
    '',
    `**fixRecommendation:** ${observation.fixRecommendation || '_pending_'}`,
  ].join('\n');
}

export function buildPlaytestFixPriorityTable(
  observations: CreviaRealDevicePlaytestObservation[],
): string {
  const completed = observations.filter((o) => o.completed && o.fixRecommendation);
  if (completed.length === 0) {
    return '_No completed observations with fix recommendations yet._\n';
  }
  const rows = completed.map(
    (o) => `| ${o.severity} | ${o.scenarioId} | ${o.fixRecommendation.slice(0, 60)} | ${o.owner} |`,
  );
  return `| Severity | Scenario | Fix | Owner |\n|----------|----------|-----|-------|\n${rows.join('\n')}\n`;
}

export function buildRealDevicePlaytestConsoleSummary(
  summary: CreviaRealDevicePlaytestReadinessSummary,
): string {
  const plan = buildRealDevicePlaytestPlan();
  const lines = [
    '=== Crevia Real Device Playtest Round 1 ===',
    `Health: ${summary.health}`,
    `Decision: ${summary.decision}`,
    `Areas: ${summary.areaCount} | Scenarios: ${summary.scenarioCount}`,
    `Observation templates: ${summary.observationTemplateCount}`,
    `Completed observations: ${summary.completedObservationCount}`,
    `Plan present: ${summary.planPresent} | Docs present: ${summary.docsPresent}`,
    `Launch candidate ready: ${summary.launchCandidateReady} (manual results required)`,
    `IAP purchase smoke: separate phase (${plan.iapPurchaseSmokeSeparatePhase})`,
    `SAVE_VERSION: 23`,
    '',
    '--- Device profiles ---',
    ...plan.deviceProfiles.map((p) => `  • ${p.label}`),
    '',
    '--- Next actions ---',
    ...summary.nextActions.map((a) => `  • ${a}`),
  ];
  return lines.join('\n');
}

export function buildRealDevicePlaytestMarkdown(
  summary: CreviaRealDevicePlaytestReadinessSummary,
): string {
  const plan = buildRealDevicePlaytestPlan();
  const templates = buildAllObservationTemplates();

  return [
    '# Crevia Real Device Playtest — Generated Report',
    '',
    `**Health:** ${summary.health}`,
    `**Decision:** ${summary.decision}`,
    `**Completed observations:** ${summary.completedObservationCount} / ${summary.scenarioCount}`,
    '',
    '## Scenario matrix',
    '',
    '| ID | Area | Day | Screenshot | Video |',
    '|----|------|-----|------------|-------|',
    ...plan.scenarios.map(
      (s) =>
        `| ${s.id} | ${REAL_DEVICE_PLAYTEST_AREA_LABELS[s.area]} | ${s.day} | ${s.screenshotNeeded} | ${s.videoNeeded} |`,
    ),
    '',
    '## Observation templates',
    '',
    ...templates.slice(0, 3).map((t) => buildRealDeviceObservationSheet(t)),
    '',
    `_+${templates.length - 3} more templates in verify output_`,
    '',
    '## Fix priority',
    '',
    buildPlaytestFixPriorityTable(templates),
  ].join('\n');
}
