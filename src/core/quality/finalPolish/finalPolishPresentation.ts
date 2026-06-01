import { FINAL_POLISH_GUARDS } from './finalPolishGuards';
import { FINAL_POLISH_ROADMAP } from './finalPolishRoadmap';
import type {
  FinalPolishGroupSummary,
  FinalPolishGuardSeverity,
  FinalPolishPriority,
  FinalPolishReadinessLine,
  FinalPolishRoadmapGroup,
  FinalPolishRoadmapItem,
  FinalPolishRoadmapSummary,
  FinalPolishStatus,
} from './finalPolishTypes';

const GROUP_TITLES: Record<FinalPolishRoadmapGroup, string> = {
  scope_freeze: 'Scope Freeze',
  anti_boredom_core: 'Anti-Boredom Core',
  content_safety_pack: 'Content Safety Pack',
  decision_visibility: 'Decision Visibility',
  dynamic_map_presence: 'Dynamic Map Presence',
  resource_visual_states: 'Resource Visual States',
  advisor_depth: 'Advisor Depth',
  premium_wow: 'Premium Wow',
  post_pilot_variety: 'Post-Pilot Variety',
  analytics_sdk: 'Analytics SDK',
  monetization_iap: 'Monetization / IAP',
  manual_playtest: 'Manual Playtest',
  release_candidate: 'Release Candidate',
  ai_later: 'AI Later',
};

const GROUP_ORDER: FinalPolishRoadmapGroup[] = [
  'scope_freeze',
  'anti_boredom_core',
  'content_safety_pack',
  'decision_visibility',
  'dynamic_map_presence',
  'resource_visual_states',
  'advisor_depth',
  'premium_wow',
  'post_pilot_variety',
  'analytics_sdk',
  'monetization_iap',
  'manual_playtest',
  'release_candidate',
  'ai_later',
];

function emptyStatusRecord(): Record<FinalPolishStatus, number> {
  return {
    planned: 0,
    in_progress: 0,
    completed: 0,
    blocked: 0,
    later: 0,
  };
}

function emptyPriorityRecord(): Record<FinalPolishPriority, number> {
  return {
    mandatory: 0,
    critical: 0,
    high: 0,
    medium: 0,
    later: 0,
  };
}

function isIncomplete(item: FinalPolishRoadmapItem): boolean {
  return item.status !== 'completed' && item.status !== 'later';
}

export function buildFinalPolishRoadmapSummary(): FinalPolishRoadmapSummary {
  const byStatus = emptyStatusRecord();
  const byPriority = emptyPriorityRecord();

  for (const item of FINAL_POLISH_ROADMAP) {
    byStatus[item.status] += 1;
    byPriority[item.priority] += 1;
  }

  const mandatoryIncomplete = FINAL_POLISH_ROADMAP.filter(
    (i) => i.priority === 'mandatory' && isIncomplete(i),
  ).length;

  const criticalIncomplete = FINAL_POLISH_ROADMAP.filter(
    (i) => (i.priority === 'critical' || i.priority === 'mandatory') && isIncomplete(i),
  ).length;

  return {
    totalItems: FINAL_POLISH_ROADMAP.length,
    byStatus,
    byPriority,
    mandatoryIncomplete,
    criticalIncomplete,
  };
}

export function buildFinalPolishGroupSummary(): FinalPolishGroupSummary[] {
  return GROUP_ORDER.map((group) => {
    const items = FINAL_POLISH_ROADMAP.filter((i) => i.group === group);
    return {
      group,
      title: GROUP_TITLES[group],
      itemCount: items.length,
      completedCount: items.filter((i) => i.status === 'completed').length,
      inProgressCount: items.filter((i) => i.status === 'in_progress').length,
      blockedCount: items.filter((i) => i.status === 'blocked').length,
    };
  });
}

export function buildFinalPolishMandatoryChecklist(): string[] {
  return FINAL_POLISH_ROADMAP.filter((i) => i.priority === 'mandatory').map((i) => {
    const statusMark =
      i.status === 'completed' ? '[x]' : i.status === 'in_progress' ? '[~]' : '[ ]';
    return `${statusMark} ${i.title} — ${i.acceptanceChecks.join('; ')}`;
  });
}

export function buildFinalPolishNextRecommendedStep(): string {
  const mainPath = FINAL_POLISH_ROADMAP.filter((i) => i.group !== 'ai_later');
  const next = mainPath.find(
    (i) => i.status === 'planned' && i.id !== 'scope-freeze-final-polish-guard',
  );
  if (next) {
    return `Sonraki önerilen adım: ${next.title} (${next.id})`;
  }
  const inProgress = mainPath.find((i) => i.status === 'in_progress');
  if (inProgress) {
    return `Devam eden adım: ${inProgress.title} (${inProgress.id})`;
  }
  return 'Tüm main-path maddeleri tamamlandı veya later durumda.';
}

export function buildFinalPolishBlockedItems(): string[] {
  return FINAL_POLISH_ROADMAP.filter((i) => i.status === 'blocked').map(
    (i) => `${i.title}: ${i.description}`,
  );
}

export function buildFinalPolishSoftLaunchReadinessText(): string {
  const lines: FinalPolishReadinessLine[] = [];
  const summary = buildFinalPolishRoadmapSummary();

  if (summary.mandatoryIncomplete > 0) {
    lines.push({
      severity: 'blocker',
      message: `${summary.mandatoryIncomplete} mandatory madde henüz tamamlanmadı.`,
    });
  }

  const analytics = FINAL_POLISH_ROADMAP.find((i) => i.id === 'analytics-sdk-adapter');
  if (analytics && analytics.status !== 'completed') {
    lines.push({
      severity: 'fail',
      message:
        'Analytics: runtime instrumentation tamam; gerçek SDK ve dashboard funnel eksik (launch_candidate blocker).',
    });
  }

  const incompleteCritical = FINAL_POLISH_ROADMAP.filter(
    (i) => i.priority === 'critical' && isIncomplete(i) && i.group !== 'ai_later',
  );
  if (incompleteCritical.length > 0) {
    lines.push({
      severity: 'warn',
      message: `${incompleteCritical.length} critical madde planlı / devam ediyor.`,
    });
  }

  const aiOnMainPath = FINAL_POLISH_ROADMAP.some(
    (i) => i.group !== 'ai_later' && i.id.startsWith('ai-'),
  );
  if (aiOnMainPath) {
    lines.push({
      severity: 'fail',
      message: 'Runtime AI maddesi final polish main path üzerinde — taşınmalı.',
    });
  }

  for (const guard of FINAL_POLISH_GUARDS) {
    if (guard.severity === 'info') continue;
    lines.push({
      severity: guard.severity,
      message: `[${guard.id}] ${guard.title}: ${guard.expectedBehavior}`,
    });
  }

  const blockers = lines.filter((l) => l.severity === 'blocker').length;
  const fails = lines.filter((l) => l.severity === 'fail').length;
  const warns = lines.filter((l) => l.severity === 'warn').length;

  const header = `Soft Launch Readiness — blocker: ${blockers}, fail: ${fails}, warn: ${warns}`;
  const body = lines.map((l) => `${l.severity.toUpperCase()}: ${l.message}`).join('\n');

  return `${header}\n${body}`;
}

export function buildFinalPolishRoadmapReportText(): string {
  const summary = buildFinalPolishRoadmapSummary();
  const groups = buildFinalPolishGroupSummary();
  const mandatory = buildFinalPolishMandatoryChecklist();
  const next = buildFinalPolishNextRecommendedStep();
  const blocked = buildFinalPolishBlockedItems();
  const readiness = buildFinalPolishSoftLaunchReadinessText();

  const groupLines = groups
    .map(
      (g) =>
        `- ${g.title}: ${g.itemCount} madde (${g.completedCount} tamam, ${g.inProgressCount} devam, ${g.blockedCount} blok)`,
    )
    .join('\n');

  return [
    '# Final Polish Roadmap Report',
    '',
    `Toplam: ${summary.totalItems} madde`,
    `Mandatory eksik: ${summary.mandatoryIncomplete}`,
    `Critical/Mandatory eksik: ${summary.criticalIncomplete}`,
    '',
    '## Gruplar',
    groupLines,
    '',
    '## Mandatory Checklist',
    ...mandatory,
    '',
    '## Sonraki Adım',
    next,
    '',
    '## Bloklu',
    ...(blocked.length > 0 ? blocked : ['(yok)']),
    '',
    '## Soft Launch Readiness',
    readiness,
  ].join('\n');
}
