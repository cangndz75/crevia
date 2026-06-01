import { EVENT_WRITING_STANDARDS } from './eventWritingStandards';
import type {
  EventWritingAuditResult,
  EventWritingQualityLayer,
  EventWritingSummary,
} from './contentQualityTypes';

const LAYER_LABELS: Record<EventWritingQualityLayer, string> = {
  district_context: 'Mahalle bağlamı',
  concrete_scene: 'Somut saha',
  affected_actor: 'Aktör',
  operational_domain: 'Operasyon domain',
  short_term_gain: 'Bugünkü kazanç',
  trade_off: 'Trade-off',
  carry_over: 'Carry-over',
  echo: 'Echo',
};

export function buildEventWritingScoreLabel(score: number): string {
  if (score >= 80) return 'PASS';
  if (score >= 60) return 'WARN';
  return 'FAIL';
}

export function formatEventWritingAuditResult(result: EventWritingAuditResult): string {
  const lines = [
    `[${result.status.toUpperCase()}] ${result.eventId} (${result.score}) — ${result.title}`,
    `  domain: ${result.inferredDomain ?? '—'} | source: ${result.source}`,
  ];
  if (result.missingLayers.length > 0) {
    lines.push(`  missing: ${result.missingLayers.map((l) => LAYER_LABELS[l]).join(', ')}`);
  }
  if (result.suggestedFixes.length > 0) {
    lines.push(`  fix: ${result.suggestedFixes[0]}`);
  }
  return lines.join('\n');
}

export function formatEventWritingSummary(summary: EventWritingSummary): string {
  return [
    '=== Event Writing Batch Audit ===',
    `total: ${summary.total} | pass: ${summary.pass} | warn: ${summary.warn} | fail: ${summary.fail}`,
    `averageScore: ${summary.averageScore}`,
    `weakLayers: ${summary.weakLayers.map((l) => LAYER_LABELS[l]).join(', ') || '—'}`,
    `strongLayers: ${summary.strongLayers.map((l) => LAYER_LABELS[l]).join(', ') || '—'}`,
    `next: ${summary.nextRecommendedContentPack}`,
  ].join('\n');
}

export function buildEventWritingStandardMarkdown(): string {
  const lines = ['# Event Writing Standard (8 Katman)', ''];
  for (const def of EVENT_WRITING_STANDARDS) {
    lines.push(`## ${def.title} (\`${def.layer}\`)`);
    lines.push(def.description);
    lines.push('');
    lines.push('**PASS örnekleri:**');
    for (const ex of def.passExamples) {
      lines.push(`- ${ex}`);
    }
    lines.push('');
    lines.push('**FAIL örnekleri:**');
    for (const ex of def.failExamples) {
      lines.push(`- ${ex}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

export function buildEventWritingNextStep(summary: EventWritingSummary): string {
  return `Sonraki adım: ${summary.nextRecommendedContentPack}`;
}

export function buildEventWritingLayerChecklist(result: EventWritingAuditResult): string[] {
  return EVENT_WRITING_STANDARDS.map((def) => {
    const ok = !result.missingLayers.includes(def.layer);
    return `${ok ? '[x]' : '[ ]'} ${def.title}`;
  });
}
